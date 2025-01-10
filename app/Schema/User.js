import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
  defaultAddress: {
    type: Number,
    default: 0
  },
  username: String,
  encrypted_mnemonnics: { type: String, default: "" },
  snipe: {
    type: Number,
    enum: [0, 1],
    default: 0
  },
  buyType: {
    type: Number,
    enum: [0, 1],
    default: 0 // 0 is percentage, 1 is unit
  },
  trades: {
    type: {},
    default: {}
  },
  sellType: {
    type: Number,
    enum: [0, 1],
    default: 0 // 0 is percentage, 1 is unit
  },
  buyAmount: Number,
  sellAmount: Number,
  minmiumMC: {
    type: Number,
    default: 0
  },
  maxMC: {
    type: Number,
    default: 9007199254740991 // 2^53 -1
  },
  minmiumLiq: {
    type: Number,
    default: 0
  },
  maxLiq: {
    type: Number,
    default: 9007199254740991 // 2^53 -1
  },
  sellHiAmount: {
    type: Number,
    default: 0
  },
  sellHix: {
    type: Number,
    default: 0
  },
  sellLox: {
    type: Number,
    default: 0
  },
  sellLoAmount: {
    type: Number,
    default: 0
  },
  maxBuyTax: {
    type: Number,
    default: 10
  },
  maxSellTax: {
    type: Number,
    default: 10
  },
  walletAddress: {
    type: String,
    default: ""
  },
  wallets: {
    type: [],
    default: []
  },
  slippage: {
    type: Number,
    default: 10
  }
});

export default userSchema = mongoose.model("bitrock", userSchema);
