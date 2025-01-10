import { Telegraf, session, Markup } from "telegraf";
import { Redis } from "@telegraf/session/redis";
import dotenv from "dotenv";
import { MongoConnect } from "./controllers/mongo.js";
import { startHandler } from "./robot/welcome.js";
import {
  backToSettings,
  buyPrompt,
  closePreSnipe,
  doClearMaxBuyTax,
  doClearMaxLiq,
  doClearMaxMcap,
  doClearMaxSellTax,
  doClearMinLiq,
  doClearMinMcap,
  doClearSellHiAmount,
  doClearSellHi_x,
  doClearSellLoAmount,
  doClearSellLo_x,
  doShowResetWallets,
  doSwitchBuyType,
  noTransfer,
  preSnipeMenu,
  pullUpBuySettings,
  pullUpSellSettings,
  pullUpViewSettings,
  sellMenu,
  settingsHandler,
  switchToBuy,
  switchToSell,
  triggerAutoBuy,
  vanish,
  yesTransfer
} from "./robot/settings.js";
import {
  resetWallet1,
  resetWallet2,
  resetWallet3,
  resetWallet4,
  resetWallet5,
  selectWallet1,
  selectWallet2,
  selectWallet3,
  selectWallet4,
  selectWallet5
} from "./utils/selectWallet.js";
import { triggerSnipe } from "./controllers/settings.js";
import { pendingSettings, sellCallBackQuery } from "./robot/editSettings.js";
import {
  eeditBuyAmount,
  eeditMaxBuyTax,
  eeditMaxLiquidity,
  eeditMaxMCap,
  eeditMaxSellTax,
  eeditMinLiquidity,
  eeditMinMCap,
  eeditPremium,
  eeditSellHiAmount,
  eeditSellHix,
  eeditSellLoAmount,
  eeditSellLox,
  eeditSlippage,
  promptForAddress
} from "./robot/eedits.js";

import { buy } from "./robot/buy.js";
import { log } from "./utils/globals.js";
import { sell, sendPnl } from "./robot/sell.js";
// import { snipe } from "./controllers/trade.js";
import express from "express";
import { preSnipeAction } from "./controllers/preTrade.js";
import { openSnipes } from "./utils/keyboards.js";
import { exportWallet } from "./controllers/wallet/createWallet.js";
import { generateImage } from "./utils/generateImage.js";
import { sniperNew } from "./robot/snipe.js";

import { createPremiumCode } from "./database/premium.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({ message: "connected to unity sniper bot url home" });
});
app.all("*", (req, res) => {
  res.status(404).json({
    message: "route not found"
  });
});
app.listen(process.env.PORT || 14818, () => {
  log("======== express app started on port %d =======", 14818);
});

const lastRequestTimes = {};
export const state = {};
export const pnlState = {};
export const buySettingsState = {};
export const premiumSettingsState = {};
export const sellSettingsState = {};
export const sellState = {};
export const usersAwaitingAmount = [];
export const usersAwaitingSell = [];
export const sellAddress = {};
export const buyAddress = {};
export const selectToken = {};
export const selectPreSnipes = {};
export const preSniper = {};
export const withdrawState = {}; // userID: fromWalletAddress, toWalletAddress, amount, encrypted_mnemonnics

export const bot = new Telegraf(process.env.TELEGRAM_API);
// bot.use(async (ctx, next) => {
//   const userId = ctx.from.id;
//   // Check if the user has made a recent request
//   log(ctx?.message?.text);

//   if (
//     lastRequestTimes[userId] &&
//     Date.now() - lastRequestTimes[userId] < 1000
//   ) {
//     ctx.reply("⏳ Please wait a second before sending another request.");
//     return;
//   }
//   lastRequestTimes[userId] = Date.now();
//   next();
// });

// connecting to mongodb

await MongoConnect().then(async (e) => {
  // await preSnipeAction(bot.telegram);
  // await createPremiumCode("premium", 50);
});
bot.start(startHandler);

// bot.command("sell", sellMenu);
bot.command("selloff", sellMenu);
bot.command("buy", buyPrompt);
bot.command("positions", openSnipes);
bot.command("snipe", preSnipeMenu);
bot.command("settings", settingsHandler);
bot.action("openPositions", openSnipes);
bot.action("settings", settingsHandler);
bot.action("autoBuy", triggerAutoBuy);
bot.action("sellSettings", pullUpSellSettings);
bot.action("buySettings", pullUpBuySettings);
bot.action("backToSettings", backToSettings);
bot.action("switchToSell", switchToSell);
bot.action("switchToBuy", switchToBuy);
bot.action("resetMinMCap", doClearMinMcap);
bot.action("resetMaxMCap", doClearMaxMcap);
bot.action("resetMaxLiquidity", doClearMaxLiq);
bot.action("resetMinLiquidity", doClearMinLiq);
bot.action("resetMaxBuyTax", doClearMaxBuyTax);
bot.action("resetMaxSellTax", doClearMaxSellTax);
bot.action("resetSellHix", doClearSellHi_x);
bot.action("resetSellLox", doClearSellLo_x);
bot.action("resetSellHiAmount", doClearSellHiAmount);
bot.action("resetSellLoAmount", doClearSellLoAmount);
bot.action("button7", pullUpViewSettings);
bot.action("selectWallet:w1", selectWallet1);
bot.action("selectWallet:w2", selectWallet2);
bot.action("selectWallet:w3", selectWallet3);
bot.action("selectWallet:w4", selectWallet4);
bot.action("selectWallet:w5", selectWallet5);
bot.action("resetWallet:1", selectWallet5);
bot.action("editMinMCap", eeditMinMCap);
bot.action("editMaxMCap", eeditMaxMCap);
bot.action("editMinLiquidity", eeditMinLiquidity);
bot.action("editMaxLiquidity", eeditMaxLiquidity);
bot.action("editMaxBuyTax", eeditMaxBuyTax);
bot.action("editMaxSellTax", eeditMaxSellTax);
bot.action("editSellHix", eeditSellHix);
bot.action("editSlippage", eeditSlippage);
bot.action("editSellLox", eeditSellLox);
bot.action("editSellHiAmount", eeditSellHiAmount);
bot.action("editSellLoAmount", eeditSellLoAmount);
bot.action("editBuyAmount", eeditBuyAmount);
bot.action(["buyXAmount", "buyPercentage"], doSwitchBuyType);
bot.action(["100", "500", "1000", "1500", "buy_custom"], buy);
bot.action("pnl", sendPnl);
bot.action("sell", sellMenu);
bot.action(
  ["10p", "20p", "30p", "50p", "70p", "90p", "100p", "sell_custom"],
  sell
);
bot.action(
  ["100s", "200s", "300s", "500s", "1000s", "snipe_custom", "snipe_max"],
  sniperNew
);
bot.action("vanish", vanish);
bot.action("resetWallet:1", resetWallet1);
bot.action("resetWallet:2", resetWallet2);
bot.action("resetWallet:3", resetWallet3);
bot.action("resetWallet:4", resetWallet4);
bot.action("resetWallet:5", resetWallet5);
bot.action("mainMenu", startHandler);
bot.action("premiumF", eeditPremium);
bot.action("buy", buyPrompt);
bot.action("exportW", exportWallet);
bot.action("presnipe", preSnipeMenu);
bot.action("removeFromPreSnipeList", closePreSnipe);
bot.action("promptResetWallets", doShowResetWallets);
bot.action("withdraw", promptForAddress);
bot.action("yesWithdraw", yesTransfer);
bot.action("noWithdraw", noTransfer);
bot.on("callback_query", sellCallBackQuery);
pendingSettings();

bot.launch();

// setTimeout(async () => {
//   await createPremiumCode("xL0xPreA$PeH0lds", 200000000000);
// }, 10000);
