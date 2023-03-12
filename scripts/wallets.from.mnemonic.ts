import { Wallet } from "ethers";

async function main() {
  console.log("Converting mnemonic to wallet keys");
  let mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"
  
  const addresses = [];
  for(let i=0; i<10; i++) {
    const bip32derivation = `m/44'/60'/0'/0/${i}`
    const wallet = Wallet.fromMnemonic(mnemonic, bip32derivation);
    addresses.push(wallet);
  }
  console.log("Addresses from mnemonic are: ", addresses);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});