import mongoose from "mongoose";

let premiumSchema = new mongoose.Schema({
  code: String,
  used: { default: [], type: [String] },
  limit: { type: Number, default: 10 }
});

export default premiumSchema = mongoose.model("bitrockpremium", premiumSchema);

// snipes
// contractAddress, entryMarketCap, entryPriceUSD, poolAddress, amount_purchased, tradeOpened, amount, walletAddress

//  isActive: {
//     type: Number,
//     enum: [0, 1, 2] // 0 isListening  ===> 1 isInTrade ===> 2 tradeClosed
//   },
