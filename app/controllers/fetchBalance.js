import { ethers } from "ethers";
import { Contract, RpcProvider } from "starknet";
import { globals, log } from "../utils/globals.js";
//  "https://rpc.mevblocker.io/"
export const eth_address =
  "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7";
export const fetchETH = async (walletAddress) => {
  const provider = new RpcProvider({ nodeUrl: `${globals.infuraSepolia}` });

  const { abi } = await provider.getClassAt(eth_address);

  if (abi === undefined) {
    throw new Error("no abi.");
  }

  const eth_contract = new Contract(abi, eth_address, provider);
  const balance = await eth_contract.balance_of(walletAddress);
  const etherBalance = ethers.formatEther(balance);
  return Number(etherBalance).toFixed(3);
};

// log("========= wallet balance =======");
// log(await fetchETH("0xe011EC515c0E70094c8b4D5c9d36d3b499D9532d"));
