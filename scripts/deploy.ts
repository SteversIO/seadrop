import { ethers } from "hardhat";

async function main() {
  console.log(`Starting deployments of Mermaids and mechanics.`);
  const deployedMechanicsAdress = await deployMermaidMechanics();

  const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");
  const name = "Mermaids";
  const symbol = "MMMCL";
  const allowedSeaDrop: any[] = [];
  const tokenUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/{id}';
  const mermaidsSeaDrop = await MermaidsSeaDrop.deploy(name, symbol, tokenUri, allowedSeaDrop, deployedMechanicsAdress);

  await mermaidsSeaDrop.deployed();

  console.log(
    `MermaidsSeaDrop deployed to ${mermaidsSeaDrop.address} with tokenUri ${tokenUri}`
  );
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