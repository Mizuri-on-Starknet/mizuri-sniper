import axios from "axios";
import dotenv from "dotenv";
import { eth_address } from "../controllers/fetchBalance.js";
dotenv.config();
const env = process.env;

export const pro_endpoint = "https://api.geckoterminal.com/api/v2";
export const chain = "starknet-alpha";

// "https://pro-api.coingecko.com/api/v3/onchain";

export const tokenPrice = async (contractAddress) => {
  const response = await axios.get(
    `${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`,
    {
      headers: {
        "x-cg-pro-api-key": env.COINGECKO_API_KEY
      }
    }
  );

  const usdPrice = response.data.data.attributes.price_usd;

  return Number(usdPrice);
};

export const tokenInfo = async (contractAddress) => {
  const response = await axios.get(
    `${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`,
    {
      headers: {
        "x-cg-pro-api-key": env.COINGECKO_API_KEY
      }
    }
  );

  return response.data.data;
};

export const EthPrice = async (balance) => {
  if (Number(balance) <= 0) return 0;
  let contractAddress =
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" ||
    eth_address;
  const response = await axios.get(
    `${pro_endpoint}/networks/${chain}/tokens/${contractAddress}`,
    {
      headers: {
        "x-cg-pro-api-key": env.COINGECKO_API_KEY
      }
    }
  );

  const userBalance = (
    Number(response.data.data.attributes.price_usd) * Number(balance)
  ).toFixed(3);
  return userBalance;
};

export const tokenVariantPrice = async (tokenBalance, contractAddress) => {
  const tokenPricee = await tokenPrice(contractAddress);

  const usdBalance = Number(tokenPricee * Number(tokenBalance)).toFixed(2);

  let brockAddress =
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"; /// bridged ether
  const response = await axios.get(
    `${pro_endpoint}/networks/${chain}/tokens/${brockAddress}`,
    {
      headers: {
        "x-cg-pro-api-key": env.COINGECKO_API_KEY
      }
    }
  );

  const brockPrice = Number(response.data.data.attributes.price_usd);

  const brockBalance = Number(usdBalance / brockPrice).toFixed(2);

  return {
    usdBalance,
    brockBalance
  };
};

export const EthPriceRaw = async (balance) => {
  if (Number(balance) <= 0) return 0;
  const response = await axios.get(
    `https://pro-api.coinmarketcap.com/v2/tools/price-conversion?symbol=ETH&amount=${balance}`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.COINMARKET_API_KEY
      }
    }
  );

  const userBalance = response.data.data[0].quote.USD.price.toFixed(7);
  return userBalance;
};

export const poolInfo = async (poolAddress, bot) => {
  try {
    const response = await axios.get(
      `${pro_endpoint}/networks/${chain}/pools/${poolAddress}?include=base_token%2Cquote_token`,
      {
        headers: {
          "x-cg-pro-api-key": env.COINGECKO_API_KEY
        }
      }
    );
    const formattedResponse = response.data.data;
    return formattedResponse;
  } catch (error) {
    return new Error("not found");
  }
};
