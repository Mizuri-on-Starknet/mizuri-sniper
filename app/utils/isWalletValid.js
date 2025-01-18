import { ethers } from "ethers";

export const isWalletValid = (address) => {
  try {
    return ethers.isHexString(address);
    // return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const removeLeadingZeros = (hex) => {
  // Check if the input starts with "0x"
  if (!hex.startsWith("0x")) {
    throw new Error("Invalid hex string: must start with '0x'");
  }

  // Remove the "0x" prefix and leading zeros
  const standardizedHex = hex.slice(2).replace(/^0+/, "");

  // Add the "0x" prefix back
  return "0x" + standardizedHex;
};
