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

/// @custom:security-contact steve@megacatstudios.com
contract MermaidMechanics is AccessControl, IMermaidMechanics {
  bytes32 public constant GAIA_ROLE = keccak256("GAIA_ROLE");
  bytes32 public constant EGG_HATCHER_ROLE = keccak256("EGG_HATCHER_ROLE");
  
  uint256 public currentAvailableTokenId = 1;
  uint256 mintLimit = 3333;

  uint256 public currentAvailableEggMintId = 3334;
  uint256 eggMintLimit = 10000;

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

  modifier onlyRoleFor(bytes32 role, address account) {
    _checkRole(role, account);
    _;
  }

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function roost(address owner, uint256 tokenId) public {
      require(
          roostedTokens[tokenId] == uint256(0), 
          "She is already roosting."
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is on a journey and cannot roost."
      );

      roostedTokens[tokenId] = block.number;
      emit Roost(owner, tokenId);
  }

  function embark(address owner, uint256 tokenId) public {
      require(
          roostedTokens[tokenId] == uint256(0),
          "She is already on her journey"
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is roosting and cannot embark."
      );

      embarkedTokens[tokenId] = block.number;
      emit Embark(owner, tokenId);
  }

  function unroost(address owner, uint256 tokenId) public {
      require(
          roostedTokens[tokenId] != uint256(0), 
          "She is not roosting."
      );

      uint blockAge = block.number - roostedTokens[tokenId];
      roostedTokens[tokenId] = uint256(0);
      emit Unroost(owner, tokenId, blockAge);
  }

  function conclude(address owner, uint256 tokenId) public {
      require(
          embarkedTokens[tokenId] != uint256(0),
          "She is not on a journey"
      );

      uint blockAge = block.number - embarkedTokens[tokenId];
      embarkedTokens[tokenId] = 0;
      emit Conclude(owner, tokenId, blockAge);
  }
  
  function layEgg(address operator, uint256 mermaidTokenId, address to) public onlyRoleFor(GAIA_ROLE, operator) {
    eggsLaid[mermaidTokenId] = eggsLaid[mermaidTokenId] + 1;
    emit LayEgg(operator, to, mermaidTokenId);
  }

  function birth(
    address operator, 
    address to,
    uint256 parentMermaidTokenId, 
    uint256 eggTokenId) public onlyRoleFor(EGG_HATCHER_ROLE, operator) {
    parents[currentAvailableEggMintId] = parentMermaidTokenId;
    eggs[currentAvailableEggMintId] = eggTokenId;

    currentAvailableEggMintId = currentAvailableEggMintId + 1;
    emit EggHatched(to, currentAvailableEggMintId, eggTokenId);
  }

  /* TODO: Override burn mechanics as well to prevent when staking */
  function safeTransferFromCheck(
      address from,
      address to,
      uint256 tokenId
  ) public override 
  {
      require(
          roostedTokens[tokenId] == uint256(0) && embarkedTokens[tokenId] == uint256(0),
          "That Mermaid must be out of the cove."
      );
  }
}

