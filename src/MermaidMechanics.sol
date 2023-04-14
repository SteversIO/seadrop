// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {
    AccessControl
} from "openzeppelin-contracts/access/AccessControl.sol";

import {
    Strings
} from "openzeppelin-contracts/utils/Strings.sol";

import { 
  IMermaidMechanics
} from "./IMermaidMechanics.sol";

import {
  ERC721SeaDrop
} from "./ERC721SeaDrop.sol";

/// @custom:security-contact steve@megacatstudios.com
contract MermaidMechanics is AccessControl, IMermaidMechanics {
  bytes32 public constant GAIA_ROLE = keccak256("GAIA_ROLE");
  bytes32 public constant EGG_HATCHER_ROLE = keccak256("EGG_HATCHER_ROLE");

  mapping (uint256 => uint256) private roostedTokens;
  mapping (uint256 => uint256) private embarkedTokens;

  // Egg mechanics
  mapping (uint256 => uint256) private eggsLaid;
  mapping (uint256 => uint256) private parents; // tracks the parents of a mermaid
  mapping (uint256 => uint256) private eggs; // tracks the egg that a mermaid hatched from (refers to tokenId in MermaidEggs contract)

  event LayEgg(
      address indexed _invoker,
      address indexed _to,
      uint256 indexed _tokenId
  );

  event EggHatched(
      address indexed _to,
      uint256 indexed _babyTokenId,
      uint256 indexed _hatchedEggTokenId
  );

  event Roost(address indexed _caller, uint256 indexed _tokenId);
  event Unroost(address indexed _caller, uint256 indexed _tokenId, uint256 indexed _blockAge);

  event Embark(address indexed _caller, uint256 indexed _tokenId);
  event Conclude(address indexed _caller, uint256 indexed _tokenId, uint256 indexed _blockAge);

  ERC721SeaDrop mermaids;

  modifier onlyRoleFor(bytes32 role, address account) {
    _checkRole(role, account);
    _;
  }

  modifier onlyOperator(address operator, uint256 tokenId) {
    address owner = mermaids.ownerOf(tokenId);
    require(mermaids.isApprovedForAll(owner, operator), "Not an operator for owner.");
    _;
  }

  constructor(address mermaidsAddress) {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    setMermaids(mermaidsAddress);
  }

  function setMermaids(address mermaidsAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
    mermaids = ERC721SeaDrop(mermaidsAddress);
  }

  function roost(uint256 tokenId) public onlyOperator(msg.sender, tokenId) {
      require(
          roostedTokens[tokenId] == uint256(0), 
          "She is already roosting."
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is on a journey and cannot roost."
      );

      roostedTokens[tokenId] = block.number;
      emit Roost(msg.sender, tokenId);
  }

  function embark(uint256 tokenId) public onlyOperator(msg.sender, tokenId) {
      require(
          roostedTokens[tokenId] == uint256(0),
          "She is already on her journey"
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is roosting and cannot embark."
      );

      embarkedTokens[tokenId] = block.number;
      emit Embark(msg.sender, tokenId);
  }

  function unroost(uint256 tokenId) public onlyOperator(msg.sender, tokenId)  {
      require(
          roostedTokens[tokenId] != uint256(0), 
          "She is not roosting."
      );

      uint blockAge = block.number - roostedTokens[tokenId];
      roostedTokens[tokenId] = uint256(0);
      emit Unroost(msg.sender, tokenId, blockAge);
  }

  function conclude(uint256 tokenId) public onlyOperator(msg.sender, tokenId) {
      require(
          embarkedTokens[tokenId] != uint256(0),
          "She is not on a journey"
      );

      uint blockAge = block.number - embarkedTokens[tokenId];
      embarkedTokens[tokenId] = 0;
      emit Conclude(msg.sender, tokenId, blockAge);
  }

  /* They're roosting if theres a non-zero number in mapping (ie: its a block number) */
  function isRoosting(uint256 tokenId) public view returns(bool) {
    return roostedTokens[tokenId] != uint256(0);
  }

  /* They're embarking if theres a non-zero number in mapping (ie: its a block number) */
  function isEmbarking(uint256 tokenId) public view returns(bool) {
    return embarkedTokens[tokenId] != uint256(0);
  }
}

