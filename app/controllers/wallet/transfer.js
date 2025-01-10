import { ethers } from "ethers"
import { err, globals, log } from "../../utils/globals.js"
import { decrypt } from "../encryption.js"



export const transferBrock = async (fromAddress, toAddress, amount, privateKey) => {
    try {
        const provider = new ethers.JsonRpcProvider(globals.infuraSepolia)
        privateKey = decrypt(privateKey)
        const walletInstance = new ethers.Wallet(privateKey, provider);

        const tx = await walletInstance.sendTransaction({
            to: toAddress,
            value: ethers.parseEther(amount.toString())
        })
        return tx.hash
    } catch (error) {
        log("================ error making transfer =============")
        err(error.info)
        throw error?.info || new Error("😵‍💫")
    }
}