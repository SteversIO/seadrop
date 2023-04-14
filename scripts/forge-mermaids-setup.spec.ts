import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { token } from "../typechain-types/lib/openzeppelin-contracts/contracts";
import { MintParamsStruct } from "../typechain-types/src/SeaDrop";
const { expect } = require("chai");
const hre = require("hardhat");
const assert = require("assert");

import { keccak256 } from "ethers/lib/utils";
import { MerkleTree } from "merkletreejs";
import { randomInt } from "crypto";

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
  
const mintParams = {
  mintPrice: "10000000000000",
  maxTotalMintableByWallet: 10,
  startTime: Math.round(Date.now() / 1000) - 100,
  endTime: Math.round(Date.now() / 1000) + 100,
  dropStageIndex: 1,
  maxTokenSupplyForStage: 11,
  feeBps: randomInt(1, 10000),
  restrictFeeRecipients: true,
};

// hardhat's localhost, spun up by hh-node
// or Goerli
const mechanicsAddress = '0xE9810785822662712BC8d60860A9c197843c5237';
let mermaidsSeaDropAddress = '0xA86Df0B2b6aD8DFFD5017f6191C2389189a7f925';

const seaDropOriginalAddress = '0x1682fF61BBB58F6339B684ab5d05CDfB23Cb0920';
mermaidsSeaDropAddress = seaDropOriginalAddress;

const goerliParentSeaDropAddress = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5';

xdescribe("Mermaids", function() {
  const DEFAULT_TIMEOUT = 15_000;
  this.timeout(DEFAULT_TIMEOUT);
  let mermaidMechanics: Contract;
  let mermaidsSeaDrop: Contract;
  let owner: any;

  const expectedMaxSupply = 110;
  const expectedBaseUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/'; // omit {id} from URL for baseUri
  const contractUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids';
  const etherMintCostPerNft = 0.0001; // 100000000000000 wei

  let options: any;
  
  before(async () => {
    options = await defaultGasOptions();
    const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");
    const MermaidsSeaDrop = await ethers.getContractFactory("MermaidsSeaDrop");
    const [owner1] = await ethers.getSigners();
    owner = owner1;

    mermaidMechanics = await MermaidMechanics.attach(mechanicsAddress);
    mermaidsSeaDrop = await MermaidsSeaDrop.attach(mermaidsSeaDropAddress);
  });

  describe("checks plumbing", () => {
    it("autowires Hardhat Runtime Environment", () => {
      assert.notEqual(hre, undefined);
    });
  
    it("checks that contract addresses match", () => {
      expect(mermaidMechanics.address).to.equal(mechanicsAddress);
      expect(mermaidsSeaDrop.address).to.equal(mermaidsSeaDropAddress);
    });

    it("checks eth balance of automation owner's address", async () => {
      const balanceInEth = await getBalance(owner.address);
      assert(Number.parseFloat(balanceInEth) > 0.0);
      console.log(`Balance is ${balanceInEth} eth for ${owner.address}`);
    });

    it("fetches block number", async () => {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Block # is ${blockNumber}`);
      assert(blockNumber > 0);
    });

    it("checks max supply", async () => {
      const maxSupply = await mermaidsSeaDrop.maxSupply();
      console.log(`maxSupply: ${maxSupply}`);
      assert.equal(maxSupply.toString(), expectedMaxSupply);
    });

    it("checks genesis supply", async () => {
      const supply = await mermaidsSeaDrop.getCurrentGenesisSupply();
      console.log(`genesis supply: ${supply}`);
      assert.notEqual(supply, -1);
    });

    it("checks child supply", async () => {
      const supply = await mermaidsSeaDrop.getCurrentChildSupply();
      console.log(`child supply: ${supply}`);
      assert.notEqual(supply, -1);
    });

    it("checks baseUri", async () => {
      const baseUri = await mermaidsSeaDrop.baseURI();
      console.log(`base uri: ${baseUri}`);
      assert.equal(baseUri, `${expectedBaseUri}`);
    });
  });

  describe("Mermaid Mechanics initialization", function() {
    const DEFAULT_TIMEOUT = 15_000;
    this.timeout(DEFAULT_TIMEOUT);
    let mermaidMechanics: Contract;
    let owner: any;
    let options: any;
  
    before(async () => {
      options = await defaultGasOptions();
      const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");
      const [owner1] = await ethers.getSigners();
      owner = owner1;
  
      mermaidMechanics = await MermaidMechanics.attach(mechanicsAddress);
    });
  
    it("checks that we're connected to the Goerli network", async () => {
      const networkName = hre.network.name;
      assert.equal('goerli', networkName, "Network is NOT goerli!");
    });
  
    it("sets up operator", async () => {
      const operator = await mermaidMechanics.operator;
      let tx = await mermaidMechanics.setOperator(mermaidsSeaDropAddress);
      console.log(`Tx for setting operator@ ${tx.hash}`)
    });

    it(`grants EGG_HATCHER_ROLE for owner address`, async () => {
      const options = await defaultGasOptions();
      const eggHatcherRole = await mermaidMechanics.EGG_HATCHER_ROLE();
      const tx = await mermaidMechanics.grantRole(eggHatcherRole, owner.address, options);
      console.log(`birth role set @tx: ${tx.hash}`);
      const hasRole = await mermaidMechanics.hasRole(eggHatcherRole, owner.address, options);
      assert.equal(hasRole, true);
    });
  });

  xdescribe("Mermaids Sea Drop initialization", () => {
    it("sets max supply", async () => {
      const tx = await mermaidsSeaDrop.setMaxSupply(expectedMaxSupply, options);
      console.log(`maxSupply set to: ${expectedMaxSupply}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets baseUri", async () => {
      const tx = await mermaidsSeaDrop.setBaseURI(expectedBaseUri, options);
      console.log(`baseUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets contractUri", async () => {
      const tx = await mermaidsSeaDrop.setContractURI(contractUri, options);
      console.log(`contractUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });

    it(`sets mint cost to ${etherMintCostPerNft} ether`, async () => {
      const options = await defaultGasOptions();
      const mintCost = ethers.utils.parseUnits(`${etherMintCostPerNft}`, "ether");
      const tx = await mermaidsSeaDrop.setMintCost(mintCost, options);  // contract owner required for this call.
      console.log(`Mint cost updated to ${etherMintCostPerNft} @tx: ${tx.hash}`)
      assert.notEqual(tx.hash, undefined);
    });
  });

  xdescribe("sets up SeaDrop specific initialization", async () => {
    let seadrop: any;
    let feeRecipient: any;
    let creator: any;

    before(() => {
      seadrop = goerliParentSeaDropAddress;
      feeRecipient = owner.address;
      creator = feeRecipient;
    })

    xit("tries to set allow list explicit code", async () => {
      // Encode the minter address and mintParams.
      const elementsBuffer = await allowListElementsBuffer([
        [owner.address, mintParams],
      ]);

      // Construct a merkle tree from the allow list elements.
      const merkleTree = createMerkleTree(elementsBuffer);

      // Store the merkle root.
      const root = merkleTree.getHexRoot();

      // Get the leaf at index 0.
      const leaf = merkleTree.getLeaf(0);

      // Get the proof of the leaf to pass into the transaction.
      const proof = merkleTree.getHexProof(leaf);

      // Declare the allow list data.
      const allowListData = {
        merkleRoot: root,
        publicKeyURIs: [],
        allowListURI: "",
      };

      // Update the allow list of the token.
      const tx = await mermaidsSeaDrop.updateAllowList(goerliParentSeaDropAddress, allowListData);
      console.log(`manual explicit test update allow list @ ${tx.hash}`);
    });

    it("sets creator payout", async() => {
      const cpTx = await mermaidsSeaDrop.updateCreatorPayoutAddress(seadrop, creator);
      console.log(`creator payout update @tx: ${cpTx.hash}`);
    })

    xit("sets fee recipient and updates public drop", async() => {
      const recipientTx = await mermaidsSeaDrop.updateAllowedFeeRecipient(seadrop, feeRecipient, true);
      console.log(`recipient @tx: ${recipientTx.hash}`);
    })

    xit("sets fee recipient and updates public drop", async() => {
      const publicDrop = {
        mintPrice: "100000000000000000", // 0.1 ether
        maxTotalMintableByWallet: 10,
        startTime: Math.round(Date.now() / 1000) - 100,
        endTime: Math.round(Date.now() / 1000) + 100,
        feeBps: 1000,
        restrictFeeRecipients: true,
      };

      const pdTx = await mermaidsSeaDrop.updatePublicDrop(seadrop, publicDrop);
      console.log(`public drop @tx: ${pdTx.hash}`);
    });

    xit("sets allowed list", async () => {
      const allowedListData = await createAllowListDataFromAddresses([owner.address]);
      const tx = await mermaidsSeaDrop.updateAllowList(goerliParentSeaDropAddress, allowedListData, options);
      console.log(`allowed list @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });
  })

  xdescribe("test minting", () => {
    const mintQuantity = 10;

    const loopCount = 1;
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

    describe(`birthing features`, async () => {
      it(`begins birthing`, async () => {
        const to = owner.address;
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

describe("Standard ERC721SeaDrop", function () {
  const DEFAULT_TIMEOUT = 15_000;
  this.timeout(DEFAULT_TIMEOUT);
  let originalERC721SeaDropToken: Contract;
  let owner: any;

  const expectedMaxSupply = 250;
  const expectedBaseUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids/'; // omit {id} from URL for baseUri
  const contractUri = 'https://metapi-mermaids.herokuapp.com/metadata/mermaids';
  const etherMintCostPerNft = 0.0001; // 100000000000000 wei

  let options: any;
  
  before(async () => {
    options = await defaultGasOptions();
    const ERC721SeaDropToken = await ethers.getContractFactory("ERC721SeaDrop");
    const [owner1] = await ethers.getSigners();
    owner = owner1;

    originalERC721SeaDropToken = await ERC721SeaDropToken.attach(seaDropOriginalAddress);
  });

  xdescribe("ERC721SeaDrop initialization", () => {
    it("sets max supply", async () => {
      const tx = await originalERC721SeaDropToken.setMaxSupply(expectedMaxSupply, options);
      console.log(`maxSupply set to: ${expectedMaxSupply}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets baseUri", async () => {
      const tx = await originalERC721SeaDropToken.setBaseURI(expectedBaseUri, options);
      console.log(`baseUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets contractUri", async () => {
      const tx = await originalERC721SeaDropToken.setContractURI(contractUri, options);
      console.log(`contractUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });
  });

  xdescribe("Genesis vs ERC721SeaDrop initialization", () => {
    it(`sets mint cost to ${etherMintCostPerNft} ether`, async () => {
      const options = await defaultGasOptions();
      const mintCost = ethers.utils.parseUnits(`${etherMintCostPerNft}`, "ether");
      
      const tx = await originalERC721SeaDropToken.setMintCost(mintCost, options);  // contract owner required for this call.
      console.log(`Mint cost updated to ${etherMintCostPerNft} @tx: ${tx.hash}`)
      assert.notEqual(tx.hash, undefined);
    });

    // deprecated; no longer exists in MermaidsSeaDrop
    // it(`sets mechanics address to ${mechanicsAddress}`, async () => {
    //   const tx = await originalERC721SeaDropToken.setMechanics(mechanicsAddress);  // contract owner required for this call.
    //   console.log(`Mechanics address updated @tx: ${tx.hash}`)
    //   assert.notEqual(tx.hash, undefined);
    // });

    it("sets max supply", async () => {
      const tx = await originalERC721SeaDropToken.setMaxSupply(expectedMaxSupply, options);
      console.log(`maxSupply set to: ${expectedMaxSupply}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets baseUri", async () => {
      const tx = await originalERC721SeaDropToken.setBaseURI(expectedBaseUri, options);
      console.log(`baseUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });

    it("sets contractUri", async () => {
      const tx = await originalERC721SeaDropToken.setContractURI(contractUri, options);
      console.log(`contractUri @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });
  });

  xdescribe("sets up SeaDrop specific initialization", async () => {
    let seadrop: any;
    let feeRecipient: any;
    let creator: any;

    before(() => {
      seadrop = goerliParentSeaDropAddress;
      feeRecipient = owner.address;
      creator = feeRecipient;
    })

    it("sets creator payout", async() => {
      const cpTx = await originalERC721SeaDropToken.updateCreatorPayoutAddress(seadrop, creator);
      console.log(`creator payout update @tx: ${cpTx.hash}`);
    })

    it("sets fee recipient and updates public drop", async() => {
      const recipientTx = await originalERC721SeaDropToken.updateAllowedFeeRecipient(seadrop, feeRecipient, true);
      console.log(`recipient @tx: ${recipientTx.hash}`);
    })

    it("sets fee recipient and updates public drop", async() => {
      const publicDrop = {
        mintPrice: "1000000000000000", // 0.001 ether
        maxTotalMintableByWallet: 10,
        startTime: Math.round(Date.now() / 1000) - 100,
        endTime: Math.round(Date.now() / 1000) + 100,
        feeBps: 1000,
        restrictFeeRecipients: true,
      };

      const pdTx = await originalERC721SeaDropToken.updatePublicDrop(seadrop, publicDrop);
      console.log(`public drop @tx: ${pdTx.hash}`);
    });

    it("sets allowed list", async () => {
      const allowedListData = await createAllowListDataFromAddresses([owner.address]);
      const tx = await originalERC721SeaDropToken.updateAllowList(goerliParentSeaDropAddress, allowedListData, options);
      console.log(`allowed list @tx: ${tx.hash}`);
      assert.notEqual(tx.hash, undefined);
    });
  })

  describe("updated Mechanics setup", () => {
    let mermaidMechanics: any;

    before(async ()=>{
      const MermaidMechanics = await ethers.getContractFactory("MermaidMechanics");

      mermaidMechanics = await MermaidMechanics.attach(mechanicsAddress);
    })
    it("sets mermaid contract", async () => {
      const tx = await mermaidMechanics.setMermaids(seaDropOriginalAddress);
      console.log(`mermaids contract updated in Mechanics @ tx: ${tx.hash}`)
    })
  })
})

async function getBalance(address: string) {
  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.utils.formatEther(balance);
  return balanceInEth;
}

async function defaultGasOptions() {
  let gasPrice: BigNumber = await estimateGas();
  return {
    gasPrice,
    gasLimit: 302133,
  };
}

async function estimateGas() {
  let gasPrice: BigNumber = await ethers.provider.getGasPrice();
  const multiplier = 1.5; // avoids 'replacement fee too low' error.
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

/* Helper functions for OpenSea pieces; borrowed from SeaDrop specs */
async function createAllowListDataFromAddresses(addresses: string[]) {
  // Encode the minter address and mintParams as a "leaf" for Merkle tree
  const elements: Array<[minter: string, mintParams: MintParamsStruct]> = [];

  for(let i=0; i< addresses.length; i++) {
    elements.push([addresses[i], mintParams]);
  }

  const elementsBuffer = await allowListElementsBuffer(elements);

  // Construct a merkle tree from the allow list elements.
  const merkleTree = createMerkleTree(elementsBuffer);

  // Store the merkle root.
  const root = merkleTree.getHexRoot();

  // Get the leaf at index 0.
  const leaf = merkleTree.getLeaf(0);

  // Get the proof of the leaf to pass into the transaction.
  const proof = merkleTree.getHexProof(leaf);

  // Declare the allow list data.
  const allowListData = {
    merkleRoot: root,
    publicKeyURIs: [],
    allowListURI: "",
  };

  return allowListData;
}

const createMerkleTree = (leaves: Buffer[]) =>
  new MerkleTree(leaves, keccak256, {
    hashLeaves: true,
    sortLeaves: true,
    sortPairs: true,
  });

const toPaddedBuffer = (data: any) =>
Buffer.from(
  ethers.BigNumber.from(data).toHexString().slice(2).padStart(64, "0"),
  "hex"
);

const allowListElementsBuffer = (
  leaves: Array<[minter: string, mintParams: MintParamsStruct]>
) =>
  leaves.map(([minter, mintParams]) =>
    Buffer.concat(
      [
        minter,
        mintParams.mintPrice,
        mintParams.maxTotalMintableByWallet,
        mintParams.startTime,
        mintParams.endTime,
        mintParams.dropStageIndex,
        mintParams.maxTokenSupplyForStage,
        mintParams.feeBps,
        mintParams.restrictFeeRecipients ? 1 : 0,
      ].map(toPaddedBuffer)
    )
  );