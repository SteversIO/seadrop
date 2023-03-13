import { ethers } from "hardhat";

async function main() {
  console.log(`Starting deployments of Mermaids and mechanics.`);
  const deployedMechanicsAddress = await deployMermaidMechanics();

  const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");
  const name = "Mermaids";
  const symbol = "MMMCL";
  const allowedSeaDrop: any[] = [];

  const tokenUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/{id}';
  const contractUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids';

  const maxGenesisMermaidSupply = 3333;
  const maxMermaidChildrenSupply = 6667;

  const mermaidsSeaDrop = await MermaidsSeaDrop.deploy(
    name, symbol, allowedSeaDrop, 
    tokenUri, maxMermaidChildrenSupply, deployedMechanicsAddress);

  await mermaidsSeaDrop.deployed();

  console.log(
    `MermaidsSeaDrop deployed to ${mermaidsSeaDrop.address} with tokenUri ${tokenUri}`
  );

  await mermaidsSeaDrop.setMaxSupply(maxGenesisMermaidSupply);
  console.log(`Max supply set to ${maxGenesisMermaidSupply}`);

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