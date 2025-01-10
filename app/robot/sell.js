import { decrypt, encrypt } from "../controllers/encryption.js";
import { findUser } from "../database/users.js";
import {
  buyAddress,
  pnlState,
  sellAddress,
  sellState,
  state,
  usersAwaitingAmount,
  usersAwaitingSell
} from "../index.js";
import { err, log } from "../utils/globals.js";
import { txError } from "../errors/txError.js";
import { swapBack, useContract } from "../controllers/contract/swap.js";
import { fastKeyboard } from "../utils/keyboards.js";
import { customSellForSpecificUser } from "./editSettings.js";
import { generateImage } from "../utils/generateImage.js";
import { tokenInfo } from "../utils/prices.js";

export const sell = async (ctx) => {
  try {
    let username = ctx.from.id.toString();

    log(ctx.match[0]);
    // ctx.answerCbQuery("hello");
    log("nigga pressed it for sell");
    // const amountToBuy = "5";
    const amountToBuy = ctx.match[0].toString();

    let user = username;

    const currentUser = await findUser(user);
    const userAddress = currentUser.walletAddress;
    //   const userAvaxBalance = currentUser.balance;
    const userEncryptedMnemonics = currentUser.encrypted_mnemonnics;

    const mnemonics = decrypt(userEncryptedMnemonics);
    let response = sellAddress[user];

    // TODO remove test contract address

    if (amountToBuy === "sell_custom") {
      sellState[username] = {
        state: "awaiting_custom_sell",
        trade: {
          userAddress: userAddress,
          contractAddress: response.attributes.address,
          encrypted_mnemonics: userEncryptedMnemonics,
          decimals: response.attributes.decimals,
          ticker: response.attributes.symbol,
          coinName: response.attributes.name
        }
      };
      log("user value is different");
      log("User wants a custom value for sell");
      //   awaitingCustomValue = true;
      await ctx.reply("Enter the custom value to sell: 👀 example 0.3 👇");
      // const customValue = await getUserInput(ctx);

      usersAwaitingSell.push(username);
      log(usersAwaitingSell[username]);

      return;
    }

    let validAmount = amountToBuy.replace("p", "");
    validAmount == "100" ? (validAmount = "100") : (validAmount = validAmount);
    log("valid amount ", validAmount);

    // TODO remove test contract address
    log("===response ==");
    log(response);

    try {
      // await ctx.reply("processing tx ⚡️ ==========");
      // await ctx.reply("processing gas ⛽️ ==========");

      const message = await ctx.replyWithHTML(
        `🔘 Submitting Transaction || Wallet ${
          currentUser.defaultAddress + 1
        } <a href="https://explorer.bit-rock.io/address/${
          currentUser.walletAddress
        }">${currentUser.walletAddress}</a>`,
        {
          link_preview_options: {
            is_disabled: true
          }
        }
      );
      const result = await swapBack(
        userAddress,
        response.attributes.address,
        mnemonics,
        response.attributes.decimals,
        response.attributes.symbol,
        response.attributes.name,
        validAmount,
        "",
        true,
        ctx,
        validAmount == "100" ? true : false
      );

      await ctx.deleteMessage(message.message_id);

      // TODO change snowtrace

      await ctx.replyWithHTML(
        `<b>📝 Transaction Approved || You sold </b> <a href="https://explorer.bit-rock.io/tx/${
          result.hash
        }">${result.amount} $${response.attributes.name} for approx. ${Number(
          result.amountOut
        ).toFixed(2)} $STRK</a> || 💳 Wallet ${
          currentUser.defaultAddress + 1
        } <a href="https://explorer.bit-rock.io/address/${result.hash}">${
          currentUser.walletAddress
        }</a>`,
        {
          link_preview_options: {
            is_disabled: true
          }
        }
      );

      // await ctx.replyWithHTML(
      //   `<b>cheers 🪄🎉 here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/tx/${result.hash}"> view on explorer ${result.hash}  </a>`,
      //   {
      //     link_preview_options: {
      //       is_disabled: true
      //     }
      //   }
      // );

      return;
    } catch (error) {
      await txError(error, ctx);
    }

    const customValue = ctx?.message?.text;
    usersAwaitingSell.includes(currentUser) &&
      (await customSellForSpecificUser(currentUser, customValue, ctx));
  } catch (error) {
    log(" error from custom sell ============");
    err(error);
  }
};

export const sendPnl = async (ctx) => {
  try {
    let username = ctx.from.id.toString();
    await ctx.reply(" 🌠 Loading PNL ...... ");
    log(" === pnlStae for testing ===");
    log(pnlState);

    const userStateTrade = pnlState[username].trade.contractAddress;

    const currentUser = await findUser(username);
    const userTrade = currentUser.trades[userStateTrade.toLowerCase()];

    log("user current user trade ======");
    log(currentUser);

    log("user state trade ======");
    log(userTrade);

    const tokenI = await tokenInfo(userStateTrade);
    const imageUrl = await generateImage(
      `${truncateText(userTrade?.tokenName)} / STRK`,
      "| SELL",
      userTrade.entryPrice,
      tokenI.attributes.price_usd
    );

    await ctx.replyWithPhoto(imageUrl.data.download_url_png);
  } catch (error) {
    log(" error from sendPnl ============");
    err(error);
    await ctx.reply(" 😵‍💫 Can't Find PNL for that trade ...... ");
  }
};

export const truncateText = (text, length) => {
  const maxLength = length || 6;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  } else {
    return text;
  }
};
