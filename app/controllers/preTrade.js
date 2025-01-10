import { ethers, Interface } from "ethers";
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
import PreSnipes from "../Schema/PreSnipes.js";
import { changePreSnipeState } from "../database/preSnipe.js";
import { useContract, useSniper } from "./contract/swap.js";

const db = mongoose.connection;

const routerAbi = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const factoryAbi = [
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
];

const contractAbi = ["function Enable_Trading()"];
const contractInterface = new Interface(contractAbi);
const methodSignature =
  contractInterface.getFunction("Enable_Trading").selector;

const pairAbi = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// TODO change WETH address from sepolia to mainnet
const WETH = "0x413f0E3A440abA7A15137F4278121450416882d5";
// const WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9"; // testnet
// const uniswapV2FactorySepoliaIsh = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const factoryContract = factoeryMainnet;

// testnet factory "0x7E0987E5b3a30e3f2828572Bb659A548460a3003" ||
// const factoryContract =  factoryTestnet;
const routerContract = smartContractTestnetAddress; // mainnet router
// const routerContract = smartContractMainnetAddress;

// export const preSnipeAction = async (bot) => {
//   try {
//     // const provider = new ethers.WebSocketProvider(globals.infuraSepoliaWss);
//     const provider = new ethers.JsonRpcProvider(globals.infuraSepolia); // testnet

//     // const factory = new ethers.Contract(factoryContract, factoryAbi, provider);

//     provider.on("pending", async (txHash) => {
//       try {
//         const tx = await provider.getTransaction(txHash);
//         log(txHash + "\n" + "from SNiper");
//         const waitingUsers = await PreSnipes.find({
//           "snipes.isActive": 0
//         }).lean();

//         log("==== open snipes all users =====");
//         log(waitingUsers);

//         waitingUsers.map(async (currentTrade) => {
//           if (tx && tx.to) {
//             // Check if the input data matches the method signature

//             let contractIndex = currentTrade.snipes.findIndex(
//               (snipeContractAddress) =>
//                 snipeContractAddress.tokenContractAddress.toLowerCase() ==
//                 tx.to.toLowerCase()
//             );
//             log("===== contract index =====", contractIndex);

//             if (contractIndex !== -1) {
//               if (tx.data.startsWith(methodSignature)) {
//                 const decodedData = contractInterface.decodeFunctionData(
//                   "Enable_Trading",
//                   tx.data
//                 );
//                 console.log(
//                   `Method EnableTrading was called with args:`,
//                   decodedData
//                 );
//                 // Execute your logic here
//                 const currentUser = {
//                   username: currentTrade.username
//                 };

//                 // const currentUser = await User.findOne({
//                 //   username: currentTrade.username
//                 // });

//                 if (currentUser) {
//                   log(
//                     "=== found user %s awaiting trade ===",
//                     currentUser.username
//                   );
//                   // const userBalance = await fetchETH(currentUser.walletAddress);
//                   let buyAmount = currentTrade.snipes[contractIndex].amount;

//                   log(
//                     "=== taking trade on behalf of user %s and amount %d ===",
//                     currentUser.username,
//                     buyAmount
//                   );

//                   try {
//                     await changePreSnipeState(
//                       currentTrade.username,
//                       currentTrade.snipes[contractIndex].tokenContractAddress,
//                       1
//                     );
//                     const tookTrade = await useContract(
//                       currentUser.walletAddress,
//                       currentTrade.snipes[contractIndex].tokenContractAddress,
//                       decrypt(
//                         currentTrade.snipes[contractIndex]
//                           ?.encrypted_mnemonnics ||
//                           currentUser.encrypted_mnemonnics
//                       ),
//                       "",
//                       "",
//                       "",
//                       buyAmount.toString(),
//                       ""
//                     );
//                     // await changePreSnipeState(
//                     //   currentTrade.username,
//                     //   currentTrade.snipes[contractIndex].tokenContractAddress,
//                     //   1
//                     // );
//                     await bot.sendMessage(
//                       currentUser.username,
//                       `<b>cheers 🪄🎉, you sniped a pool. Here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/search-results?q=${tookTrade.hash}"> view on explorer ${tookTrade.hash} </a>`,
//                       { parse_mode: "HTML" }
//                     );
//                   } catch (errr) {
//                     log(" ==== error from making transaction ====", errr);
//                     await bot.sendMessage(
//                       currentUser.username,
//                       `<b>snipe failed 😓, something went wrong sniping pool</b>`,
//                       { parse_mode: "HTML" }
//                     );
//                   }
//                 } else {
//                   log("=== user isn't watching this token ===");
//                 }
//               }
//             }
//           }
//         });

//         // You can add more logic here, such as saving the event data to a database
//       } catch (error) {
//         console.error("Error parsing log:", error);
//       }
//     });

//     // factory.on("*", async (token0, token1, pairAddress) => {
//     //   log(
//     //     `New pair detected\n=================\ntoken0: ${token0}\ntoken1: ${token1}\npairAddress: ${pairAddress}`
//     //   );
//     //   const waitingUsers = await PreSnipes.find({
//     //     "snipes.isActive": 0
//     //   }).lean();

//     //   waitingUsers.map(async (currentTrade) => {
//     //     const currentUser = await User.findOne({
//     //       username: currentTrade.username
//     //     });
//     //     if (currentUser) {
//     //       log("=== found user %s awaiting trade ===", currentUser.username);
//     //       let tokenIn, tokenOut, reserveEth, contractIndex;
//     //       if (token0 === WETH) {
//     //         // reserveEth = reserves[0];
//     //         tokenIn = token0;
//     //         tokenOut = token1;
//     //       } else if (token1 == WETH) {
//     //         // reserveEth = reserves[1];
//     //         tokenIn = token1;
//     //         tokenOut = token0;
//     //       } else {
//     //         log(" ==== undefined tokenIn ====");
//     //         return;
//     //       }
//     //       contractIndex = currentTrade.snipes.findIndex(
//     //         (snipeContractAddress) =>
//     //           snipeContractAddress.tokenContractAddress == tokenOut
//     //       );
//     //       log("===== contract index =====", contractIndex);

//     //       if (contractIndex !== -1) {
//     //         const userBalance = await fetchETH(currentUser.walletAddress);
//     //         let buyAmount = currentTrade.amount;
//     //         // if (currentUser.buyType == 0) {
//     //         //   buyAmount = (userBalance * (currentUser.buyAmount / 100)).toFixed(
//     //         //     3
//     //         //   );
//     //         // } else {
//     //         //   buyAmount = currentUser.buyAmount;
//     //         // }
//     //         if (buyAmount > 0 && Number(userBalance) > 0.0005) {
//     //           log(
//     //             "=== taking trade on behalf of user %s and amount %d ===",
//     //             currentUser.username,
//     //             buyAmount
//     //           );
//     //           try {
//     //             const tookTrade = await useContract(
//     //               currentUser.walletAddress,
//     //               currentTrade.snipes[contractIndex].tokenContractAddress,
//     //               decrypt(currentUser.encrypted_mnemonnics),
//     //               "",
//     //               "",
//     //               "",
//     //               buyAmount.toString(),
//     //               ""
//     //             );
//     //             await changePreSnipeState(currentTrade.username, tokenOut, 1);
//     //             await bot.sendMessage(
//     //               currentUser.username,
//     //               `<b>cheers 🪄🎉, you sniped a pool. Here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/search-results?q=${tookTrade.hash}"> view on explorer ${tookTrade.hash} </a>`,
//     //               { parse_mode: "HTML" }
//     //             );
//     //           } catch (errr) {
//     //             log(" ==== error from making transaction ====", errr);
//     //           }
//     //         } else {
//     //           log(
//     //             "user %s doesnt have enough balance or buy amount",
//     //             currentUser.username
//     //           );
//     //         }
//     //       } else {
//     //         log("=== user isn't watching this token ===");
//     //       }
//     //     }
//     //   });
//     // });
//   } catch (error) {
//     log(" ======= error from snipe ======");
//     err(error);
//   }
// };

// most recent implementation for 3 seconds

// export const preSnipeAction = async (bot) => {
//   try {
//     const provider = new ethers.JsonRpcProvider(globals.infuraSepolia); // mainnet

//     provider.on("pending", async (txHash) => {
//       try {
//         const tx = await provider.getTransaction(txHash);
//         log(txHash + "\n" + "from SNiper");
//         const waitingUsers = await PreSnipes.find({
//           "snipes.isActive": 0
//         }).lean();

//         log("==== open snipes all users =====");
//         log(waitingUsers);

//         waitingUsers.map(async (currentTrade) => {
//           if (tx && tx.to) {
//             const matchingSnipes = currentTrade.snipes.filter(
//               (snipe) =>
//                 snipe.tokenContractAddress.toLowerCase() == tx.to.toLowerCase()
//             );

//             // log("===== matching snipes =====", matchingSnipes);

//             for (const snipe of matchingSnipes) {
//               if (tx.data.startsWith(methodSignature)) {
//                 const decodedData = contractInterface.decodeFunctionData(
//                   "Enable_Trading",
//                   tx.data
//                 );
//                 console.log(
//                   `Method EnableTrading was called with args:`,
//                   decodedData
//                 );

//                 const currentUser = {
//                   username: currentTrade.username
//                 };

//                 if (currentUser) {
//                   log(
//                     "=== found user %s awaiting trade ===",
//                     currentUser.username
//                   );
//                   let buyAmount = snipe.amount;

//                   // log(
//                   //   "=== taking trade on behalf of user %s and amount %d ===",
//                   //   currentUser.username,
//                   //   buyAmount
//                   // );

//                   try {
//                     const tookTrade = await useContract(
//                       currentUser.walletAddress,
//                       snipe.tokenContractAddress,
//                       decrypt(
//                         snipe.encrypted_mnemonnics ||
//                           currentUser.encrypted_mnemonnics
//                       ),
//                       "",
//                       "",
//                       "",
//                       buyAmount.toString(),
//                       ""
//                     );
//                     await bot.sendMessage(
//                       currentUser.username,
//                       `<b>cheers 🪄🎉, you sniped a pool. Here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/search-results?q=${tookTrade.hash}"> view on explorer ${tookTrade.hash} </a>`,
//                       { parse_mode: "HTML" }
//                     );
//                     await changePreSnipeState(
//                       currentTrade.username,
//                       snipe.tokenContractAddress,
//                       1
//                     );
//                   } catch (errr) {
//                     log(" ==== error from making transaction ====", errr);

//                     try {
//                       if (
//                         errr &&
//                         errr.info.error.message.includes(
//                           "Upfront cost exceeds account balance"
//                         )
//                       ) {
//                         await bot.sendMessage(
//                           currentUser.username,
//                           `<b>snipe failed 😓, something went wrong sniping pool</b>`,
//                           { parse_mode: "HTML" }
//                         );
//                       }

//                       await bot.sendMessage(
//                         currentUser.username,
//                         `<b>snipe failed 😓, something went wrong sniping pool</b>`,
//                         { parse_mode: "HTML" }
//                       );
//                     } catch (error) {
//                       log("final error block in catch === PreTrade.js:339");
//                       err(error);
//                     }
//                   }
//                 } else {
//                   log("=== user isn't watching this token ===");
//                 }
//               }
//             }
//           }
//         });
//       } catch (error) {
//         console.error("Error parsing log:", error);
//       }
//     });
//   } catch (error) {
//     console.error("Error in preSnipeAction:", error);
//   }
// };

const encapsulatedSniperFunction = async (bot) => {
  const provider = new ethers.JsonRpcProvider(globals.infuraSepolia); // mainnet

  provider.on("pending", async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx || !tx.to) return;

      // Fetch users with active snipes only once
      const waitingUsers = await PreSnipes.find({
        "snipes.isActive": 0
      }).lean();

      // Using Promise.all to process all users in parallel
      await Promise.all(
        waitingUsers.map(async (currentTrade) => {
          const matchingSnipes = currentTrade.snipes.filter(
            (snipe) =>
              snipe.tokenContractAddress.toLowerCase() === tx.to.toLowerCase()
          );

          await Promise.all(
            matchingSnipes.map(async (snipe) => {
              if (tx.data.startsWith(methodSignature)) {
                const decodedData = contractInterface.decodeFunctionData(
                  "Enable_Trading",
                  tx.data
                );

                const currentUser = {
                  username: currentTrade.username
                };

                if (currentUser) {
                  let buyAmount = snipe.amount;
                  log("this is a current snipe");
                  log(snipe);

                  // Use Promise.all to parallelize transaction and bot notification
                  await Promise.all([
                    (async () => {
                      try {
                        const tookTrade = await useSniper(
                          snipe.walletAddress,
                          snipe.tokenContractAddress,
                          decrypt(
                            snipe.encrypted_mnemonnics ||
                              currentUser.encrypted_mnemonnics
                          ),
                          snipe.decimals || "18",
                          "",
                          "",
                          buyAmount.toString(),
                          "",
                          "0.0005"
                        );

                        await bot.sendMessage(
                          currentUser.username,
                          `💳️ Wallet ${snipe?.walletIndex}\n${snipe.walletAddress}\n\n| Snipe <a href="https://explorer.bit-rock.io/tx/${tookTrade.hash}">Transaction</a> 🔫 Successful 🟢 |\n\n🪅 CA: ($${snipe?.tokenTicker})\n${snipe.tokenContractAddress}`,
                          { parse_mode: "HTML" }
                        );

                        await changePreSnipeState(
                          currentTrade.username,
                          snipe.tokenContractAddress,
                          1
                        );
                      } catch (errr) {
                        log("Error from making transaction:", errr);

                        const message = `💳️ Wallet ${snipe?.walletIndex}\n${snipe.walletAddress}\n\n| Snipe failed 🔫 Failed 🔴 |\n🪅 CA: ${snipe.tokenContractAddress}`;

                        // const message = `<b>snipe failed 😓, something went wrong sniping pool</b>`;
                        await bot.sendMessage(currentUser.username, message, {
                          parse_mode: "HTML"
                        });
                      }
                    })()
                  ]);
                } else {
                  log("User isn't watching this token");
                }
              }
            })
          );
        })
      );
    } catch (error) {
      console.error("Error parsing log:", error);
    }
  });
};

export const preSnipeAction = async (bot) => {
  try {
    await encapsulatedSniperFunction(bot);
  } catch (error) {
    console.error("Error in preSnipeAction:", error);
    console.log("retrying sniper ----- ::::");
    try {
      await encapsulatedSniperFunction(bot);
    } catch (error1) {
      console.error("Error in preSnipeAction Again:", error1);
      console.log("retrying sniper ----- ::::");
      try {
        await encapsulatedSniperFunction(bot);
      } catch (error2) {
        console.error("Error in preSnipeAction:", error2);
      }
    }
  }
};

// \n\n<b>cheers 🪄🎉, you sniped a pool. Here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/search-results?q=${tookTrade.hash}"> view on explorer ${tookTrade.hash} </a>
