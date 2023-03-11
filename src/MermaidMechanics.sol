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
contract MermaidsSeaDrop is AccessControl, IMermaidMechanics {
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

  uint256 mintRate = 0.01 ether;
  uint256 limit = 1;

  string internal _contractUri;
  string internal _tokenUri;
  
  address payable public recipient;
  uint internal balance = 0;

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

  modifier allowableMechanic(address owner, address sender, uint256 tokenId) {

  }

  modifier onlyOwnerOrApprover(address from, uint256 id) {
      bool isApproved = from == _msgSender() || isApprovedForAll(from, _msgSender());
      if (!isApproved) {
          revert(
              string(
                  abi.encodePacked(
                      "AccessControl: account ",
                      Strings.toHexString(uint160(from), 20),
                      " is not approved "
                  )
              )
          );
      }
      _;
  }

  function roost(address owner, uint256 tokenId) public allowableMechanic(owner, _msgSender(), tokenId) {
      require(
          roostedTokens[tokenId] == uint256(0), 
          "She is already roosting."
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is on a journey and cannot roost."
      );

      roostedTokens[tokenId] = block.number;
      emit Roost(_msgSender(), tokenId);
  }

  function embark(address owner, uint256 tokenId) public allowableMechanic(owner, _msgSender(), tokenId) {
      require(
          roostedTokens[tokenId] == uint256(0),
          "She is already on her journey"
      );
      require(
          embarkedTokens[tokenId] == uint256(0),
          "She is roosting and cannot embark."
      );

      embarkedTokens[tokenId] = block.number;
      emit Embark(_msgSender(), tokenId);
  }

  function unroost(address owner, uint256 tokenId) public allowableMechanic(owner, _msgSender(), tokenId) {
      require(
          roostedTokens[tokenId] != uint256(0), 
          "She is not roosting."
      );

      uint blockAge = block.number - roostedTokens[tokenId];
      roostedTokens[tokenId] = uint256(0);
      emit Unroost(_msgSender(), tokenId, blockAge);
  }

  function conclude(address owner, uint256 tokenId) public allowableMechanic(owner, _msgSender(), tokenId) {
      require(
          embarkedTokens[tokenId] != uint256(0),
          "She is not on a journey"
      );

      uint blockAge = block.number - embarkedTokens[tokenId];
      embarkedTokens[tokenId] = 0;
      emit Conclude(_msgSender(), tokenId, blockAge);
  }
  
  function layEgg(uint256 mermaidTokenId, address to) public onlyRole(GAIA_ROLE) {
      eggsLaid[mermaidTokenId] = eggsLaid[mermaidTokenId] + 1;
      emit LayEgg(_msgSender(), to, mermaidTokenId);
  }

  function birth (
      address to,
      uint256 parentMermaidTokenId, 
      uint256 eggTokenId) public onlyRole(EGG_HATCHER_ROLE) {
      _mint(to, 1);
      parents[currentAvailableEggMintId] = parentMermaidTokenId;
      eggs[currentAvailableEggMintId] = eggTokenId;

      currentAvailableEggMintId = currentAvailableEggMintId + 1;
      emit EggHatched(to, currentAvailableEggMintId, eggTokenId);
  }

  /* TODO: Override burn mechanics as well to prevent when staking */
  function safeTransferFrom(
      address from,
      address to,
      uint256 tokenId
  ) public override 
  {
      require(
          from == _msgSender() || isApprovedForAll(from, _msgSender()),
          "MermaidsSeaDrop: caller is not owner nor approved"
      );

      require(
          roostedTokens[tokenId] == uint256(0) && embarkedTokens[tokenId] == uint256(0),
          "That Mermaid must be out of the cove."
      );

      ERC721SeaDrop.safeTransferFrom(from, to, tokenId);
  }
}

