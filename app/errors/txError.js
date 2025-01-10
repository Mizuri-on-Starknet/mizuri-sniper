import { err, log } from "../utils/globals.js";
import { fastKeyboard } from "../utils/keyboards.js";
fastKeyboard;

export const txError = async (error, ctx) => {
  if (error.toString().includes("insufficient funds")) {
    err(error);
    await ctx.reply(
      " ❌❌❌ something went wrong while making your transaction 😵‍💫, please make sure you have enough and extra to cover for gas fees ⛽️ and try again 🚀",
      fastKeyboard
    );
  } else if (error.toString().includes("gas")) {
    err(error);
    await ctx.reply(
      " ❌❌❌ something went wrong while making your transaction 😵‍💫, please make sure you have enough and extra to cover for gas fees ⛽️ and try again 🚀",
      fastKeyboard
    );
  } else if (error.toString().includes("reverted")) {
    err(error);
    await ctx.reply(
      " ❌❌❌ something went wrong while making your transaction 😵‍💫, please make sure you have enough and extra to cover for gas fees ⛽️ and try again 🚀",
      fastKeyboard
    );
  } else {
    err(error);
    log("=========================");
    err(error.toString());
    await ctx.reply(
      "it's not you, it's us 😵‍💫, please try again later 🚀",
      fastKeyboard
    );
  }
};
