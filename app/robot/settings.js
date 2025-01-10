import {
  dextoolsAudit,
  fetchSpecificTokenBalance,
  fetchTokenBalances
} from "../controllers/moralis/moralis.js";
import { Markup } from "telegraf";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const env = process.env;
import {
  clearMaxLiq,
  clearMaxSellTax,
  clearMinLiq,
  clearMinMC,
  clearSellHi_x,
  clearMaxBuyTax,
  defaullWallet,
  triggerSnipe,
  clearSellLoAmount,
  clearSellHiAmount,
  clearMaxMC,
  clearSellLo_x,
  triggerBuyType,
  triggerSellType
} from "../controllers/settings.js";
import { findUser } from "../database/users.js";
import { fromCustomLamport } from "../utils/converters.js";
import { err, log } from "../utils/globals.js";
import {
  buyMessage,
  buyOptions,
  buySettings,
  fastFastClose,
  removeFromPreSnipeList,
  sellOptions,
  sellSettings,
  settingsInlineKeyboard,
  showResetWallets,
  truncateText
} from "../utils/keyboards.js";
import {
  buyAddress,
  preSniper,
  selectToken,
  state,
  withdrawState
} from "../index.js";
import { fetchETH } from "../controllers/fetchBalance.js";
import {
  chain,
  EthPrice,
  pro_endpoint,
  tokenVariantPrice
} from "../utils/prices.js";
import { transferBrock } from "../controllers/wallet/transfer.js";

export const settingsHandler = async (ctx) => {
  let username = ctx.from.id.toString();
  if (!username && ctx.from && ctx.from.id) {
    username = ctx.from.id.toString();
  }
  try {
    const keyBoardState = await settingsInlineKeyboard(username);
    await ctx.reply(" ⚙️ Settings ", keyBoardState);
  } catch (error) {
    log("==== error from settingsHandler ====");
    err(error);
  }
};

export const vanish = async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const messageId = ctx.callbackQuery.message.message_id; // Adjust the message ID as needed

    if (messageId > 0) {
      await ctx.telegram.deleteMessage(chatId, messageId);
    } else {
      await ctx.reply("No previous message to delete.");
    }
  } catch (error) {
    console.error("Error deleting message:", error);
  }
};

export const buyPrompt = async (ctx) => {
  await ctx.reply(" 📑 paste token contract address here. 👇");
};

export const triggerAutoBuy = async (ctx) => {
  let username = ctx.from.id.toString();

  try {
    await triggerSnipe(username);
    const keyBoardState = await settingsInlineKeyboard(username);
    await ctx.editMessageReplyMarkup(keyBoardState.reply_markup);
  } catch (error) {
    log("==== error from triggerAutoBuy ====");
    err(error);
  }
};

export const fetchDefaultWallet = async (telegramId) => {
  const userDefaultAddress = await defaullWallet(telegramId);
  return userDefaultAddress;
};

export const pullUpBuySettings = async (ctx) => {
  let username = ctx.from.id.toString();
  let user = await findUser(username);

  try {
    await ctx.editMessageReplyMarkup(buySettings(user).reply_markup);
  } catch (error) {
    log("==== error from pullUpBuySettings ====");
    err(error);
  }
};

export const preSnipeMenu = async (ctx) => {
  let username = ctx.from.id.toString();
  if (!preSniper[username]) {
    preSniper[username] = preSniper[username] = {
      state: "awaiting_snipe",
      trade: {
        userAddress: "",
        contractAddress: "",
        encrypted_mnemonics: "",
        amount: "",
        walletIndex: ""
      }
    };
  }
  await ctx.reply(
    "paste CA to snipe here 👇\n⚠️ Make sure it's correct.\n❌ Close this menu before initiating manual 🟢 Buy",
    removeFromPreSnipeList
  );
};

export const closePreSnipe = async (ctx) => {
  let username = ctx.from.id.toString();
  if (preSniper[username]) {
    delete preSniper[username];
  }
  await vanish(ctx);
};

export const closePreSnipeWithUsername = async (username) => {
  if (preSniper[username]) {
    delete preSniper[username];
  }
};

export const pullUpSellSettings = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await ctx.editMessageReplyMarkup(sellSettings.reply_markup);
  } catch (error) {
    log("==== error from pullUpSellSettings ====");
    err(error);
  }
};

export const backToSettings = async (ctx) => {
  let username = ctx.from.id.toString();

  try {
    const keyBoardState = await settingsInlineKeyboard(username);
    await ctx.editMessageReplyMarkup(keyBoardState.reply_markup);
  } catch (error) {
    log("==== error from backToSettings ====");
    err(error);
  }
};

export const doShowResetWallets = async (ctx) => {
  try {
    let username = ctx.from.id.toString();
    let user = await findUser(username);
    let userWallets = user.wallets;
    const keyboardResponse = await showResetWallets(userWallets);

    await ctx.editMessageReplyMarkup(keyboardResponse.reply_markup);
  } catch (error) {
    log("==== error from doShowResetWallets ====");
    err(error);
  }
};

export const switchToSell = async (ctx) => {
  try {
    let username = ctx.from.id.toString();
    const user = await findUser(username);
    const userAddress = user.walletAddress;

    const userBalance = await fetchETH(user.walletAddress);
    const balanceWorth = await EthPrice(userBalance);
    const contractAddress = buyAddress[username].attributes.address;

    const tokenBalance = await fetchSpecificTokenBalance(
      userAddress,
      contractAddress
    );

    let formattedBalance = fromCustomLamport(
      tokenBalance[0]?.balance || 0,
      tokenBalance[0]?.decimals || 0
    );

    await axios
      .get(`${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`, {
        headers: {
          "x-cg-pro-api-key": env.COINGECKO_API_KEY
        }
      })
      .then(async (response) => {
        log("===== response from geckoterminal ====");
        let poolData = "";
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
        // const option = buyOptions(
        //   contractAddress,
        //   user.defaultAddress,
        //   user.walletAddress,
        //   userBalance,
        //   balanceWorth,
        //   user.slippage ? user.slippage : "default",
        //   body.balance,
        //   tokenDetailEquivalence.brockBalance,
        //   tokenDetailEquivalence.usdBalance,
        //   truncateText(response.data.data.attributes.symbol, 5)
        // );
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
        await ctx.editMessageReplyMarkup(sellOption.reply_markup);
        // await ctx.editMessageReplyMarkup(buyOption.reply_markup);
      });

    // const sellOption = sellOptions(
    //   contractAddress,
    //   user.defaultAddress,
    //   user.walletAddress,
    //   userBalance,
    //   balanceWorth
    // );
    // await ctx.editMessageReplyMarkup(sellOption.reply_markup);
  } catch (error) {
    log("==== error from switchToSell ====");
    err(error);
  }
};

export const switchToBuy = async (ctx) => {
  try {
    let username = ctx.from.id.toString();
    const user = await findUser(username);
    const userAddress = user.walletAddress;

    const userBalance = await fetchETH(user.walletAddress);
    const balanceWorth = await EthPrice(userBalance);
    const contractAddress = buyAddress[username].attributes.address;

    const tokenBalance = await fetchSpecificTokenBalance(
      userAddress,
      contractAddress
    );

    let formattedBalance = fromCustomLamport(
      tokenBalance[0]?.balance || 0,
      tokenBalance[0]?.decimals || 0
    );

    await axios
      .get(`${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`, {
        headers: {
          "x-cg-pro-api-key": env.COINGECKO_API_KEY
        }
      })
      .then(async (response) => {
        log("===== response from geckoterminal ====");
        let poolData = "";
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
        const buyOption = buyOptions(
          contractAddress,
          user.defaultAddress,
          user.walletAddress,
          userBalance,
          balanceWorth,
          user.slippage ? user.slippage : "default",
          body.balance,
          tokenDetailEquivalence.brockBalance,
          tokenDetailEquivalence.usdBalance,
          truncateText(response.data.data.attributes.symbol, 5)
        );
        // const sellOption = sellOptions(
        //   contractAddress,
        //   user.defaultAddress,
        //   user.walletAddress,
        //   userBalance,
        //   balanceWorth,
        //   body.balance,
        //   tokenDetailEquivalence.brockBalance,
        //   tokenDetailEquivalence.usdBalance,
        //   truncateText(response.data.data.attributes.symbol, 5)
        // );

        await ctx.editMessageReplyMarkup(buyOption.reply_markup);
      });
    // const buyOption = buyOptions(
    //   contractAddress,
    //   user.defaultAddress,
    //   user.walletAddress,
    //   userBalance,
    //   balanceWorth,
    //   user.slippage ? user.slippage : "default"
    // );
  } catch (error) {
    log("==== error from switchToBuy ====");
    err(error);
  }
};

export const doClearMinMcap = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMinMC(username);
  } catch (error) {
    log("==== error from clearMcap ====");
    err(error);
  }
};

export const doClearMaxMcap = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMaxMC(username);
  } catch (error) {
    log("==== error from clearMcap ====");
    err(error);
  }
};

export const doClearMinLiq = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMinLiq(username);
  } catch (error) {
    log("==== error from clearMinLiq ====");
    err(error);
  }
};
export const doClearMaxLiq = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMaxLiq(username);
  } catch (error) {
    log("==== error from clearMaxLiq ====");
    err(error);
  }
};

export const doClearMaxBuyTax = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMaxBuyTax(username);
  } catch (error) {
    log("==== error from clearMinBuyTax ====");
    err(error);
  }
};

export const doClearMaxSellTax = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearMaxSellTax(username);
  } catch (error) {
    log("==== error from clearMinBuyTax ====");
    err(error);
  }
};

export const doClearSellHi_x = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearSellHi_x(username);
  } catch (error) {
    log("==== error from clearSellHix ====");
    err(error);
  }
};

export const doClearSellLo_x = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearSellLo_x(username);
  } catch (error) {
    log("==== error from clearSellLox ====");
    err(error);
  }
};

export const doClearSellHiAmount = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearSellHiAmount(username);
  } catch (error) {
    log("==== error from clearSellHiAmount ====");
    err(error);
  }
};

export const doClearSellLoAmount = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    await clearSellLoAmount(username);
  } catch (error) {
    log("==== error from clearSellLoAmount ====");
    err(error);
  }
};

export const doSwitchBuyType = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    const user = await triggerBuyType(username);

    await ctx.editMessageReplyMarkup(buySettings(user).reply_markup);
  } catch (error) {
    log("==== error from doSwitchBuyType ====");
    err(error);
  }
};

export const doSwitchSellType = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    const user = await triggerSellType(username);

    await ctx.editMessageReplyMarkup(buySettings(user).reply_markup);
  } catch (error) {
    log("==== error from doSwitchSellType ====");
    err(error);
  }
};

export const pullUpViewSettings = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    let user = await findUser(username);

    await ctx.replyWithHTML(
      `Here are your configured settings ⛽️\n==========================\n<code>Buy Type                   ${
        user.buyType == 0 ? "percentage" : "x units"
      }\nSell Type                  ${
        user.sellType == 0 ? "percentage" : "x units"
      }\nBuy Amount                 ${user.buyAmount || 0}</code>`,
      fastFastClose
    );
  } catch (error) {
    log("==== error from pullUpViewSettings ====");
    err(error);
  }
};
// export const pullUpViewSettings = async (ctx) => {
//   let username = ctx.from.id.toString();
//   try {
//     let user = await findUser(username);

//     await ctx.replyWithHTML(
//       `Here are your configured settings ⛽️\n==========================\n<code>Auto Snipe                 ${
//         user.snipe == 0 ? "false" : "true"
//       }\nBuy Type                   ${
//         user.buyType == 0 ? "percentage" : "x units"
//       }\nSell Type                  ${
//         user.sellType == 0 ? "percentage" : "x units"
//       }\nBuy Amount                 ${
//         user.buyAmount || 0
//       }\nSell Amount                ${
//         user.sellAmount || 0
//       }\nSnipe Minimum Market Cap   $${
//         user.minmiumMC
//       }\nSnipe Maximum Market Cap   $${
//         user.maxMC
//       }\nSnipe Minimum Liquidity    $${
//         user.minmiumLiq
//       }\nSnipe Max Liquidity        $${
//         user.maxLiq
//       }\nSnipe Max Sell Tax         ${
//         user.maxSellTax
//       }%\nTrade Sell Hi Percent      ${
//         user.sellHiAmount
//       }%\nTrade Sell Hi x            ${
//         user.sellHix
//       }\nTrade Sell Lo x            ${
//         user.sellLox
//       }\nTrade Sell Lo Percent      ${user.sellLoAmount}\n</code>`,
//       fastFastClose
//     );
//   } catch (error) {
//     log("==== error from pullUpViewSettings ====");
//     err(error);
//   }
// };

// \nSnipe Max Buy Tax          ${
//         user.maxBuyTax
//       }%

// export const sellMenu = async (ctx) => {
//   let username = ctx.from.id.toString();
//   try {
//     const userAddress = await findUser(username);
//     const walletBalances = await fetchTokenBalances(userAddress.walletAddress);

//     walletBalances.length > 0
//       ? await ctx.reply(
//           `here are your open orders,
// we only show token balances above 0.005 units`,
//           Markup.inlineKeyboard(
//             walletBalances.map((e) => {
//               log(fromCustomLamport(e.balance, e.decimals));
//               // if (!e.possible_spam) {
//               return Markup.button.callback(
//                 `${fromCustomLamport(e.balance, e.decimals).toFixed(3)} ${
//                   e.symbol
//                 }`.toString(),
//                 `${e.token_address.toString()}`
//               );
//               // }
//             }),
//             { columns: 2 }
//           )
//         )
//       : await ctx.reply(
//           "No open Positions",
//           Markup.inlineKeyboard([
//             [Markup.button.callback("❌ Close ", "vanish")]
//           ])
//         );
//   } catch (error) {
//     log(" ======== error from sellMenu =========");
//     err(error);
//   }
// };
export const sellMenu = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    const userAddress = await findUser(username);
    const walletBalances = await fetchTokenBalances(userAddress.walletAddress);

    selectToken[username] = { tokenIndex: 0 };
    selectToken[username].max = walletBalances.length - 1;
    selectToken[username].tokens = walletBalances;

    let e = walletBalances[selectToken[username].tokenIndex];
    if (walletBalances.length > 0) {
      const switchingKeyboard = Markup.inlineKeyboard([
        Markup.button.callback(`⏪ Prev`, `prev`),
        Markup.button.callback(`${e.name}`, `${e.token_address.toString()}`),
        Markup.button.callback(`⏩ Next`, `next`)
      ]);
      await ctx.reply(
        "here are your open orders, we only show token balances above 0.005 units",
        switchingKeyboard
      );
    } else {
      await ctx.reply(
        "No open Positions",
        Markup.inlineKeyboard([[Markup.button.callback("❌ Close ", "vanish")]])
      );
    }
  } catch (error) {
    log(" ======== error from sellMenu =========");
    err(error);
  }
};

export const yesTransfer = async (ctx) => {
  let username = ctx.from.id.toString();
  const user = withdrawState[username];
  try {
    if (withdrawState[username]) {
      const transaction = await transferBrock(
        user.fromWalletAddress,
        user.toWalletAddress,
        user.amount,
        user.encrypted_mnemonnics
      );
      await ctx.replyWithHTML(
        `<b>📤️ Withdrawal successful</b>\n <a href="https://explorer.bit-rock.io/tx/${transaction}">Transaction Hash</a>`
      );
      delete withdrawState[username];
    }
  } catch (error) {
    log(" ======== error from yesTransfer =========");
    err(error);
    await ctx.replyWithHTML(
      `<b>❌ Withdrawal Failed</b> ${error?.error?.message || "😵‍💫"}`
    );
  }
};

export const noTransfer = async (ctx) => {
  let username = ctx.from.id.toString();
  const user = withdrawState[username];
  try {
    if (withdrawState[username]) {
      delete withdrawState[username];
      await ctx.replyWithHTML(`❌ Cancelled Withdrawal`);
    }
  } catch (error) {
    log(" ======== error from yesTransfer =========");
    err(error);
  }
};
