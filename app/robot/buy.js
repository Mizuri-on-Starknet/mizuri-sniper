import { decrypt, encrypt } from "../controllers/encryption.js";
import { findUser } from "../database/users.js";
import { buyAddress, state, usersAwaitingAmount } from "../index.js";
import { err, log } from "../utils/globals.js";
import { txError } from "../errors/txError.js";
import { useContract } from "../controllers/contract/swap.js";
import { buyDB } from "../controllers/settings.js";
import { truncateText } from "./sell.js";

export const buy = async (ctx) => {
  try {
    log(ctx.match[0]);
    log("nigga pressed it");
    // const amountToBuy = "5";
    const amountToBuy = ctx.match[0].toString();
    let user = ctx.from.id.toString();

    let response = buyAddress[user];
    log("response ===");
    log(response);

    const currentUser = await findUser(user);
    const userAddress = currentUser.walletAddress;
    // const userAvaxBalance = currentUser.balance;
    const userEncryptedMnemonics = currentUser.encrypted_mnemonnics;

    const mnemonics = decrypt(userEncryptedMnemonics);

    if (amountToBuy === "buy_custom") {
      log("aaaaaaahahhhhh");
      state[user] = {
        state: "awaiting_custom_amount",
        trade: {
          userAddress: userAddress,
          contractAddress: response.attributes.address,
          encrypted_mnemonics: userEncryptedMnemonics,
          decimals: response.attributes.decimals,
          ticker: response.attributes.symbol,
          coinName: response.attributes.name,
          entryPrice: response.attributes["price_usd"],
          entryMCAP: response.attributes["fdv_usd"]
        }
      };

      log("user value is different");
      log("User wants a custom value for buy");
      // awaitingCustomValue = true;
      await ctx.reply("Enter the custom value for buy: 👀 example 0.23 👇");
      // const customValue = await getUserInput(ctx);

      usersAwaitingAmount.push(user);
      log(usersAwaitingAmount[user]);

      return;
    }

    // testnet MYCOIN = 0xcd520AFabcfdA94f2fe3321ed0570CBFE2eD8A24
    // testnet USD =  0x7f11f79DEA8CE904ed0249a23930f2e59b43a385
    try {
      // TODO remove test contract address

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
      // await ctx.reply("processing gas ⛽️ ==========");
      const result = await useContract(
        userAddress,
        response.attributes.address,
        mnemonics,
        response.attributes.decimals,
        response.attributes.symbol,
        response.attributes.name,
        amountToBuy,
        currentUser.slippage ? currentUser.slippage : ""
      );

      log(" === hitting buydb for user -- normal buy ===");
      await buyDB(
        user,
        response.attributes.address.toLowerCase(),
        amountToBuy,
        response.attributes["price_usd"],
        response.attributes["fdv_usd"],
        response.attributes.name
      );
      await ctx.deleteMessage(message.message_id);
      await ctx.replyWithHTML(
        `<b>📝 Transaction Approved || You bought approx. </b> <a href="https://explorer.bit-rock.io/tx/${
          result.hash
        }">${Number(result.amountOut).toFixed(2)} $${
          response.attributes.name
        } for ${amountToBuy} $STRK</a> || 💳 Wallet ${
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
      //   `<b>cheers 🪄🎉 here's your transaction hash:</b>\n<a href="https://explorer.bit-rock.io/tx/${result.hash}"> view on explorer  ${result.hash} </a>`
      // );
      // await ctx.replyWithHTML(
      //   `<b> fetching your portfolio details ♻️ ===== </b>`
      // );

      //   await portfolioBuyDialog(ctx, user, response.attributes.address);
      return;
    } catch (error) {
      await txError(error, ctx);
    }
  } catch (error) {
    log("error occured in buy ============");
    err(error);
  }
};
