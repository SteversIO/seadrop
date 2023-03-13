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
  const allowedSeaDrop: any[] = [];

  const baseUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/'; // omit {id} from URL for baseUri
  const contractUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids';

  // These are hard-coded into smart contract now.
  const maxGenesisSupply = 3333;
  const maxChildSupply = 6667;
  const maxSupply = maxGenesisSupply + maxChildSupply;

  const mermaidsSeaDrop = await MermaidsSeaDrop.deploy(
    name, symbol, allowedSeaDrop, 
    deployedMechanicsAddress);

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