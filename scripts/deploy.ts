import { BigNumber } from "ethers";
import { ethers } from "hardhat";

async function main() {
  console.log(`Starting deployments of Mermaids and mechanics.`);

  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(`Block # is ${blockNumber}`);

  const [owner] = await ethers.getSigners();

  const balanceInEth = await getBalance(owner.address);
  console.log(`Balance is ${balanceInEth} eth for ${owner.address}`);

  const deployedMechanicsAddress = await deployMermaidMechanics();

  const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");
  const name = "Mermaids";
  const symbol = "MMMCL";

  // Deployed by OpenSea, manages the SeaDropToken contracts (like our MermaidsSeaDrop).
  const seadrop = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5';
  const allowedSeaDrop: any[] = [seadrop];

  const baseUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/'; // omit {id} from URL for baseUri
  const contractUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids';

  // These are hard-coded into smart contract now.
  const maxGenesisSupply = 3333;
  const maxChildSupply = 6667;
  const maxSupply = maxGenesisSupply + maxChildSupply;

  const mermaidsSeaDrop = await MermaidsSeaDrop.deploy(
    name, symbol, allowedSeaDrop, 
    deployedMechanicsAddress);

    const publicDrop = {
      mintPrice: "100000000000000000", // 0.1 ether      
      startTime: Math.round(Date.now() / 1000) - 100,
      endTime: Math.round(Date.now() / 1000) + 100,
      maxTotalMintableByWallet: 10,
      feeBps: 1000, // 10%
      restrictFeeRecipients: true,
    };

  await mermaidsSeaDrop.deployed();

  await mermaidsSeaDrop.setBaseURI(baseUri);
  await mermaidsSeaDrop.setContractURI(contractUri);

  const etherMintCostPerNft = 0.0001;
  const mintCost = ethers.utils.parseUnits(`${etherMintCostPerNft}`, "ether");
  await mermaidsSeaDrop.setMintCost(mintCost);
  console.log(`Set mint cost to ${etherMintCostPerNft}`);
  console.log(
    `MermaidsSeaDrop deployed to ${mermaidsSeaDrop.address} with tokenUri ${baseUri} and contractUri ${contractUri}`
  );

  await mermaidsSeaDrop.setMaxSupply(maxSupply);
  console.log(`Max supply set to ${maxSupply}`);

  await mermaidsSeaDrop.setContractURI(contractUri);
  console.log(`Contract URI set to ${contractUri}`);

  const options = await defaultGasOptions();

  let tx = await mermaidsSeaDrop.updateCreatorPayoutAddress(seadrop, owner.address, options);
  console.log(`Updating creator payout address @tx: ${tx.hash}`);

  tx = await mermaidsSeaDrop.updateAllowedFeeRecipient(seadrop, owner.address, true, options);
  console.log(`Updating allowed fee recipient@tx: ${tx.hash}`);

  tx = await mermaidsSeaDrop.updatePublicDrop(seadrop, publicDrop, options);
  console.log(`Updating public drop@tx: ${tx.hash}`);
}

async function deployMermaidMechanics() {
  const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");
  const mermaidMechanics = await MermaidMechanics.deploy();
  await mermaidMechanics.deployed();
  console.log(
      `MermaidMechanics deployed to ${mermaidMechanics.address}`
    );

  return mermaidMechanics.address;
}

async function getBalance(address: string) {
  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balance);
  return balanceInEth;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function defaultGasOptions() {
  let gasPrice: BigNumber = await estimateGas();
  return {
    gasPrice,
    gasLimit: 302133,
  };
}

async function estimateGas() {
  let gasPrice: BigNumber = await ethers.provider.getGasPrice();
  const multiplier = 2.5; // avoids 'replacement fee too low' error.
  gasPrice = multiply(gasPrice, multiplier);

  return gasPrice;
}

function multiply(
  bn: BigNumber | string,
  number: number,
): BigNumber {
  const oneDotZero: BigNumber = ethers.utils.parseUnits("1", 18);
  const bnForSure = BigNumber.from(bn);
  const numberBN = ethers.utils.parseUnits(number.toString(), 18);

  return bnForSure.mul(numberBN).div(oneDotZero);
}