import mongoose from "mongoose";

let preSnipeSchema = new mongoose.Schema({
  snipes: {
    type: []
  },
  username: String
});

export default preSnipeSchema = mongoose.model(
  "presnipebitrock",
  preSnipeSchema
);

// snipes
// contractAddress, entryMarketCap, entryPriceUSD, poolAddress, amount_purchased, tradeOpened, amount, walletAddress, tokenName, tokenTicker

//  isActive: {
//     type: Number,
//     enum: [0, 1, 2] // 0 isListening  ===> 1 isInTrade ===> 2 tradeClosed
//   },
// 384927
