import mongoose from "mongoose";

let snipeSchema = new mongoose.Schema({
  snipes: {
    type: []
  },
  username: String,

  walletAddress: {
    type: String,
    default: ""
  }
});

export default snipeSchema = mongoose.model("snipebitrock", snipeSchema);

// snipes
// contractAddress, entryMarketCap, entryPriceUSD, poolAddress, amount_purchased, tradeOpened

//  isActive: {
//     type: Number,
//     enum: [0, 1] // 0 isNotActive  ===> 1 isActive
//   },
