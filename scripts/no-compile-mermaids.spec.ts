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
 // HARDHAT_NETWORK=ganache npx mocha --debug-brk --inspect --require ts-node/register scripts/**/*.spec.ts


 /**
  * Ganache
  * url: `http://172.24.160.1:9001`
  */
// $ HARDHAT_NETWORK=ganache mocha --require ts-node/register scripts/**/*.spec.ts
  

 const DEFAULT_TIMEOUT = 5000;
describe("Test Hardness Setup", function() {
  this.timeout(DEFAULT_TIMEOUT);
  const goerli_mechanicsAddress = '0x456D496Ac9d64Df077CfE94405662A57530C1e0a'; // goerli
  const goerli_mermaidsAddress = '0x1A065B0F74Fd1B552E8f4Ad679379450E86C2bE0'; // goerli

  let mechanicsAddress = '0x506115dA29e7b24454788870Bf53D3f962A2c6dC'; // hardhat's localhost, spun up by hh-0node
  let mermaidsAddress = '0x098aA8A99668C8458624D38A86749a5C41f4a7F9'; // hardhat's localhost, spun up by hh-node

  mechanicsAddress = goerli_mechanicsAddress;
  mermaidsAddress = goerli_mermaidsAddress;

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

    const expectedMaxSupply = 110;

    it("sets max supply", async () => {
      const options = await defaultGasOptions();
      const tx = await mermaidsSeaDrop.setMaxSupply(expectedMaxSupply);
      console.log(`maxSupply set to: ${expectedMaxSupply}`);
    })

    it("checks max supply", async () => {
      const maxSupply = await mermaidsSeaDrop.maxSupply();
      console.log(`maxSupply: ${maxSupply}`);
      assert.equal(maxSupply.toString(), expectedMaxSupply);
    });



    const mintQuantity = 10;
    const etherMintCostPerNft = 0.0001;
    it(`sets mint cost to ${etherMintCostPerNft} ether`, async () => {
      // 100000000000000 wei
      const options = await defaultGasOptions();
      const mintCost = ethers.utils.parseUnits(`${etherMintCostPerNft}`, "ether");
      const tx = await mermaidsSeaDrop.setMintCost(mintCost, options);  // contract owner required for this call.
      assert.notEqual(tx.hash, undefined);
    });

    const loopCount = 0;
    it(`mints ${mintQuantity} NFTs x${loopCount}`, async () => {
      let counter = 0;
      let totalSupply = await mermaidsSeaDrop.totalSupply();
      console.log(`totalSupply: ${totalSupply}`);

      while(counter < loopCount && totalSupply < expectedMaxSupply) {
        let gasPrice: BigNumber = await estimateGas();

        const calculatedValue = mintQuantity * etherMintCostPerNft;
        const options = {
          value: ethers.utils.parseUnits(`${calculatedValue}`, "ether"),
          gasPrice,
          gasLimit: 302133,
        };

        const tx = await mermaidsSeaDrop.mint(mintQuantity, options);
        const balanceTx = await mermaidsSeaDrop.balanceOf(owner.address);
        console.log(`Genesis Mint@tx: ${tx.hash}, balance now: ${balanceTx}`);

        totalSupply = await mermaidsSeaDrop.totalSupply();
        const balance = await getBalance(owner.address);
        console.log(`Balance ${balance}, total supply: ${totalSupply}`)
        counter++;
      }

      assert.equal(true, true);
    });

    describe(`sets up birth properly and begins birthing`, async () => {
      it(`sets birth role for owner address`, async () => {
        const options = await defaultGasOptions();
        const eggHatcherRole = await mermaidMechanics.EGG_HATCHER_ROLE(options);
        const tx = await mermaidMechanics.grantRole(eggHatcherRole, owner.address);
        console.log(`birth role set @tx: ${tx.hash}`)
        const hasRole = await mermaidMechanics.hasRole(eggHatcherRole, owner.address);
        assert.equal(hasRole, true);
      });

      it(`begins birthing`, async () => {
        const to = '0x796c2a9AF4AED2bcb8A304B567f248c3f351c497';
        const parentMermaidTokenId = 333;
        const eggTokenId = 15;

        const loop = 1;

        let counter = 0;
        while(counter < loop) {
          const options = await defaultGasOptions();
          const tx = await mermaidsSeaDrop.birth(to, parentMermaidTokenId, eggTokenId, options);
          const balanceTx = await mermaidsSeaDrop.balanceOf(to);
          console.log(`ChildMint@tx: ${tx.hash}, balance now: ${balanceTx}`);
          counter++;
        }
      })
    })
  });
});

async function getBalance(address: string) {
  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balance);
  return balanceInEth;
}

async function estimateGas() {
  let gasPrice: BigNumber = await ethers.provider.getGasPrice();
  const multiplier = 1.5; // avoids 'replacement fee too low' error.
  gasPrice = multiply(gasPrice, multiplier);

  return gasPrice;
}

async function defaultGasOptions() {
  let gasPrice: BigNumber = await estimateGas();
  return {
    gasPrice,
    gasLimit: 302133,
  };
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