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
contract GenesisMermaidsSeaDrop is ERC721SeaDrop, AccessControl, IMermaidMechanicsOperator {
  event TokenLocked(uint256 tokenId, address approvedContract);
  event TokenUnlocked(uint256 tokenId, address approvedContract);

  bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

  address payable public recipient;
  uint internal balance = 0;
  uint256 mintRate = 0.01 ether;
  string internal _contractUri;
  string internal _tokenUri;

  IMermaidMechanics mermaidMechanics;

  constructor(string memory name,
      string memory symbol,
      address[] memory allowedSeaDrop) ERC721SeaDrop(name, symbol, allowedSeaDrop) {
      _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _grantRole(URI_SETTER_ROLE, msg.sender);

      recipient = payable(msg.sender);
  }

  function setMechanics(address mermaidMechanicsAddress) public onlyRole(URI_SETTER_ROLE) {
    mermaidMechanics = IMermaidMechanics(mermaidMechanicsAddress);
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

  function mint(uint256 quantity) payable public {
    require(msg.value >= (quantity * mintRate), "Not enough ether sent.");
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

  function roost(uint256 tokenId) public onlyOwnerOrApprover(_msgSender(), tokenId) {
    mermaidMechanics.roost(_msgSender(), tokenId);
    emit TokenLocked(tokenId, address(_msgSender()));
  }

  function unroost(uint256 tokenId) public onlyOwnerOrApprover(_msgSender(), tokenId) {
    mermaidMechanics.unroost(_msgSender(), tokenId);
    emit TokenUnlocked(tokenId, address(_msgSender()));
  }
  
  function embark(uint256 tokenId) public onlyOwnerOrApprover(_msgSender(), tokenId) {
    mermaidMechanics.embark(_msgSender(), tokenId);
    emit TokenLocked(tokenId, address(_msgSender()));
  }

  function conclude(uint256 tokenId) public onlyOwnerOrApprover(_msgSender(), tokenId) {
    mermaidMechanics.conclude(_msgSender(), tokenId);
    emit TokenUnlocked(tokenId, address(_msgSender()));
  }
}