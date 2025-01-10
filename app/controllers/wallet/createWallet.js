import {
  Account,
  ec,
  json,
  stark,
  RpcProvider,
  hash,
  CallData,
  CairoOption,
  CairoOptionVariant,
  CairoCustomEnum
} from "starknet";
import User from "../../Schema/User.js";
import { decrypt, encrypt } from "../encryption.js";
import { fetchUser } from "../fetchWallets.js";
import { err, globals, log } from "../../utils/globals.js";
import { fastFastClose, fastKeyboard } from "../../utils/keyboards.js";
import { findUser } from "../../database/users.js";

// connect provider
const provider = new RpcProvider({ nodeUrl: `${globals.infuraSepolia}` });

//new Argent X account v0.4.0
const argentXaccountClassHash =
  "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";

const deploy_argent_wallet = async (
  AXConstructorCallData,
  AXcontractAddress,
  privateKeyAX,
  initialWalletAddress
) => {
  const accountAX = new Account(provider, AXcontractAddress, privateKeyAX);
  let starkKeyPubAX = initialWalletAddress;
  const deployAccountPayload = {
    classHash: argentXaccountClassHash,
    constructorCalldata: AXConstructorCallData,
    contractAddress: AXcontractAddress,
    addressSalt: starkKeyPubAX
  };

  const { transaction_hash: AXdAth, contract_address: AXcontractFinalAddress } =
    await accountAX.deployAccount(deployAccountPayload);
  console.log("✅ ArgentX wallet deployed at:", AXcontractFinalAddress);
  return { AXcontractFinalAddress };
};

export const createWallet12 = async (telegramId) => {
  const existingUser = await User.findOne({
    username: telegramId
  });
  // log("=== existing user ====", existingUser);

  const wallets = [
    {
      address: existingUser.wallets[0].address,
      privateKey: decrypt(existingUser.wallets[0].privateKey)
    },
    {
      address: existingUser.wallets[1].address,
      privateKey: decrypt(existingUser.wallets[1].privateKey)
    }
  ];
  return wallets;
};

function padHexTo66(hexString) {
  // Check if the string starts with '0x'
  if (!hexString.startsWith("0x")) {
    throw new Error("Invalid hex string: must start with '0x'");
  }

  // Remove '0x' prefix for length calculation and padding
  const withoutPrefix = hexString.slice(2);

  // Calculate the padding needed to make the string (including '0x') 66 characters long
  const paddingNeeded = 64 - withoutPrefix.length;

  if (paddingNeeded < 0) {
    return hexString;
  }

  // Add the necessary zeros and return the padded string
  return "0x" + "0".repeat(paddingNeeded) + withoutPrefix;
}

export const createSingleWallet = async () => {
  // Generate public and private key pair.
  const privateKeyAX = stark.randomAddress();
  // console.log("AX_ACCOUNT_PRIVATE_KEY=", privateKeyAX);
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);
  // console.log("AX_ACCOUNT_PUBLIC_KEY=", starkKeyPubAX);

  // Calculate future address of the ArgentX account
  const axSigner = new CairoCustomEnum({ Starknet: { pubkey: starkKeyPubAX } });
  const axGuardian = new CairoOption(CairoOptionVariant.None);
  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian
  });
  const AXcontractAddress = hash.calculateContractAddressFromHash(
    starkKeyPubAX,
    argentXaccountClassHash,
    AXConstructorCallData,
    0
  );
  // console.log("Precalculated account address=", AXcontractAddress);

  const wallet = {
    address: padHexTo66(AXcontractAddress),
    privateKey: encrypt(privateKeyAX),
    AXConstructorCallData,
    initialWalletAddress: starkKeyPubAX
  };
  return wallet;
};

// console.log(createSingleWallet());

// await deploy_argent_wallet(
//   [
//     "0",
//     "630559855065581259481863973171974753312440719803087763120308473516701250843",
//     "1"
//   ],
//   "0x5dc36c20072be64a5009f822dd0000cf1e7382a212fea2fc114d6540d1b6d7",
//   "0x206f98c703c5898bff49a35d292b9877d593afdf8dcbb4c77670bae9d36b74b",
//   "0x164e25ced881df0c290953415b6d4ecad6adf30a1ec7391f281afe39e57f51b"
// );

export const firstTimeCreate12 = async () => {
  const wallet1 = await createSingleWallet();
  const wallet2 = await createSingleWallet();

  // const address3 = wallet3.address;

  const wallets = [
    {
      address: wallet1.address,
      privateKey: encrypt(wallet1.privateKey),
      AXConstructorCallData: wallet1.AXConstructorCallData,
      initialWalletAddress: wallet1.initialWalletAddress
    },
    {
      address: wallet2.address,
      privateKey: encrypt(wallet2.privateKey),
      AXConstructorCallData: wallet2.AXConstructorCallData,
      initialWalletAddress: wallet2.initialWalletAddress
    }
    // { address: address3, privateKey: encrypt(privateKey3) }
  ];
  return wallets;
};

export const exportWallet = async (ctx) => {
  try {
    let username = ctx.from.id.toString();
    const user = await findUser(username);
    const userWallets = user.wallets;
    // log(" userrrr", user.wallets[0]);
    const key =
      `<pre><b>═══ 🔑 Your Mnemonics ═══</b></pre>\n` +
      ` 🔒 Make sure to keep it safe\n\n` +
      `${userWallets
        .map((e, i) => {
          // log(" -- this is e --");
          // log(e);
          return (
            "wallet" +
            (i + 1) +
            " " +
            `<span class="tg-spoiler">${decrypt(e.privateKey)}</span>\n\n`
          );
        })
        .toString()
        .replaceAll(",", "")}`;
    await ctx.replyWithHTML(key, fastFastClose);
  } catch (error) {
    log(" ===  error from export wallet ===");
    err(error);
  }
};

export const createThree = async () => {
  const wallet1 = await createSingleWallet();
  const wallet2 = await createSingleWallet();
  const wallet3 = await createSingleWallet();

  const wallets = [
    {
      address: wallet1.address,
      privateKey: encrypt(wallet1.privateKey),
      AXConstructorCallData: wallet1.AXConstructorCallData,
      initialWalletAddress: wallet1.initialWalletAddress
    },
    {
      address: wallet2.address,
      privateKey: encrypt(wallet2.privateKey),
      AXConstructorCallData: wallet2.AXConstructorCallData,
      initialWalletAddress: wallet2.initialWalletAddress
    },
    {
      address: wallet3.address,
      privateKey: encrypt(wallet3.privateKey),
      AXConstructorCallData: wallet3.AXConstructorCallData,
      initialWalletAddress: wallet3.initialWalletAddress
    }
  ];
  return wallets;
};
