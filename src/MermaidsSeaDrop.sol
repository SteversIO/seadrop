// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {
    ERC721SeaDrop
} from "./ERC721SeaDrop.sol";

import { 
  IMermaidMechanics
} from "./IMermaidMechanics.sol";

import { 
  IMermaidMechanicsOperator
} from "./IMermaidMechanicsOperator.sol";


import {
    AccessControl
} from "openzeppelin-contracts/access/AccessControl.sol";

import {
    Strings
} from "openzeppelin-contracts/utils/Strings.sol";

/// @custom:security-contact steve@megacatstudios.com
contract MermaidsSeaDrop is ERC721SeaDrop, AccessControl, IMermaidMechanicsOperator {
  bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

  address payable public recipient;
  uint internal balance = 0;
  uint256 mintRate = 0.01 ether;
  string internal _contractUri;
  string internal _tokenUri;

  IMermaidMechanics mermaidMechanics;

  constructor(string memory name,
      string memory symbol,
      string memory tokenUri,
      address[] memory allowedSeaDrop,
      address mermaidMechanicsAddress) ERC721SeaDrop(name, symbol, allowedSeaDrop) {
      _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _grantRole(URI_SETTER_ROLE, msg.sender);
      recipient = payable(msg.sender);
      mermaidMechanics = IMermaidMechanics(mermaidMechanicsAddress);
      _tokenUri = tokenUri;
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
          "Not owner nor approved"
      );

      mermaidMechanics.safeTransferFromCheck(from, to, tokenId);

      ERC721SeaDrop.safeTransferFrom(from, to, tokenId);
  }

  function mint(uint256 quantity) payable public {
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
    require(_msgSender() == recipient, "Not recipient");
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

  /** Mechanics */
  function roost(uint256 tokenId) public {

  }
  function unroost(uint256 tokenId) public {
    
  }
  function embark(uint256 tokenId) public {
    
  }

  function conclude(uint256 tokenId) public {
    
  }
  
  function layEgg(uint256 mermaidTokenId, address to) public {

  }

  function birth(address to,
      uint256 parentMermaidTokenId, 
      uint256 eggTokenId) public {
    mermaidMechanics.birth(to, parentMermaidTokenId, eggTokenId);
    _mint(to, 1);
  }
}