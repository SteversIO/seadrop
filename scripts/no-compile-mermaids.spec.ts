import { Contract } from "ethers";
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

describe("Test Hardness Setup", function() {
  this.timeout(200000);
  const mechanicsAddress = '0xdB557e6c848Be27c202Fe16751110A7E3fb34dcB'; // goerli
  const mermaidsAddress = '0x0F83ef3DF096dDd9f408Ac2a72756ec46e1aAD2f'; // goerli
  let mermaidMechanics: Contract;
  let mermaidsSeaDrop: Contract;
  let owner;
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
    const expectedMaxSupply = 3333;
    it("checks max supply", async () => {
      const maxSupply = await mermaidsSeaDrop.maxSupply();
      console.log(`maxSupply: ${maxSupply}`);
      assert.equal(maxSupply, expectedMaxSupply);
    });

    it("mints a ton", async () => {
      let counter = 0;
      const limit = 3333;
      let totalSupply = await mermaidsSeaDrop.totalSupply();
      console.log(`totalSupply: ${totalSupply}`);

      while(counter < 10 && totalSupply < expectedMaxSupply) {
        // TODO: Mint!
        const gasPrice = await ethers.provider.getGasPrice();
        const options = {
          value: ethers.utils.parseUnits("0.01", "ether"),
          gasPrice,
          gasLimit: 302133,
        };

        const tx = await mermaidsSeaDrop.mint(1, options);
        totalSupply = await mermaidsSeaDrop.totalSupply();
        counter++;
      }
    });
  });
});