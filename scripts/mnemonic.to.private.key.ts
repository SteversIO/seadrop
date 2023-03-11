import { ethers } from "ethers";

async function main() {
  console.log("Converting mnemonic to key");
  let mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
  let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
  console.log(mnemonicWallet.privateKey);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});