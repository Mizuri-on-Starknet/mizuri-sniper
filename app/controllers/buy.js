import axios from "axios";
import dotenv from "dotenv";
import { err, log } from "../utils/globals.js";
import {
  buyMessage,
  buyOptions,
  sellOptions,
  snipeOptions,
  truncateText
} from "../utils/keyboards.js";
import { buyAddress, pnlState, preSniper, sellAddress } from "../index.js";
import { findUser } from "../database/users.js";
import { dextoolsAudit, fetchSpecificTokenBalance } from "./moralis/moralis.js";
import { fromCustomLamport } from "../utils/converters.js";
import { getAverageGasLimit } from "./ethers/blockDetails.js";
import { fetchETH } from "./fetchBalance.js";
import {
  chain,
  EthPrice,
  pro_endpoint,
  tokenVariantPrice
} from "../utils/prices.js";
import { fetchHoneypot } from "./fetchHoneypot.js";
import { removeLeadingZeros } from "../utils/isWalletValid.js";

dotenv.config();
const env = process.env;

export const buyTrade = async (contractAddress, ctx, sell = false) => {
  try {
    let username = ctx.from.id.toString();

    log(contractAddress);

    contractAddress = removeLeadingZeros(contractAddress);

    const asynchronous = await Promise.all([
      findUser(username)
      // getAverageGasLimit()
    ]);
    const user = asynchronous[0];
    // const gasLimit = asynchronous[1];
    const userAddress = user.walletAddress;

    const tokenBalance = await fetchSpecificTokenBalance(
      userAddress,
      contractAddress
    );

    let formattedBalance = fromCustomLamport(
      tokenBalance[0]?.balance || 0,
      tokenBalance[0]?.decimals || 0
    );

    const userBalance = await fetchETH(userAddress);
    const balanceWorth = await EthPrice(userBalance);

    log(formattedBalance);
    let response_schema = {
      data: {
        id: "string",
        type: "string",
        attributes: {
          name: "string",
          address: "string",
          symbol: "string",
          decimals: 0,
          total_supply: "string",
          coingecko_coin_id: "string",
          price_usd: "string",
          fdv_usd: "string",
          total_reserve_in_usd: "string",
          volume_usd: {},
          market_cap_usd: "string"
        },
        relationships: {}
      }
    };
    await axios
      .get(`${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`, {
        headers: {
          "x-cg-pro-api-key": env.COINGECKO_API_KEY
        }
      })
      .then(async (response) => {
        log("===== response from geckoterminal ====");
        let poolData = "";
        let pool_response_schema = {
          id: "string",
          type: "string",
          attributes: {
            name: "string",
            address: "string",
            base_token_price_usd: "string",
            quote_token_price_usd: "string",
            base_token_price_native_currency: "string",
            quote_token_price_native_currency: "string",
            base_token_price_quote_token: "string",
            quote_token_price_base_token: "string",
            pool_created_at: "string",
            reserve_in_usd: "string",
            fdv_usd: "string",
            market_cap_usd: "string",
            price_change_percentage: {},
            transactions: {},
            volume_usd: {}
          },
          relationships: {}
        };
        if (response.data.data.relationships.top_pools.data.length > 0) {
          const pool = await axios.get(
            `${pro_endpoint}/networks/${chain}/pools/${
              response.data.data.relationships.top_pools.data[0].id.split(
                "starknet-alpha_"
              )[1]
            }`,
            {
              headers: {
                "x-cg-pro-api-key": env.COINGECKO_API_KEY
              }
            }
          );
          poolData = pool.data.data;
        }

        const dextools = await dextoolsAudit(contractAddress);

        //   log(response);
        const body = {
          balance: Number(formattedBalance).toFixed(3) || 0,
          buyTax: dextools.buyTax,
          sellTax: dextools.sellTax
        };

        const message = buyMessage(response, body, poolData);
        const tokenDetailEquivalence = await tokenVariantPrice(
          body.balance,
          contractAddress
        );
        const option = buyOptions(
          contractAddress,
          user.defaultAddress,
          user.walletAddress,
          userBalance,
          balanceWorth,
          user.slippage ? user.slippage : "default",
          body.balance,
          tokenDetailEquivalence.brockBalance,
          tokenDetailEquivalence.usdBalance,
          truncateText(response.data.data.attributes.symbol, 5),
          user.main_token
        );
        const sellOption = sellOptions(
          contractAddress,
          user.defaultAddress,
          user.walletAddress,
          userBalance,
          balanceWorth,
          body.balance,
          tokenDetailEquivalence.brockBalance,
          tokenDetailEquivalence.usdBalance,
          truncateText(response.data.data.attributes.symbol, 5)
        );

        // keyboard

        typeof sell == "string" && sell === "snipe"
          ? (async () => {
              await ctx.replyWithHTML(
                message,
                snipeOptions(
                  contractAddress,
                  user.defaultAddress,
                  user.walletAddress,
                  userBalance,
                  balanceWorth
                )
              );
              preSniper[username] = {
                state: "awaiting_snipe",
                trade: {
                  userAddress: user.walletAddress,
                  contractAddress: contractAddress,
                  encrypted_mnemonics: user.encrypted_mnemonnics,
                  decimals: response.data.data.attributes.decimals,
                  tokenName: response.data.data.attributes.name,
                  tokenTicker: response.data.data.attributes.symbol
                }
              };
            })()
          : typeof sell == "boolean" && sell == true
          ? (async () => {
              await ctx.replyWithHTML(message, sellOption);
              pnlState[username] = {
                state: "pnl",
                trade: {
                  userAddress: userAddress,
                  contractAddress: response.data.data.attributes.address,
                  decimals: response.data.data.attributes.decimals,
                  ticker: response.data.data.attributes.symbol,
                  tokenName: response.data.data.attributes.name
                }
              };
            })()
          : await ctx.replyWithHTML(message, option);
        // typeof sell == "boolean" && sell == true
        //   ? (sellAddress[username] = response.data.data)
        //   : (buyAddress[username] = response.data.data);

        sellAddress[username] = response.data.data;
        buyAddress[username] = response.data.data;
      });
  } catch (error) {
    err(error);
    err("couldn't fetch tokens");
    log(error);
    if (error.toString().toLowerCase().includes("moralis")) {
      await ctx.reply(
        " something went wrong 😵‍💫 \nplease reselect default address"
      );
    } else {
      await ctx.reply(" couldn't find any tokens there 😵‍💫");
    }
  }
};

// 0x9c0241e7538b35454735ae453423daf470a25b3a
