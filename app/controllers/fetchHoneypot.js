import axios from "axios";

export const fetchHoneypot = async (contractAddress, poolAddress) => {
  const response = await axios.get(
    `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}&pair=${poolAddress}`
  );
  const returnedObject = response.data;
  if (returnedObject.simulationSuccess) {
    return {
      token: returnedObject.token,
      withToken: returnedObject.withToken,
      simulationResult: {
        buyTax: returnedObject.simulationResult.buyTax,
        sellTax: returnedObject.simulationResult.sellTax
      }
    };
  } else
    return {
      token: "",
      withToken: "",
      simulationResult: {
        buyTax: "",
        sellTax: ""
      }
    };
};
