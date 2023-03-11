// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {
    ERC721SeaDrop
} from "./ERC721SeaDrop.sol";

import { 
  IMermaidMechanics
} from "./IMermaidMechanics.sol";

import {
    AccessControl
} from "openzeppelin-contracts/access/AccessControl.sol";

import {
    Strings
} from "openzeppelin-contracts/utils/Strings.sol";

/// @custom:security-contact steve@megacatstudios.com
contract MermaidsSeaDrop is ERC721SeaDrop, AccessControl {
  IMermaidMechanics mermaidMechanics;

  constructor(string memory name,
      string memory symbol,
      address[] memory allowedSeaDrop,
      address mermaidMechanicsAddress) ERC721SeaDrop(name, symbol, allowedSeaDrop) {
      _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _grantRole(GAIA_ROLE, msg.sender);
      _grantRole(URI_SETTER_ROLE, msg.sender);
      recipient = payable(msg.sender);
      mermaidMechanics = IMermaidMechanics(mermaidMechanicsAddress);
  }

  function setMintCost(uint256 updatedMintRate) public onlyRole(URI_SETTER_ROLE) {
    mintRate = updatedMintRate;
  }

  function _baseURI() internal view virtual override returns (string memory) {
      return _tokenUri;
  }

  function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
    _tokenUri = newuri;
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

      mermaidMechanics.
      require(
          roostedTokens[tokenId] == uint256(0) && embarkedTokens[tokenId] == uint256(0),
          "That Mermaid must be out of the cove."
      );

      ERC721SeaDrop.safeTransferFrom(from, to, tokenId);
  }

  function mint(uint256 quantity)
      payable public
  {
    if (_totalMinted() + quantity > maxSupply()) {
        revert MintQuantityExceedsMaxSupply(
            _totalMinted() + quantity,
            maxSupply()
        );
    }
      require(msg.value >= (quantity * mintRate), "Not enough ether sent."); // string.concat("Not enough ether sent. You need", Strings.toString(amount * mintRate)));
      balance += msg.value;

      _safeMint(_msgSender(), quantity);
  }

  function withdraw() public {
    require(_msgSender() == recipient, "YOu must be recipient to withdraw");
    recipient.transfer(balance);
  }

  function supportsInterface(bytes4 interfaceId)
      public
      view
      override(ERC721SeaDrop, AccessControl)
      returns (bool)
  {
      return super.supportsInterface(interfaceId);
  }
}