import { ethers } from "ethers";
import { err, globals, log } from "../../utils/globals.js";
import { decrypt } from "../encryption.js";
import { Account, Contract, RpcProvider } from "starknet";
import { eth_address, stark_address } from "../fetchBalance.js";

export const transferBrock = async (
  fromAddress,
  toAddress,
  amount,
  privateKey,
  main_token = 0
) => {
  try {
    privateKey = decrypt(privateKey);
    const provider = new RpcProvider({
      nodeUrl: `${globals.infuraSepolia}`
    });

    const account0 = new Account(provider, fromAddress, decrypt(privateKey));
    const token_address = main_token == 0 ? eth_address : stark_address;
    const { abi } = await provider.getClassAt(token_address.toLowerCase());

    if (abi === undefined) {
      throw new Error("no abi.");
    }
    const erc20_contract = new Contract(abi, token_address, provider);
    amount = ethers.parseEther(amount.toString());
    const transferCall = erc20_contract.populate("transfer", {
      recipient: toAddress,
      amount
    });

    const { transaction_hash: transferTxHash } = await account0.execute(
      transferCall
    );
    console.log(
      `Waiting for Tx to be Accepted on Starknet - Transfer... ${transferTxHash}`
    );
    await provider.waitForTransaction(transferTxHash);

    return transferTxHash;
  } catch (error) {
    log("================ error making transfer =============");
    log(error);
    throw error || new Error("😵‍💫");
  }
};

// Wait for the invoke transaction to be accepted on Starknet
