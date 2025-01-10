import { decrypt } from "../controllers/encryption.js";
import { preSnipeActionDB } from "../database/preSnipe.js";
import { findUser } from "../database/users.js";
import { preSniper } from "../index.js";
import { err, log } from "../utils/globals.js";

export const sniperNew = async (ctx) => {
  try {
    let username = ctx.from.id.toString();

    log(ctx.match[0]);
    // ctx.answerCbQuery("hello");
    log("nigga pressed it for snipe");
    // const amountToBuy = "5";
    const amountToBuy = ctx.match[0].toString();

    let user = username;

    const currentUser = await findUser(user);
    const userAddress = currentUser.walletAddress;
    //   const userAvaxBalance = currentUser.balance;
    const userEncryptedMnemonics = currentUser.encrypted_mnemonnics;

    const mnemonics = decrypt(userEncryptedMnemonics);
    // let snipeObject = preSniper[user];

    if (amountToBuy === "snipe_custom") {
      preSniper[username].state = "awaiting_custom_snipe";

      await ctx.reply("Enter custom STRK to snipe: 👀 example 50 👇");

      return;
    }

    let validAmount = amountToBuy.replace("s", "");
    try {
      await preSnipeActionDB(
        preSniper[username].trade.contractAddress,
        username,
        ctx,
        amountToBuy == "snipe_max" ? "max_transaction" : validAmount,
        currentUser.encrypted_mnemonnics,
        currentUser.walletAddress,
        preSniper[username].trade.decimals,
        preSniper[username].trade.tokenName,
        preSniper[username].trade.tokenTicker
      );
    } catch (error) {
      log(error);
    }
  } catch (error) {
    err(error);
  }
};
