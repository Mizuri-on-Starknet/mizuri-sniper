import { Markup } from "telegraf";

import { findUser, isAutoBuy } from "../database/users.js";
import { fetchDefaultWallet } from "../robot/settings.js";
import numeral from "numeral";
import { getAllActiveSnipesForUser } from "../database/preSnipe.js";
import { err, log } from "./globals.js";
import { selectPreSnipes, selectToken } from "../index.js";
import {
  fetchTokenBalances,
  fetchTokenDetails
} from "../controllers/moralis/moralis.js";
import { millify } from "millify";
import { fromCustomLamport } from "./converters.js";
import { chain } from "./prices.js";

export const inlineKeyboard = async (telegramId) => {
  const actions = await Promise.all([
    findUser(telegramId),
    fetchDefaultWallet(telegramId)
  ]);
  const userDefaultWallet = actions[1];
  const wallets = actions[0];
  const gas_type = [0, 1];
  return Markup.inlineKeyboard([
    [Markup.button.callback(" SELECT DEFAULT WALLET ", "selectWallet")],

    wallets.wallets.map((wallet, index) =>
      Markup.button.callback(
        `${userDefaultWallet == index ? "✅" : ""} w${index + 1} `,
        `selectWallet:w${index + 1}`
      )
    ),
    wallets.wallets.map((wallet, index) =>
      Markup.button.callback(
        `Deploy w${index + 1} 🚀`,
        `deployWallet:w${index + 1}`
      )
    ),
    [
      // [
      //   (Markup.button.callback(
      //     `${userDefaultWallet == 0 ? "✅" : ""} w1 `,
      //     "selectWallet:w1"
      //   ),
      //   Markup.button.callback(
      //     `${userDefaultWallet == 1 ? "✅" : ""} w2 `,
      //     "selectWallet:w2"
      //   ))
      //   // Markup.button.callback(
      //   //   `${userDefaultWallet == 2 ? "✅" : ""} w3 `,
      //   //   "selectWallet:w3"
      //   // )
      // ],
      Markup.button.callback("🟢 Buy ", "buy"),
      Markup.button.callback("🔫 Pre Snipe ", "presnipe"),
      Markup.button.callback("🔴 Sell ", "sell")
    ],
    [
      // Markup.button.callback(" New Pairs ", "newPairs"),
      Markup.button.callback("Active Snipes ", "openPositions"),
      Markup.button.callback("⚙️ Settings ", "settings")
    ],
    [Markup.button.callback(" SELECT PRIMARY GAS ", "selectGas")],

    gas_type.map((wallet, index) =>
      Markup.button.callback(
        `${wallets.main_token == index ? "✅" : ""} ${
          index == 0 ? "$ETH" : "$STRK"
        } `,
        `selectGas:g${index}`
      )
    ),
    // [Markup.button.callback(" 🔑 Mnemonics ", "button8")],

    [
      Markup.button.webApp(
        " Help ",
        "https://bitrock-elitebot.gitbook.io/elitebotguide"
      )
      // Markup.button.callback("💰 View Settings ", "button7")
      // Markup.button.callback("🔁 Refresh ", "restart")
    ]
  ]);
};
export const settingsInlineKeyboard = async (telegramId) => {
  const autoBuy = await isAutoBuy(telegramId);
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(" 📤️ Export Wallet ", "exportW"),
      Markup.button.callback(" 👑 Premium ", "premiumF")
    ],
    [
      Markup.button.callback("🔥 Reset Wallet ", "promptResetWallets"),
      Markup.button.callback("🏠 Main Menu ", "mainMenu")
      // Markup.button.callback("💰 View Settings ", "button7")
      // Markup.button.callback("🔁 Refresh ", "restart")
    ],
    [Markup.button.callback("🪙 Withdraw $STRK ", "withdraw")]
  ]);
};

// 🔥🔥🔥🔥🔥🔥🔥🔥🔥 RESET WALLET 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

export const showResetWallets = async (wallets) => {
  let rows = [];

  // Iterate through the wallets and group them into rows of two
  for (let i = 0; i < wallets.length; i += 2) {
    // Create a row with up to two buttons
    let row = [
      Markup.button.callback(`Reset Wallet ${i + 1}`, `resetWallet:${i + 1}`)
    ];

    // Add a second button to the row if there is an additional wallet
    if (i + 1 < wallets.length) {
      row.push(
        Markup.button.callback(`Reset Wallet ${i + 2}`, `resetWallet:${i + 2}`)
      );
    }

    // Add the row to the array of rows
    rows.push(row);
  }
  rows.push([
    Markup.button.callback(" ⬅️ Back ", "backToSettings"),
    Markup.button.callback(" 🏠 Home ", "mainMenu")
  ]);

  // Return the inline keyboard markup
  return Markup.inlineKeyboard(rows);
};

export const fastFastClose = Markup.inlineKeyboard([
  Markup.button.callback("❌ Close ", "vanish")
]);

export const removeFromPreSnipeList = Markup.inlineKeyboard([
  Markup.button.callback("❌ Close ", "removeFromPreSnipeList")
]);

export const fastKeyboard = Markup.inlineKeyboard([
  [
    // Markup.button.callback("⚙️ Pre Snipe ", "buySettings"),
    Markup.button.callback("🔁 Refresh ", "mainMenu")
    // Markup.button.callback("⚙️ Sell Settings", "sellSettings")
  ]
]);

export const selectWallet = Markup.inlineKeyboard([
  [Markup.button.callback(" SELECT WALLET TO USE ", "selectWallet")],
  [
    Markup.button.callback(" w1 ", "selectWallet1"),
    Markup.button.callback(" w2 ", "selectWallet2")
    // Markup.button.callback(" w3 ", "selectWallet3")
  ]
]);

export const buySettings = (user) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(" ⬅️ Back ", "backToSettings"),
      Markup.button.callback(" 🏠 Home ", "mainMenu")
    ],
    [Markup.button.callback("== Buy Type ==", "buytype")],
    [
      Markup.button.callback(
        `${user.buyType == 0 ? "✅" : ""} % percentage `,
        "buyPercentage"
      ),
      Markup.button.callback(
        `${user.buyType == 1 ? "✅" : ""} x amount `,
        "buyXAmount"
      )
    ],
    // [
    //   Markup.button.callback(" == EDIT == ", "edit..."),
    //   Markup.button.callback(" == RESET == ", "reset...")
    // ],
    [
      Markup.button.callback(" ✏️ Buy amount ", "editBuyAmount"),
      Markup.button.callback(" Clear  ", "resetBuyAmount")
    ]
    // [
    //   Markup.button.callback(" ✏️ Min MarketCap ", "editMinMCap"),
    //   Markup.button.callback(" Clear MarketCap ", "resetMinMCap")
    // ],
    // [
    //   Markup.button.callback(" ✏️ Max MarketCap ", "editMaxMCap"),
    //   Markup.button.callback(" Clear MarketCap ", "resetMaxMCap")
    // ],
    // [
    //   Markup.button.callback(" ✏️ Min Liquidity ", "editMinLiquidity"),
    //   Markup.button.callback(" Clear Min ", "resetMinLiquidity")
    // ],
    // [
    //   Markup.button.callback(" ✏️ Max Liquidity ", "editMaxLiquidity"),
    //   Markup.button.callback(" Clear Max ", "resetMaxLiquidity")
    // ]
  ]);

// [
//   Markup.button.callback(" ✏️ Max Buy Tax ", "editMaxBuyTax"),
//   Markup.button.callback(" ⌫ Clear Max ", "resetMaxBuyTax")
// ];

// [
//   Markup.button.callback(" ✏️ Max Sell Tax  ", "editMaxSellTax"),
//   Markup.button.callback(" ⌫ Clear Max ", "resetMaxSellTax")
// ],

export const withdrawYesorNo = Markup.inlineKeyboard([
  [
    Markup.button.callback(" ✅ Yes ", "yesWithdraw"),
    Markup.button.callback(" ❌ No ", "noWithdraw")
  ]
]);

export const sellSettings = Markup.inlineKeyboard([
  [
    Markup.button.callback(" ⬅️ Back ", "backToSettings"),
    Markup.button.callback(" 🏠 Home ", "mainMenu")
  ],
  [
    Markup.button.callback(" == EDIT == ", "edit..."),
    Markup.button.callback(" == RESET == ", "reset...")
  ],
  [
    Markup.button.callback(" ✏️ Sell-Hi-x ", "editSellHix"),
    Markup.button.callback(" Clear Hi-x ", "resetSellHix")
  ],
  [
    Markup.button.callback(" ✏️ Sell-Lo-x ", "editSellLox"),
    Markup.button.callback(" Clear Lo-x ", "resetSellLox")
  ],
  [
    Markup.button.callback(" ✏️ Sell-Hi Percent ", "editSellHiAmount"),
    Markup.button.callback(" Clear Amount ", "resetSellHiAmount")
  ],
  [
    Markup.button.callback(" ✏️ Sell-Lo Percent ", "editSellLoAmount"),
    Markup.button.callback(" Clear Amount ", "resetSellLoAmount")
  ]
]);

// [
//     Markup.button.callback(" 0.5 ETH ✏️ ", "avax"),
//     Markup.button.callback(" 1 ETH ✏️ ", "avax"),
//     Markup.button.callback(" 3 ETH ✏️ ", "avax")
//   ],
//   [
//     Markup.button.callback(" 5 ETH ✏️ ", "avax"),
//     Markup.button.callback(" 10 ETH ✏️ ", "avax")
//   ],
//   [Markup.button.callback(" Buy Slippage: 15% ✏️ ", "setslippage")],
//   [Markup.button.callback(" 🔴 MEV Protect (Buys) ", "autoBuy")],
//   [
//     Markup.button.callback(" 50% ✏️ ", "avax"),
//     Markup.button.callback(" 100% ✏️ ", "avax"),
//     Markup.button.callback(" 3 ETH ✏️ ", "avax")
//   ],
//   [Markup.button.callback(" Sell Slippage: 15% ✏️ ", "setslippage")],
//   [Markup.button.callback(" 🔴 MEV Protect (Sells) ", "autoBuy")],
//   [Markup.button.callback(" Advanced Mode ➡ ", "autoBuy")],
// ]

export const buyOptions = (
  contractAddress,
  walletIndex,
  walletAddress,
  balanceBrock,
  balanceUSD,
  slippage,
  tokenBalance,
  brockBalance,
  usdBalance,
  tokenName
) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `💳 Wallet ${walletIndex + 1} - ${truncateText(
          walletAddress,
          4
        )} ✅ - Balance ${balanceBrock} $STRK ≡ ${balanceUSD}$`,
        "nothing"
      )
    ],
    [Markup.button.callback(` --- CA Balance --- `, "nothinng")],
    [
      Markup.button.callback(
        `📋 Contract Balance ≡ ${tokenBalance} $${tokenName} ≡ ${brockBalance} $STRK ≡ $${usdBalance}`,
        "nothinnng"
      )
    ],
    [Markup.button.callback(` --- Your Actions --- `, "nothing")],
    [
      Markup.button.callback("🎯 Buy 100 $STRK ", "100"),
      Markup.button.callback("🎯 Buy 500 $STRK ", "500")
    ],
    [
      Markup.button.callback("🎯 Buy 1000 $STRK ", "1000"),
      Markup.button.callback("🎯 Buy 1500 $STRK ", "1500")
    ],
    [
      Markup.button.callback("🎯 Buy X", "buy_custom"),
      Markup.button.callback(`🧪 Slippage % (${slippage}) `, "editSlippage")
    ],
    [
      Markup.button.callback("🔄 Sell Menu ", "switchToSell"),

      Markup.button.callback("🏠 Main Menu ", "mainMenu")
    ],
    [
      Markup.button.url(
        "📊 Chart ",
        `https://www.geckoterminal.com/${chain}/pools/${contractAddress}`
      ),
      Markup.button.callback("❌ Close ", "vanish")
    ]
  ]);

export const truncateText = (text, length) => {
  const maxLength = length || 6;
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + "...";
  } else {
    return text;
  }
};

export const sellOptions = (
  contractAddress,
  walletIndex,
  walletAddress,
  balanceBrock,
  balanceUSD,
  tokenBalance,
  brockBalance,
  usdBalance,
  tokenName
) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `💳 Wallet ${walletIndex + 1} - ${truncateText(
          walletAddress,
          4
        )} ✅ - Balance ${balanceBrock} $STRK ≡ ${balanceUSD}$`,
        "nothing"
      )
    ],
    [Markup.button.callback(` --- CA Balance --- `, "nothinng")],
    [
      Markup.button.callback(
        `📋 Contract Balance ≡ ${tokenBalance} $${tokenName} ≡ ${brockBalance} $STRK ≡ $${usdBalance}`,
        "nothinnng"
      )
    ],
    [Markup.button.callback("🔄 Reload ", "switchToSell")],
    [Markup.button.callback(` --- Your Actions --- `, "nothing")],
    [
      Markup.button.callback("⚡️ Sell 10% ", "10p"),
      Markup.button.callback("⚡️ Sell 20% ", "20p"),
      Markup.button.callback("⚡️ Sell 30%", "30p")
    ],
    [
      Markup.button.callback("⚡️ Sell 50% ", "50p"),
      Markup.button.callback("⚡️ Sell 70% ", "70p"),
      Markup.button.callback("⚡️ Sell 90%", "90p")
    ],
    [
      Markup.button.callback("⚡️ Sell X", "sell_custom"),
      Markup.button.callback("⚡️ Sell 100% ", "100p")
    ],
    [
      Markup.button.callback("🔄 Buy Menu ", "switchToBuy"),
      Markup.button.callback("🏠 Main Menu ", "mainMenu"),
      Markup.button.callback("🖼️ Share PNL ", "pnl")
    ],
    [
      Markup.button.url(
        "📊 Chart ",
        `https://www.geckoterminal.com/${chain}/pools/${contractAddress}`
      ),
      Markup.button.callback("❌ Close ", "vanish")
    ]
  ]);

export const snipeOptions = (
  contractAddress,
  walletIndex,
  walletAddress,
  balanceBrock,
  balanceUSD
) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `💳 Wallet ${walletIndex + 1} - ${truncateText(
          walletAddress,
          4
        )} ✅ - Balance ${balanceBrock} $STRK - ${balanceUSD}$`,
        "nothing"
      )
    ],
    [Markup.button.callback(` --- Your Actions --- `, "nothing")],
    [
      Markup.button.callback("🔫 Snipe 100 STRK ", "100s"),
      Markup.button.callback("🔫 Snipe 200 STRK ", "200s")
    ],
    [
      Markup.button.callback("🔫 Snipe 300 STRK", "300s"),
      Markup.button.callback("🔫 Snipe 500 STRK", "500s")
    ],
    [
      Markup.button.callback("🔫 Snipe X ", "snipe_custom"),
      Markup.button.callback("🔫 Snipe 1000 STRK ", "1000s")
    ],
    [Markup.button.callback("🔫 Snipe Max Wallet ", "snipe_max")],
    [
      Markup.button.url(
        "📊 Chart ",
        `https://www.geckoterminal.com/${chain}/pools/${contractAddress}`
      ),
      Markup.button.callback("❌ Close ", "vanish")
    ]
  ]);

export const formatNumber = (bigInt) => {
  // log(millify(200e5));
  // return millify(Number(number));

  const strBigInt = bigInt.toString();
  const absBigInt = BigInt(strBigInt < 0 ? strBigInt.slice(1) : strBigInt);

  if (absBigInt < 1000n) {
    return absBigInt.toString();
  } else if (absBigInt < 1000000n) {
    return (absBigInt / 1000n).toString() + "K";
  } else if (absBigInt < 1000000000n) {
    return (absBigInt / 1000000n).toString() + "M";
  } else if (absBigInt < 1000000000000n) {
    return (absBigInt / 1000000000n).toString() + "B";
  } else {
    return (absBigInt / 1000000000000n).toString() + "T";
  }
};

export const formatNormalNumber = (number) => {
  return millify(Number(number));
};

export const buyMessage = (response, body, poolData) =>
  `
<b>🌕 ${response.data.data.attributes.name} ($${
    response.data.data.attributes.symbol
  }) 🔗 STARKNET Token</b>\n<b>LP: <code>${
    poolData
      ? response.data.data.relationships.top_pools.data[0].id.split(
          "starknet-alpha_"
        )[1]
      : "nil"
  }</code>\nCA: <code>${
    response.data.data.attributes.address
  }</code></b>\nV2 Pool\n\n
<b>🔺 Price</b>                 | $${
    response.data.data.attributes.price_usd
      ? response.data.data.attributes.price_usd
      : "nil"
  }
<b>🗄 Total Supply</b>  | ${formatNumber(
    fromCustomLamport(
      response.data.data.attributes.total_supply,
      response.data.data.attributes.decimals
    ).toFixed(0)
  )} ${response.data.data.attributes.symbol}
<b>💰 Balance</b>           | ${body.balance}
<b>💧 Liquidity</b>         | $${
    poolData ? poolData.attributes["reserve_in_usd"] : "nil"
  }
<b>🧢 Market Cap</b>    | $${formatNumber(
    BigInt(Number(response.data.data.attributes.fdv_usd).toFixed(0))
  )}
<b>⚖️ Taxes</b>               | Ⓑ ${body.buyTax || 0}% ⓢ ${body.sellTax || 0}%

<span class="tg-spoiler">💬 If you want to stay updated 24/7, join our Telegram for more info at  || @mizuri_starknet_bot 💬</span>\n\n`;

{
  /* <a href='https://app.uniswap.org/tokens/ethereum/${
  response.data.data.attributes.address
}'>Uniswap</a> | <a href="https://etherscan.io/address/${
  response.data.data.attributes.address
}">Etherscan</a>\n */
}
// Liquidity: 11.1 WETH
// Max Buy: 100% ≣ 1.0e+6
// Max Sell: 100% ≣ 1.0e+6
// Max Wallet: 100% ≣ 1.0e+6
// ⚖️ Taxes         | Ⓑ 3.0% ⓢ 3.0%
{
  /* <b>🔥 Burnt</b>               | 0% */
}
{
  /* <b>📉 CA Balance</b>    | 0.17% */
}

//<b>⚖️ Taxes</b>         | Ⓑ ${body.honeyPot.simulationResult.buyTax || 0}% ⓢ ${
// body.honeyPot.simulationResult.sellTax || 0
//}%

export const openSnipes = async (ctx) => {
  let username = ctx.from.id.toString();
  try {
    // const userAddress = await findUser(username);
    const userSnipes = await getAllActiveSnipesForUser(username);
    log(" ==== user snipes ===");
    log(userSnipes);
    const firstToken = await fetchTokenDetails(
      userSnipes[0].tokenContractAddress
    );
    // const walletBalances = await fetchTokenBalances();

    selectPreSnipes[username] = { tokenIndex: 0 };
    selectPreSnipes[username].max = userSnipes.length - 1;
    selectPreSnipes[username].tokens = userSnipes;

    selectToken[username] = { tokenIndex: 0 };
    selectToken[username].max = 4;
    selectToken[username].tokens = [
      {
        token_address: "test",
        symbol: "MC",
        name: "Yest",
        logo: null,
        thumbnail: null,
        decimals: 18,
        balance: "564277822148025607328794",
        possible_spam: false,
        verified_contract: false
      },
      {
        token_address: "test",
        symbol: "FROGS",
        name: "Test",
        logo: null,
        thumbnail: null,
        decimals: 9,
        balance: "499248873309964947",
        possible_spam: false,
        verified_contract: false
      },
      {
        token_address: "test",
        symbol: "USD",
        name: "test",
        logo: null,
        thumbnail: null,
        decimals: 18,
        balance: "35072234456773777776",
        possible_spam: false,
        verified_contract: false
      }
    ];
    // selectToken[username] = { tokenIndex: 0 };
    // selectToken[username].max = walletBalances.length - 1;
    // selectToken[username].tokens = walletBalances;

    userSnipes.length > 0
      ? await ctx
          .replyWithHTML(
            `<b>🌕️ ${firstToken[0].name || ""} ($${
              firstToken[0].symbol || ""
            })</b>\n🪅 <b>CA</b>: <code>${
              firstToken[0].address || ""
            }</code>\n💧 <b>Status</b>: Pending \n\nTotal Pending: ${
              selectPreSnipes[username].max + 1
            }\n💵 <b>Amount</b>: ${
              selectPreSnipes[username].tokens[0].amount || 0
            } $STRK\n💳️ <b>Wallet</b> ${
              selectPreSnipes[username].tokens[
                selectPreSnipes[username].tokenIndex
              ].walletIndex || "-"
            }`,
            Markup.inlineKeyboard([
              [
                Markup.button.callback(`⏪ Prev`, `prevB`),
                Markup.button.callback(`⏩ Next`, `nextB`)
              ],
              [Markup.button.callback(`🛑 Cancel Position`, `closeSnipe`)]
            ])
          )
          .then((sentMessage) => {
            // log(sentMessage);
            selectPreSnipes[username].messageId = sentMessage.message_id;
          })
      : await ctx.reply(
          "No open Snipes",
          Markup.inlineKeyboard([
            [Markup.button.callback("❌ Close ", "vanish")]
          ])
        );
  } catch (error) {
    err("===== error from fetcing openSnipes ====");
    err(error);
    await ctx.reply(
      "No open Snipes",
      Markup.inlineKeyboard([[Markup.button.callback("❌ Close ", "vanish")]])
    );
  }
};
