import { Markup } from "telegraf";
import { changeDefaultWallet, findUser } from "../database/users.js";
import { encrypt } from "../controllers/encryption.js";
import { err, log } from "./globals.js";
import { fetchDefaultWallet } from "../robot/settings.js";
import { createSingleWallet } from "../controllers/wallet/createWallet.js";
import User from "../Schema/User.js";

// user personal inline keyboard
const inlineKeyboard = async (telegramId) => {
  const [wallets, userDefaultWallet] = await Promise.all([
    findUser(telegramId),
    fetchDefaultWallet(telegramId)
  ]);

  const walletButtons = wallets.wallets.map((wallet, index) =>
    Markup.button.callback(
      `${userDefaultWallet == index ? "✅" : ""} w${index + 1} `,
      `selectWallet:w${index + 1}`
    )
  );

  return Markup.inlineKeyboard([
    [Markup.button.callback(" SELECT DEFAULT WALLET ", "selectWallet")],
    walletButtons, // Convert to 2D array for proper formatting
    [
      Markup.button.callback("🟢 Buy ", "buy"),
      Markup.button.callback("🔫 Pre Snipe ", "presnipe"),
      Markup.button.callback("🔴 Sell ", "sell")
    ],
    [
      Markup.button.callback("Active Snipes ", "openPositions"),
      Markup.button.callback("⚙️ Settings ", "settings")
    ],
    [Markup.button.webApp(" Help ", "https://apetoken.net")]
  ]);
};

const updateWalletButtons = async (selectedWallet, username) => {
  const keyboard = await inlineKeyboard(username);
  keyboard.reply_markup.inline_keyboard.forEach((row) => {
    row.forEach((button) => {
      if (
        button.callback_data &&
        button.callback_data.startsWith("selectWallet:")
      ) {
        const walletNumber = button.callback_data.split(":")[1];

        if (walletNumber === selectedWallet) {
          !button.text.includes("✅") && (button.text = "✅ " + button.text);
        } else {
          button.text = button.text.replace("✅ ", "");
        }
      }
    });
  });
  return keyboard;
};

const selectWallet = async (ctx, walletIndex) => {
  try {
    const username = ctx.from.id.toString();
    const userUnityWallet = (await findUser(username)).wallets;
    await changeDefaultWallet(
      username,
      walletIndex,
      userUnityWallet[walletIndex].privateKey,
      userUnityWallet[walletIndex].address
    );
    const updatedKeyboard = await updateWalletButtons(
      `w${walletIndex + 1}`,
      username
    );
    await ctx.editMessageReplyMarkup(updatedKeyboard.reply_markup);
  } catch (error) {
    console.log("--- trying to update current wallet ----");
    err(error);
  }
};

const resetWallet = async (ctx, walletIndex) => {
  try {
    let actualIndex = Number(walletIndex);
    const username = ctx.from.id.toString();
    const user = await findUser(username);
    let userWallets = user.wallets;

    // recreate a wallet to override the previous one at index
    const singleWallet = await createSingleWallet();

    userWallets[actualIndex] = singleWallet;
    let defaultAddress = user.defaultAddress;
    let walletAddress = user.walletAddress;
    let encrypted_mnemonnics = user.encrypted_mnemonnics;
    // if the wallet is the default wallet, update the default wallet also ==
    if (Number(walletIndex) == Number(user.defaultAddress)) {
      defaultAddress = Number(walletIndex);
      walletAddress = singleWallet.address;
      encrypted_mnemonnics = singleWallet.privateKey;
    }

    await User.findOneAndUpdate(
      { username },
      {
        wallets: userWallets,
        defaultAddress: defaultAddress,
        walletAddress: walletAddress,
        encrypted_mnemonnics
      }
    );

    await ctx.reply(
      `🤝 Wallet ${
        actualIndex + 1
      } reset Successfully.\nDo not share your privatekey with anyone!`
    );
  } catch (error) {
    console.log("--- trying to reset current wallet ---- %s ", walletIndex);
    err(error);
  }
};

export const resetWallet1 = async (ctx) => await resetWallet(ctx, 0);
export const resetWallet2 = async (ctx) => await resetWallet(ctx, 1);
export const resetWallet3 = async (ctx) => await resetWallet(ctx, 2);
export const resetWallet4 = async (ctx) => await resetWallet(ctx, 3);
export const resetWallet5 = async (ctx) => await resetWallet(ctx, 4);

export const selectWallet1 = async (ctx) => selectWallet(ctx, 0);
export const selectWallet2 = async (ctx) => selectWallet(ctx, 1);
export const selectWallet3 = async (ctx) => selectWallet(ctx, 2);
export const selectWallet4 = async (ctx) => selectWallet(ctx, 3);
export const selectWallet5 = async (ctx) => selectWallet(ctx, 4);
