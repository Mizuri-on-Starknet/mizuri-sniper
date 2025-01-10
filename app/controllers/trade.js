import { ethers } from "ethers";
import {
  factoeryMainnet,
  factoryTestnet,
  smartContractMainnetAddress,
  smartContractTestnetAddress
} from "./contract/contractAddress.js";
import { err, globals, log } from "../utils/globals.js";
import User from "../Schema/User.js";
import { decrypt } from "./encryption.js";
import { fetchETH } from "./fetchBalance.js";
import { BN } from "bn.js";
import { EthPrice, poolInfo, tokenInfo, tokenPrice } from "../utils/prices.js";
import mongoose from "mongoose";
import { pusher } from "./mongo.js";
import { fromCustomLamport } from "../utils/converters.js";
import { addSnipe } from "../database/snipe.js";

const db = mongoose.connection;

const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const factoryAbi = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const pairAbi = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// TODO change WETH address from sepolia to mainnet
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// const WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"; // testnet
// const uniswapV2FactorySepoliaIsh = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const factoryContract = factoeryMainnet;
// const factoryContract =  factoryTestnet;
const routerContract = smartContractTestnetAddress; // mainnet router
// const routerContract = smartContractMainnetAddress;

export const snipe = async (bot) => {
  try {
    // const provider = new ethers.WebSocketProvider(globals.infuraSepoliaWss);
    const provider = new ethers.WebSocketProvider(globals.infuraMainnetWss); // testnet

    const factory = new ethers.Contract(factoryContract, factoryAbi, provider);

    factory.on("PairCreated", async (token0, token1, pairAddress) => {
      log(
        `New pair detected\n=================\ntoken0: ${token0}\ntoken1: ${token1}\npairAddress: ${pairAddress}`
      );

      const pool = new ethers.Contract(pairAddress, pairAbi, provider);
      const reserves = await pool.getReserves();
      log(" ======= reserves =====");
      log(reserves);
      let tokenIn, tokenOut, reserveEth;
      if (token0 === WETH) {
        reserveEth = reserves[0];
        tokenIn = token0;
        tokenOut = token1;
      } else if (token1 == WETH) {
        reserveEth = reserves[1];
        tokenIn = token1;
        tokenOut = token0;
      } else {
        log(" ==== undefined tokenIn ====");
        return;
      }

      const marketCapp = await poolInfo(pairAddress);
      const marketCap = marketCapp.attributes["market_cap_usd"];
      const reserveInUsd = marketCapp.attributes["reserve_in_usd"];

      const users = await User.find({ snipe: 1 }).lean();
      log(" ===================== ");
      log(users);
      users.map(async (item, index) => {
        const privateKey = decrypt(item.encrypted_mnemonnics);
        const walletAddress = item.walletAddress;

        const wallet = new ethers.Wallet(privateKey);
        const account = wallet.connect(provider);

        const router = new ethers.Contract(routerContract, routerAbi, account);

        const userBalance = await fetchETH(walletAddress);
        let buyAmount;

        if (item.buyType == 0) {
          buyAmount = (userBalance * (item.buyAmount / 100)).toFixed(3);
        } else {
          buyAmount = item.buyAmount;
        }
        // TODO add buyTax
        // item.maxBuyTax >= item.maxBuyTax
        if (buyAmount > 0 && Number(userBalance) > 0.0005) {
          if (
            marketCap <= item.maxMarketCap &&
            reserveInUsd <= item.maxLiquidity &&
            reserves.reserve1 >= item.minMarketCap &&
            reserveInUsd >= item.minLiquidity
          ) {
            // All conditions are met, take the trade
            const amountIn = ethers.parseUnits(buyAmount, "ether");

            const amounts = await router.getAmountsOut(amountIn, [
              tokenIn,
              tokenOut
            ]);
            //Our execution price will be a bit different, we need some flexbility
            const amountOutMin = new BN(amounts[1]).sub(
              new BN(amounts[1]).divn(10)
            );

            log("All conditions are met. Taking the trade...");
            //           log(`
            //   Buying new token
            //   =================
            //   tokenIn: ${amountIn.toString()} ${tokenIn} (WETH)
            //   tokenOut: ${amountOutMin.toString()} ${tokenOut}
            // `);
            const tTokenInfo = await tokenInfo(tokenOut);
            const tokenPrice = tTokenInfo.attributes["price_usd"];
            const tokenContractAddress = tokenOut;
            const entryMarketCap = marketCap;
            const poolAddress = pairAddress;
            const amountPurchased = buyAmount;
            const now = Date.now();

            try {
              const tx = await router.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                [tokenIn, tokenOut],
                addresses.recipient,
                now + 1000 * 60 * 10
              );

              const receipt = await tx.wait();
              let takeProfit;
              let stopLoss;
              if (item.sellType == 0) {
                takeProfit = tokenPrice + tokenPrice * Number(item.sellAmount);
                stopLoss = tokenPrice - tokenPrice * Number(item.sellAmount);
              } else {
                const multiplier = 1 + Number(item.sellAmount) / 100;
                takeProfit = tokenPrice * multiplier;
              }

              await addSnipe(item.username, {
                tokenContractAddress,
                entryMarketCap,
                poolAddress,
                amountPurchased,
                pairName: marketCapp.attributes["name"],
                tradeOpened: now,
                takeProfit,
                stopLoss
              });

              bot.sendMessage(
                item.username,
                "cheers 🎉, you got into a trade. Here's your transaction hash " +
                  tx.hash
              );
            } catch (error) {
              bot.sendMessage(
                item.username,
                "Error occured Making Trade, do you have enough balance? "
              );
            }
            // Add code to take the trade here
          } else {
            log("Conditions are not met. Skipping the trade...");
          }
        }
      });
    });
  } catch (error) {
    log(" ======= error from snipe ======");
    err(error);
  }
};
