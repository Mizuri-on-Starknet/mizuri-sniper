import User from "../Schema/User.js";
import { firstTimeCreate12 } from "../controllers/wallet/createWallet.js";

export const user = async (telegramId) => {
  const response = await User.find({ username: telegramId });
  if (response.length > 0) {
    return response[0];
  } else {
    const wallets = await firstTimeCreate12();
    const newUser = new User({
      username: telegramId,
      wallets,
      walletAddress: wallets[0].address,
      encrypted_mnemonnics: wallets[0].privateKey
    });

    return await newUser.save();
  }
};

export const findUser = async (telegramId) => {
  const response = await User.findOne({ username: telegramId });
  return response;
};

export const changeDefaultWallet = async (
  telegramId,
  defaultWallet,
  encrypted_mnemonnics,
  walletAddress
) => {
  await User.findOneAndUpdate(
    { username: telegramId },
    {
      defaultAddress: Number(defaultWallet),
      encrypted_mnemonnics,
      walletAddress
    }
  );
};

export const findDefaultWallet = async (telegramId) => {
  const response = await User.findOne({
    username: telegramId
  });

  return response.defaultAddress;
};

export const isAutoBuy = async (telegramId) => {
  const response = await User.findOne({ username: telegramId });
  // console.log(response.snipe);
  // console.log(telegramId);
  return response.snipe;
};

export const setInitialMnemonics = async (telegramId, encrypted_mnemonics) => {
  const existingUser = await User.findOne({ username: telegramId });
  if (existingUser.encrypted_mnemonnics.length > 0) {
    return;
  } else {
    return await User.findOneAndUpdate(
      { username: telegramId },
      { encrypted_mnemonnics: encrypted_mnemonics }
    );
  }
};

export const setMnemonics = async (telegramId, encrypted_mnemonics) => {
  return await User.findOneAndUpdate(
    { username: telegramId },
    { encrypted_mnemonnics: encrypted_mnemonics }
  );
};
