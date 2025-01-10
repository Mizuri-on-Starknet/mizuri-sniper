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

    const balances = await Promise.all(walletAddresses.map(fetchETH));
    const prices = await Promise.all(balances.map(EthPrice));

    // log(balances);
    // log(user.wallets);

    const welcome =
      `<b>🎯 Mizuri Sniper Bot - Dominate StarkNet Trading Like a Pro 🚀</b>


🔥 Why Mizuri?  
- 🤗 <b>100% compatible with ArgentX wallet:</b> Easily export your wallets to ArgentX, no hassle
- 🚀 <b>Unmatched Speed:</b> Execute snipes in milliseconds with Mizuri’s cutting-edge algorithms.  
- 🎯 <b>Pinpoint Accuracy:</b> Strike with surgical precision and never miss an opportunity.  
- 🍃 Exclusive Mizuri Pro Benefits:  
 <b>access 5 wallets premium strategy</b>
 🤫 use code <code>premium</code> for the first 50 members

 How? ⚙️ Settings > 👑 Premium

❓ Need assistance? Type <code>/help</code> to get started.

<b>═══ Your Wallets ═══</b>
` +
      user.wallets
        .map((e, i) => {
          return `<b>▰ Address ${i + 1}: ▰</b>\nBal: ${balances[i]} STRK $${
            prices[i]
          }\n<code>${e.address}</code>\n\n`;
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
