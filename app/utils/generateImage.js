import axios from "axios";
import { log } from "../utils/globals.js";

function calculatePercentageChange(initialPrice, finalPrice) {
  let priceDifference = Number(finalPrice) - Number(initialPrice);

  let percentageChange = (priceDifference / initialPrice) * 100;

  return percentageChange;
}

function isNegative(number) {
  return Number(number) < 0;
}

export const generateImage = async (
  pair,
  tradeAction,
  initialPrice,
  currentPrice
) => {
  log(pair, tradeAction, initialPrice, currentPrice);
  const percentage = calculatePercentageChange(initialPrice, currentPrice);
  const response = await axios.post(
    "https://rest.apitemplate.io/v2/create-image?template_id=27d77b23b5f7e5a0",
    {
      overrides: [
        {
          name: "img_1",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/96be2fec-23c1-4bc3-ab96-221093d13c6c.jpg"
        },
        {
          name: "pair",
          text: pair,
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "trade_action",
          text: tradeAction,
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "text_1",
          text: `${percentage.toFixed(2)}%`,
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: isNegative(percentage) ? "#FF4D4D" : "#56E92D"
          // color: "#56E92D"
        },
        {
          name: "invested",
          text: "Invested",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "text_2",
          text: "Current value",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: isNegative(percentage) ? "#FF4D4D" : "#56E92D"
        },
        {
          name: "brock_logo",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/01e19f98-f031-439d-80b5-d83672ccfa63.png"
        },
        {
          name: "amount_bought",
          text: `$${initialPrice}`,
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "text_3",
          text: `${currentPrice}`,
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: isNegative(percentage) ? "#FF4D4D" : "#56E92D"
        },
        {
          name: "brock_logo_1",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/01e19f98-f031-439d-80b5-d83672ccfa63.png"
        },
        {
          name: "invested_value_usd",
          text: "$50.50",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "current_value_usd",
          text: "$50.50",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: isNegative(percentage) ? "#FF4D4D" : "#56E92D"
        },
        {
          name: "pnl",
          text: "PNL",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#D6D721"
        },
        {
          name: "elite_sniper_logo",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/19040649-92ce-44ac-899b-6ff8e82f3e5b.jpg"
        },
        {
          name: "bitrockelitebot",
          text: "@bitrockelitebot",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "apeonbitrock",
          text: "@apeonbitrock",
          textBackgroundColor: "rgba(0, 0, 0, 0)",
          color: "#FFFFFF"
        },
        {
          name: "telegram_logo",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/67108168-d002-4613-b054-5459775d2ed6.png"
        },
        {
          name: "telegram_logo_1",
          src: "https://apitemplateio-user.s3-ap-southeast-1.amazonaws.com/21680/31616/67108168-d002-4613-b054-5459775d2ed6.png"
        }
      ]
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": "5fb0MjE2ODA6MTg3OTU6VVFRUWhnZHk5aDJDSkxDTQ="
      }
    }
  );

  if (response.data.status && response.data.status != "success") {
    throw new Error({
      message: "something went wrong fetching pnl"
    });
  }
  return response;
};
