import { createThree } from "../controllers/wallet/createWallet.js";
import { sellSettingsState } from "../index.js";
import Premium from "../Schema/Premium.js";
import User from "../Schema/User.js";
import { err, log } from "../utils/globals.js";
import { findUser } from "./users.js";

export const createPremiumCode = async (code, limit) => {
  try {
    const isUsed = await Premium.find();
    const specificObject = isUsed.find(
      (e) => e.code.toLowerCase() == code.toLowerCase()
    );
    if (!specificObject) {
      const premiumCode = new Premium({
        code,
        limit
      });

      await premiumCode.save();
      log("===== entry successful =====");
      return true;
    } else {
      log("====== error from create Premium code =====");
      log("code already exists");
      return false;
    }
  } catch (error) {
    log("====== error from create Premium code =====");
    err(error);
    return false;
  }
};

export const fetchAllCode = async () => {
  const allCode = await Premium.find();
  return allCode;
};

export const verifyPremiumCode = async (code, username, ctx) => {
  try {
    const isUsed = await Premium.find();
    const specificObject = isUsed.find(
      (e) => e.code.toLowerCase() === code.toLowerCase()
    );

    if (!specificObject) {
      delete sellSettingsState[username];
      await ctx.reply(
        `🤝 Looks like you've got the wrong code - Try again with a new code`
      );
      return err(
        " == error, user " +
          username +
          " tried to go premium with code " +
          code +
          " =="
      );
    }

    if (specificObject.used.includes(username)) {
      delete sellSettingsState[username];
      await ctx.reply(
        `😵‍💫 Looks like you're OG Already - Try again with a new code`
      );
      throw new Error("User has already used coupon");
    }

    if (specificObject.limit > specificObject.used.length) {
      const currentUser = await findUser(username);
      const additionalWallet = await createThree();
      const newUserWallets = currentUser.wallets.concat(additionalWallet);

      await User.findByIdAndUpdate(currentUser.id, {
        wallets: newUserWallets
      });

      specificObject.used.push(username);
      await Premium.findOneAndUpdate(
        { code: code },
        { used: specificObject.used }
      );

      return await ctx.reply(`You're OG 👑 - You're our Premium User`);
    } else {
      delete sellSettingsState[username];
      await ctx.reply(
        `😵‍💫 Looks like you've got the wrong code - Try again with a new code`
      );
      return err(
        " == error, user " +
          username +
          " tried to go premium with code " +
          code +
          " =="
      );
    }
  } catch (error) {
    err("===== error from verifyPremiumCode =====");
    log(error);
  }
};
