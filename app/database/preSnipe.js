import PreSnipes from "../Schema/PreSnipes.js";
import { buyTrade } from "../controllers/buy.js";
import { closePreSnipe, closePreSnipeWithUsername } from "../robot/settings.js";
import { err, log } from "../utils/globals.js";
import { findUser } from "./users.js";

export const preSnipeActionDB = async (
  contractAddress,
  username,
  ctx,
  amount,
  encrypted_mnemonnics,
  walletAddress,
  decimals,
  tokenName,
  tokenTicker
) => {
  const bulkPromise = await Promise.all([
    PreSnipes.find({ username: username }),
    findUser(username)
  ]);
  const existingUser = bulkPromise[0];
  const user = bulkPromise[1];

  let walletIndex =
    user.wallets.findIndex(
      (wallet) => wallet.address.toLowerCase() == walletAddress.toLowerCase()
    ) + 1;

  if (existingUser.length > 0) {
    existingUser[0].snipes.push({
      isActive: 0,
      tokenContractAddress: contractAddress,
      amount: amount,
      encrypted_mnemonnics: encrypted_mnemonnics,
      walletAddress,
      walletIndex,
      decimals,
      tokenName,
      tokenTicker
    });
    await existingUser[0].save();
    await closePreSnipeWithUsername(username);
    return await ctx.reply(
      "♻️ now listening for a new Liquidity on address " + contractAddress
    );
  } else {
    const newSnipe = new PreSnipes({
      username,
      snipes: [
        {
          isActive: 0,
          tokenContractAddress: contractAddress,
          amount: amount,
          encrypted_mnemonnics: encrypted_mnemonnics,
          walletAddress,
          walletIndex,
          decimals,
          tokenName,
          tokenTicker
        }
      ]
    });
    await newSnipe.save();
    await closePreSnipeWithUsername(username);
    return await ctx.reply(
      "♻️ now listening for a new Liquidity on address " + contractAddress
    );
  }
};

export const preSnipeActionNew = async (contractAddress, username, ctx) => {
  try {
    await buyTrade(contractAddress, ctx, "snipe");
  } catch (error) {
    log("===== error occured from preSnipeAction ======");
    err(error);
  }
};

export const changePreSnipeState = async (
  username,
  contractAddress,
  newState
) => {
  // let response = await PreSnipes.findOne({ username });
  // const objectIndex = response.snipes.findIndex(
  //   (snipe) => snipe.contractAddress == contractAddress
  // );

  // if (objectIndex !== -1) {
  //   response.snipes[objectIndex].isActive = newState;
  //   await response.save();
  // }

  //   const updatedDocument = await PreSnipes.findOneAndUpdate(
  //     {
  //       username,
  //       "snipes.contractAddress": contractAddress
  //     },
  //     {
  //       $set: { "snipes.$.isActive": newState }
  //     },
  //     {
  //       new: true
  //     }
  //   );

  try {
    // Find the user document
    const user = await PreSnipes.findOne({ username });

    // If user is found
    if (user) {
      // Find the index of the snipe with the given contractAddress
      const snipeIndex = user.snipes.findIndex(
        (snipe) => snipe.tokenContractAddress === contractAddress
      );

      // If the snipe with the given contractAddress exists
      if (snipeIndex !== -1) {
        // Remove the snipe from the array
        user.snipes.splice(snipeIndex, 1);

        // Save the updated document
        await user.save();

        // Optionally, you may want to return a message indicating success
        return `Snipe for contract ${contractAddress} removed successfully.`;
      } else {
        return `Snipe for contract ${contractAddress} not found.`;
      }
    } else {
      return `User ${username} not found.`;
    }
  } catch (error) {
    console.error("Error removing snipe:", error);
    return "An error occurred while removing the snipe.";
  }
};

export const getAllActiveSnipesForUser = async (username) => {
  const user = await PreSnipes.findOne({ username });

  // If the user is found, filter snipes with isActive === 1
  if (user) {
    const activeSnipes = user.snipes.filter((snipe) => snipe.isActive === 0);
    return activeSnipes;
  } else {
    return []; // Return an empty array if user is not found
  }
};

export const removeSnipeFromList = async (username, contractAddress) => {
  try {
    // Find the user document
    const user = await PreSnipes.findOne({ username });

    // If user is found
    if (user) {
      // Find the index of the snipe with the given contractAddress
      const snipeIndex = user.snipes.findIndex(
        (snipe) => snipe.tokenContractAddress === contractAddress
      );

      // If the snipe with the given contractAddress exists
      if (snipeIndex !== -1) {
        // Remove the snipe from the array
        user.snipes.splice(snipeIndex, 1);

        // Save the updated document
        await user.save();

        // Optionally, you may want to return a message indicating success
        return `Snipe for contract ${contractAddress} removed successfully.`;
      } else {
        return `Snipe for contract ${contractAddress} not found.`;
      }
    } else {
      return `User ${username} not found.`;
    }
  } catch (error) {
    console.error("Error removing snipe:", error);
    return "An error occurred while removing the snipe.";
  }
};
