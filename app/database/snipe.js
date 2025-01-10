import Snipes from "../Schema/Snipeso.js";

export const addSnipe = async (telegramId, snipeObject) => {
  const response = await Snipes.find({ username: telegramId });
  if (response.length > 0) {
    response[0].snipes.push({
      isActive: 0,
      tokenContractAddress: snipeObject.tokenContractAddress,
      entryMarketCap: snipeObject.entryMarketCap,
      poolAddress: snipeObject.poolAddress,
      amountPurchased: snipeObject.amountPurchased,
      tradeOpened: snipeObject.tradeOpened,
      pairName: snipeObject.pairName
    });
    await response[0].save();
  } else {
    const newSnipe = new Snipes({
      username: telegramId,
      walletAddress: snipeObject.walletAddress,
      snipes: [
        {
          isActive: 0,
          tokenContractAddress: snipeObject.tokenContractAddress,
          entryMarketCap: snipeObject.entryMarketCap,
          poolAddress: snipeObject.poolAddress,
          amountPurchased: snipeObject.amountPurchased,
          tradeOpened: snipeObject.tradeOpened,
          pairName: snipeObject.pairName
        }
      ]
    });
    return await newSnipe.save();
  }
};

export const sellOff = async (telegramId, snipeObject, bot, type) => {
  try {
    // Find the user's snipes document
    const userSnipes = await Snipes.findOne({ username: telegramId });

    if (!userSnipes) {
      // Handle case where user's snipes document does not exist
      console.log("User's snipes document not found");
      return;
    }

    // Find the index of the trade in the snipes array
    const tradeIndex = userSnipes.snipes.findIndex(
      (trade) =>
        trade.tokenContractAddress === snipeObject.tokenContractAddress &&
        trade.poolAddress === snipeObject.poolAddress &&
        trade.entryMarketCap === snipeObject.entryMarketCap &&
        trade.amountPurchased === snipeObject.amountPurchased
    );

    if (tradeIndex === -1) {
      console.log("Trade not found in user's snipes");
      return;
    }

    // Update isActive property of the trade to 0
    userSnipes.snipes[tradeIndex].isActive = 0;

    // Save the updated document
    await userSnipes.save();
    if (type == "loss") {
      bot.sendMessage(
        telegramId,
        `cheers 🎉, trade on pair ${snipeObject.pairName} closed in profit`
      );
    } else if (type == "profit") {
      bot.sendMessage(
        telegramId,
        `😵‍💫 trade on pair ${snipeObject.pairName} closed in loss.  you'll get them next time 💪`
      );
    }

    console.log("Trade successfully closed");
  } catch (error) {
    // Handle any errors
    console.error("Error selling off trade:", error);
  }
};
