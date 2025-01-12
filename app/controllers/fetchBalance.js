import { ethers } from "ethers";
import { Contract, RpcProvider } from "starknet";
import { globals, log } from "../utils/globals.js";
//  "https://rpc.mevblocker.io/"
export const eth_address =
  "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7";

export const stark_address =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
export const fetchETH = async (walletAddress, main_token = 0) => {
  const provider = new RpcProvider({ nodeUrl: `${globals.infuraSepolia}` });
  const token_address = main_token == 0 ? eth_address : stark_address;
  const { abi } = await provider.getClassAt(token_address.toLowerCase());

  if (abi === undefined) {
    throw new Error("no abi.");
  }

  const eth_contract = new Contract(abi, token_address, provider);
  const balance = await eth_contract.balance_of(walletAddress);
  const etherBalance = ethers.formatEther(balance);
  return Number(etherBalance).toFixed(3);
};

// log("========= wallet balance =======");
// log(await fetchETH("0xe011EC515c0E70094c8b4D5c9d36d3b499D9532d"));
