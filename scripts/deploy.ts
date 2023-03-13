import { ethers } from "hardhat";

async function main() {
  console.log(`Starting deployments of Mermaids and mechanics.`);
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

  console.log(
    `MermaidsSeaDrop deployed to ${mermaidsSeaDrop.address} with tokenUri ${baseUri}`
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});