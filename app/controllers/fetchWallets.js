import axios from "axios";
import dotenv from "dotenv";
import { globals, log } from "../utils/globals.js";
import { setInitialMnemonics, setMnemonics, user } from "../database/users.js";
import { encrypt } from "./encryption.js";
import { createWallet12 } from "./wallet/createWallet.js";
dotenv.config();

const env = process.env;

export const fetchUser = async (telegramId, defaultWallet) => {
  const userr = await user(telegramId);
  const response = await createWallet12(telegramId);
  const dataResponse = response;
  // log(dataResponse);
  const encryptedMnemonics = encrypt(
    dataResponse[defaultWallet || 0].privateKey
  );
  !userr?.encrypted_mnemonnics.length > 0 &&
    (await setInitialMnemonics(telegramId, encryptedMnemonics));

  // if (userr.encrypted_mnemonnics.length > 0) {
  //   log("");
  // } else {
  //   await setInitialMnemonics(telegramId, encryptedMnemonics);
  // }
  const userData = {
    wallets: dataResponse
  };
  return userData;
};
