import axios from "axios";
import dotenv from "dotenv";
import { globals, log } from "../../utils/globals.js";
import { ethers } from "ethers";
import { EthPrice, EthPriceRaw } from "../../utils/prices.js";
dotenv.config();
const environment = process.env;

const ETHERSCAN_API = environment.ETHERSCAN_API;

// export const getAverageGasLimit = async () => {
//   const result = await axios.get(
//     `https://api.etherscan.io/api?module=stats&action=dailyavggaslimit&startdate=2024-02-01&enddate=2024-03-01&sort=asc&apikey=${ETHERSCAN_API}`
//   );
//   return result.data;
// };

export const getAverageGasLimit = async () => {
  const provider = new ethers.JsonRpcProvider(globals.infuraMainnet);
  const fees = await provider.getFeeData();
  const gasPrice = fees.gasPrice;
  log(gasPrice);
  const parsedAmount = Number(
    ethers.formatUnits(Number(gasPrice).toString(), "gwei")
  ).toFixed(3);
  // log(parsedAmount);
  const ethered = ethers.formatEther(gasPrice);
  // log(ethered);
  const price = await EthPriceRaw(ethered);
  // log(price);
  return `${parsedAmount} GWEI ≣ $${price}`;
};

// await getAverageGasLimit();
