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
import { Context } from "telegraf";

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

export function padHexTo66(hexString) {
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
  const privateKeyAX = stark.randomAddress();
  const starkKeyPubAX = ec.starkCurve.getStarkKey(privateKeyAX);

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
// console.log(
//   decrypt(
//     "0e723cf9fbc9a3740d74af412eeaee19ae2747d09cac678ff4f0e150cd6b17d761f102193ab9359669ae27fffe4bdebb29008a199fca6c0226e0c157bcf9862c8e8c30951929b21b2fe150989b0270b0"
//   )
// );

// await deploy_argent_wallet(
//   [
//     "0",
//     "2713379871962457008925379088717995525816017762476197014436743569789491495838",
//     "1"
//   ],
//   "0x070e5a6703b5b9406e2e047aab55de4d9dc64d3e4cca851e70a3f5dae129d1a1",
//   "0x7657feec9bb233ec1037188d8fb00bcd208da16e93b1a9904571087edca8b75",
//   "0x5ffb7f51a3357d9e8b47515aa2f51ddb04685cda7e34adc528e6a1cb86a439e"
// );

export const firstTimeCreate12 = async () => {
  const wallet1 = await createSingleWallet();
  const wallet2 = await createSingleWallet();

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
            `<span class="tg-spoiler">${decrypt(
              decrypt(e.privateKey)
            )}</span>\n\n`
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

const deployWallet = async (ctx, index) => {
  try {
    const username = ctx.from.id;
    const user = await findUser(username);
    const user_wallet = user.wallets[index];

    await deploy_argent_wallet(
      user_wallet.AXConstructorCallData,
      user_wallet.address,
      decrypt(decrypt(user_wallet.privateKey)),
      user_wallet.initialWalletAddress
    );

    return await ctx.reply("✅ wallet deployed successfully");
  } catch (error) {
    console.log(error);

    // checks if accoubnt is already deployed
    if (
      error
        .toString()
        .includes(
          "0x0000000000000000000000000000000000000000000000000000000000000000."
        )
    ) {
      await ctx.reply("🙂 Account already deployed 🚀");
    } else await ctx.reply("😑 Deployment failed, something went wrong ");
  }
};

export const deployWallet1 = async (ctx) => deployWallet(ctx, 0);
export const deployWallet2 = async (ctx) => deployWallet(ctx, 1);
export const deployWallet3 = async (ctx) => deployWallet(ctx, 2);
export const deployWallet4 = async (ctx) => deployWallet(ctx, 3);
export const deployWallet5 = async (ctx) => deployWallet(ctx, 4);
