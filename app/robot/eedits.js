import {
  buySettingsState,
  premiumSettingsState,
  sellSettingsState,
  withdrawState
} from "../index.js";

export const eeditMinMCap = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editMinMCap"
  };
  await ctx.replyWithHTML(
    `<code>Enter Minimum Market Cap Value: 1000 == $1000 Market cap</code>`
  );
};
export const eeditMaxMCap = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editMaxMCap"
  };
  await ctx.replyWithHTML(
    `<code>Enter Max Market Cap Value: 1000 == $1000 Market cap</code>`
  );
};
export const eeditMinLiquidity = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editMinLiquidity"
  };
  await ctx.replyWithHTML(
    `<code>Enter Minimum Liquidity: 100000 == $100000 Liquidity</code>`
  );
};
export const eeditMaxLiquidity = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editMaxLiquidity"
  };
  await ctx.replyWithHTML(
    `<code>Enter Max Liquidity: 100000 == $100000 Liquidity</code>`
  );
};
export const eeditMaxBuyTax = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editMaxBuyTax"
  };
  await ctx.replyWithHTML(`<code>Enter Maximum Buy Tax: 5 == 5% Tax</code>`);
};

export const eeditSlippage = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editSlippage"
  };
  await ctx.replyWithHTML(
    `<code>Enter Slippage Value 10 == 10% Slippage. 🙂Be generous with Slippage, most tx won't be processed if your slipage is slim</code>`
  );
};

//  sell eedits
export const eeditMaxSellTax = async (ctx) => {
  let username = ctx.from.id.toString();
  sellSettingsState[username] = {
    type: "editMaxSellTax"
  };
  await ctx.replyWithHTML(`<code>Enter Maximum Sell Tax: 5 == 5% Tax</code>`);
};
export const eeditSellHix = async (ctx) => {
  let username = ctx.from.id.toString();
  sellSettingsState[username] = {
    type: "editSellHix"
  };
  await ctx.replyWithHTML(
    `<code>Enter Take Profit x Amount: 5 == 5x above entry 🚀</code>`
  );
};
export const eeditSellLox = async (ctx) => {
  let username = ctx.from.id.toString();
  sellSettingsState[username] = {
    type: "editSellLox"
  };
  await ctx.replyWithHTML(
    `<code>Enter Stop Loss x Amount: 5 == 5x below entry 🥲</code>`
  );
};
export const eeditSellHiAmount = async (ctx) => {
  let username = ctx.from.id.toString();
  sellSettingsState[username] = {
    type: "editSellHiAmount"
  };
  await ctx.replyWithHTML(
    `<code>Enter Take Profit Percentage: 50 == 50% above entry 🚀</code>`
  );
};
export const eeditSellLoAmount = async (ctx) => {
  let username = ctx.from.id.toString();
  sellSettingsState[username] = {
    type: "editSellLoAmount"
  };
  await ctx.replyWithHTML(
    `<code>Enter Stop Loss Percentage : 50 == 50% below entry 🥲</code>`
  );
};

export const eeditBuyAmount = async (ctx) => {
  let username = ctx.from.id.toString();
  buySettingsState[username] = {
    type: "editBuyAmount"
  };
  await ctx.replyWithHTML(
    `<code>Enter Buy Amount  ⚠️ If Buy Type is set to Percent % , enter 1 - 100 which means 1 - 100 percent of your ETH balance. ⚠️ If Buy Amount is set to X Amount, enter any number like 0.5 to mean 0.5 ETH</code>`
  );
};

export const eeditPremium = async (ctx) => {
  let username = ctx.from.id.toString();
  premiumSettingsState[username] = {
    type: "editPremium"
  };
  await ctx.replyWithHTML(`<code>Enter Premium Code - 👑 </code>`);
};

export const promptForAddress = async (ctx) => {
  let username = ctx.from.id.toString();
  withdrawState[username] = {
    type: "withdraw"
  }
  await ctx.replyWithHTML(`<code>Enter recepient address - 🔭 </code>`);
}