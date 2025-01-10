import { ethers } from "ethers";
import Snipes from "../Schema/Snipes.js";
import { fetchTokenPrice } from "./moralis/moralis.js";

export const sellOff = async () => {
  const openSnipes = await Snipes.find({ "snipes.isActive": 1 });
  openSnipes.map((user) => {
    user.snipes.map(async (specificSnipes) => {
      const specificTokenPrice = await fetchTokenPrice(
        specificSnipes.tokenContractAddress
      );
      if (
        specificTokenPrice >= specificSnipes.takeProfitPrice ||
        specificTokenPrice <= specificSnipes.stopLossprice
      ) {
        // sell off token nigga !
      }
    });
  });
};
