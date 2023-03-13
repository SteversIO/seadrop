import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
const { expect } = require("chai");
const hre = require("hardhat");
const assert = require("assert");

/**
 * This file is meant to be ran directly with Mocha, bypassing Hardhat's compile step!
 */ 
 // HARDHAT_NETWORK=localhost npx mocha --require ts-node/register scripts/**/*.spec.ts
/* 
 * OR:
 * run the command below in Javascript Debug Terminal in VSCode to use debug mode.
 */
 // HARDHAT_NETWORK=goerli npx mocha --debug-brk --inspect --require ts-node/register scripts/**/*.spec.ts


 /**
  * Ganache
  * url: `http://172.24.160.1:9001`
  */
// $ HARDHAT_NETWORK=ganache mocha --require ts-node/register scripts/**/*.spec.ts
  

 const DEFAULT_TIMEOUT = 5000;
describe("Test Hardness Setup", function() {
  this.timeout(DEFAULT_TIMEOUT);
  const goerli_mechanicsAddress = '0xdB557e6c848Be27c202Fe16751110A7E3fb34dcB'; // goerli
  const goerli_mermaidsAddress = '0x0F83ef3DF096dDd9f408Ac2a72756ec46e1aAD2f'; // goerli

  const mechanicsAddress = '0x00C93760cf4893e38b1B5b332e433875bc0081b3'; // hardhat's localhost, spun up by hh-0node
  const mermaidsAddress = '0x5b93d7bb05b7cFeF855B1E428C6446665035A24C'; // hardhat's localhost, spun up by hh-node
  let mermaidMechanics: Contract;
  let mermaidsSeaDrop: Contract;
  let owner: any;

  before(async () => {
    const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");
    const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");
    const [owner1] = await ethers.getSigners();
    owner = owner1;

    mermaidMechanics = await MermaidMechanics.attach(mechanicsAddress);
    mermaidsSeaDrop = await MermaidsSeaDrop.attach(mermaidsAddress);

    // mermaidMechanics = await hre.ethers.getContractAt("MermaidMechanics", mechanicsAddress);
    // mermaidsSeaDrop = await hre.ethers.getContractAt("MermaidsSeaDrop", mermaidsAddress);
  })
  
  it("autowires Hardhat Runtime Environment", () => {
    assert.notEqual(hre, undefined);
  });

  it("contract addresses match", () => {
    expect(mermaidMechanics.address).to.equal(mechanicsAddress);
    expect(mermaidsSeaDrop.address).to.equal(mermaidsAddress);
  })

  describe("test minting", () => {
    before(function () {
      this.timeout(200000);
    });

    after(function () {
      this.timeout(DEFAULT_TIMEOUT);
    });

    it("checks balance of automated minting address", async () => {
      const balanceInEth = await getBalance(owner.address);
      console.log(`Balance is ${balanceInEth} eth for ${owner.address}`);
    })

    it("fetches block number", async () => {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Block # is ${blockNumber}`);
    })

    const expectedMaxSupply = 10000;
    it("checks max supply", async () => {
      const maxSupply = await mermaidsSeaDrop.maxSupply();
      console.log(`maxSupply: ${maxSupply}`);
      assert.equal(maxSupply.toString(), expectedMaxSupply);
    });

    const mintQuantity = 20;
    const etherMintCostPerNft = 0.0001;
    it(`sets mint cost to ${etherMintCostPerNft} ether`, async () => {
      // 100000000000000 wei
      const mintCost = ethers.utils.parseUnits(`${etherMintCostPerNft}`, "ether");
      const tx = await mermaidsSeaDrop.setMintCost(mintCost);  // contract owner required for this call.
      assert.notEqual(tx.hash, undefined);
    });

    const loopCount = 5;
    it(`mints ${mintQuantity} NFTs x${loopCount}`, async () => {
      let counter = 0;
      let totalSupply = await mermaidsSeaDrop.totalSupply();
      console.log(`totalSupply: ${totalSupply}`);

      while(counter < loopCount && totalSupply < expectedMaxSupply) {
        let gasPrice: BigNumber = await ethers.provider.getGasPrice();
        const multiplier = 1.5; // avoids 'replacement fee too low' error.
        gasPrice = multiply(gasPrice, multiplier);

        const calculatedValue = mintQuantity * etherMintCostPerNft;
        const options = {
          value: ethers.utils.parseUnits(`${calculatedValue}`, "ether"),
          gasPrice,
          gasLimit: 302133,
        };

        const tx = await mermaidsSeaDrop.mint(mintQuantity, options);
        console.log(`Mint@tx: ${tx.hash}`)

        totalSupply = await mermaidsSeaDrop.totalSupply();
        const balance = await getBalance(owner.address);
        console.log(`Balance ${balance}, total supply: ${totalSupply}`)
        counter++;
      }

      assert.equal(true, true);
    });
  });
});

async function getBalance(address: string) {
  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balance);
  return balanceInEth;
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