import { Contract } from "ethers";
import { ethers } from "hardhat";
const { expect } = require("chai");

/**
 * Run this single test file, through Mocha & Hardhat's testing framework, by running:
 * hardhat test --network localhost --config ./hardhat.config.ts scripts/test-mermaids.ts
 * 
 * yarn run hh-test
 */
describe("canary", () => {
  const mechanicsAddress = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
  const mermaidsAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
  let mermaidMechanics: Contract;
  let mermaidsSeaDrop: Contract;

  before(async () => {
    const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");
    const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");

    mermaidMechanics = await MermaidMechanics.attach(mechanicsAddress);
    mermaidsSeaDrop = await MermaidsSeaDrop.attach(mermaidsAddress);
  })
  
  it("passes", () => {
    expect(true).to.equal(true);
  });

  it("contract addresses match", () => {
    expect(mermaidMechanics.address).to.equal(mechanicsAddress);
    expect(mermaidsSeaDrop.address).to.equal(mermaidsAddress);
  })
});