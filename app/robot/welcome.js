import { fetchETH } from "../controllers/fetchBalance.js";
import { fetchUser } from "../controllers/fetchWallets.js";
import { findUser } from "../database/users.js";
import { log } from "../utils/globals.js";
import {
  fastKeyboard,
  inlineKeyboard,
  selectWallet
} from "../utils/keyboards.js";
import { EthPrice } from "../utils/prices.js";

export const startHandler = async (ctx) => {
  let username = ctx.from.id.toString();

  try {
    console.log("========== start =============");

    const response = await fetchUser(username);
    const user = await findUser(username);
    const walletAddresses = user.wallets.map((wallet) => wallet.address);

    const balances = await Promise.all(
      walletAddresses.map((address) => fetchETH(address, user.main_token))
    );
    const prices = await Promise.all(
      balances.map((balance) => EthPrice(balance, user.main_token))
    );

    // log(balances);
    // log(user.wallets);

    const welcome =
      `<b>🎯 Mizuri Sniper Bot - Dominate StarkNet Trading Like a Pro 🚀</b>


🔥 Why Mizuri?  
- 🤗 <b>100% compatible with ArgentX wallet:</b> Accounts created using argentX account ClassHash
- ⛽️ <b>$ETH or $STRK:</b> switch between tokens for gas
- 🚀 <b>Unmatched Speed:</b> 
- 🎯 <b>Pinpoint Accuracy:</b>.  
- 🍃 Exclusive Mizuri Pro Benefits:  
 <b>access 5 wallets premium strategy</b>
 🤫 use code <code>premium</code> for first 50 users

 How? ⚙️ Settings > 👑 Premium

❓ Need help? Type <code>/help</code> to get started.

<b>═ Your Wallets ═</b>
` +
      user.wallets
        .map((e, i) => {
          return `<b>▰ Address ${i + 1}: ▰</b>\nBal: ${balances[i]} ${
            user.main_token == 0 ? "$ETH" : "$STRK"
          } $${prices[i]}\n<code>${e.address}</code>\n\n`;
        })
        .join("");

    await ctx.replyWithPhoto("https://ibb.co/drR9q9z", {
      caption: welcome,
      parse_mode: "HTML",
      ...(await inlineKeyboard(username))
    });
  } catch (error) {
    console.log(error);
    const ErrorMessage = `Something went wrong,

${
  error.toString().includes("timed out")
    ? "Your request timed out 😵‍💫, please try again in a minute."
    : "That's strange 🤔, please give us a minute."
}`;

    await ctx.reply(ErrorMessage, fastKeyboard);
  }
};
