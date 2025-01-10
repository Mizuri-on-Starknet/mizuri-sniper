import { message } from "telegraf/filters";
import User from "../Schema/User.js";
import { log } from "../utils/globals.js";

// trigger snipe
export const triggerSnipe = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    {
      $bit: {
        ["snipe"]: {
          xor: 1
        }
      }
    },
    { new: true }
  );
};

// trigger buy type
export const triggerBuyType = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    {
      $bit: {
        ["buyType"]: {
          xor: 1
        }
      }
    },
    { new: true }
  );
};

// trigger sell type
export const triggerSellType = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    {
      $bit: {
        ["sellType"]: {
          xor: 1
        }
      }
    },
    { new: true }
  );
};

// edit buy amount
export const editBuyAmount = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { buyAmount: Number(amount) }
  );
};

//  clear buy amount
export const clearBuyAmount = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { buyAmount: 0 }
  );
};

// edit sell hi amount
export const editSellHiAmount = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellHiAmount: Number(amount) }
  );
};

// clear sell hi amount
export const clearSellHiAmount = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellHiAmount: 0 }
  );
};

// edit sell hi amount
export const editSellLoAmount = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellLoAmount: Number(amount) }
  );
};

// clear sell hi amount
export const clearSellLoAmount = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellLoAmount: 0 }
  );
};

// clear sellHi x
export const clearSellHi_x = async (telegramId) => {
  return await User.findOneAndUpdate({ username: telegramId }, { sellHix: 0 });
};

// clear sell Lo x
export const clearSellLo_x = async (telegramId) => {
  return await User.findOneAndUpdate({ username: telegramId }, { sellLox: 0 });
};

// edit sell lo x
export const editSellLo_x = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellLox: Number(amount) }
  );
};

// edit sell Hi x
export const editSellHi_x = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { sellHix: Number(amount) }
  );
};

// set minMC
export const setMinMC = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { minmiumMC: Number(amount) }
  );
};

// set maxMC
export const setMaxMC = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxMC: Number(amount) }
  );
};

// clear minMC
export const clearMinMC = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { minmiumMC: 0 }
  );
};

// clear maxMC
export const clearMaxMC = async (telegramId) => {
  return await User.findOneAndUpdate({ username: telegramId }, { maxMC: 0 });
};

// set minLiq
export const setMinLiq = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { minmiumLiq: Number(amount) }
  );
};

// clear minLiq
export const clearMinLiq = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { minmiumLiq: 0 }
  );
};

// set maxLiq
export const setMaxLiq = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxLiq: Number(amount) }
  );
};

// clear maxLiq
export const clearMaxLiq = async (telegramId) => {
  return await User.findOneAndUpdate({ username: telegramId }, { maxLiq: 0 });
};

// set minBuyTax
export const setMaxBuyTax = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxBuyTax: Number(amount) }
  );
};

export const setSlippage = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { slippage: Math.ceil(Number(amount)) }
  );
};

// clear minBuyTax
// export const clearMaxBuyTax = async (telegramId) => {
//   return await User.findOneAndUpdate(
//     { username: telegramId },
//     { minimunBuyTax: 0 }
//   );
// };

// clear minBuyTax
export const clearMaxBuyTax = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxBuyTax: 0 }
  );
};

// set minSellTax
export const setMaxSellTax = async (telegramId, amount) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxSellTax: Number(amount) }
  );
};

// clear minSellTax
export const clearMaxSellTax = async (telegramId) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { maxSellTax: 0 }
  );
};

export const defaullWallet = async (telegramId) => {
  const user = await User.findOne({
    username: telegramId
  });
  return user.defaultAddress;
};

export const buyDB = async (
  telegramId,
  contractAddress,
  amount,
  entryPrice,
  entryMCAP,
  tokenName
) => {
  const user = await User.findOne({ username: telegramId });
  if (user) {
    log("user trades before pushing =======");
    log(user.trades);
    user.trades[contractAddress.toLowerCase()] = {
      entryPrice,
      entryMCAP,
      amount,
      tokenName
    };

    log("user trades after pushing =======");
    log(user.trades);

    await User.findOneAndUpdate(
      { username: telegramId },
      { trades: user.trades }
    );
    return {
      message: "okay",
      response: "address updated"
    };
  } else return;
};

// setTimeout(async () => {
//   await triggerSnipe("839680509");
//   //   await triggerBuyType("2003676087");
//   //   await triggerSellType("2003676087");
// }, 20000);
