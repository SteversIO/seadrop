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

  event GenesisMermaid(address indexed to, uint256 indexed quantity, uint256 indexed startTokenId);
  event ChildMermaid(address indexed to, uint256 indexed quantity, uint256 indexed startTokenId);

  event TokenLocked(uint256 tokenId, address approvedContract);
  event TokenUnlocked(uint256 tokenId, address approvedContract);

  bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

  address payable public recipient;
  uint internal balance = 0;
  uint256 mintRate = 0.01 ether;
  string internal _contractUri;
  string internal _tokenUri;

  uint256 _currentGenesisSupply = 0;
  uint256 internal _maxGenesisSupply = 100; // 3333

  uint256 _currentChildSupply = 0;
  uint256 internal _maxChildSupply = 10; // 6667

  IMermaidMechanics mermaidMechanics;

  constructor(string memory name,
      string memory symbol,
      address[] memory allowedSeaDrop,
      address mermaidMechanicsAddress) ERC721SeaDrop(name, symbol, allowedSeaDrop) {
      _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _grantRole(URI_SETTER_ROLE, msg.sender);

      recipient = payable(msg.sender);
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

  function mintSeaDrop(address minter, uint256 quantity)
        public
        virtual
        override {
    checkGenesisMaxSupply(quantity);
    super.mintSeaDrop(minter, quantity);
    postGenesis(minter, quantity);
  }

  function mint(uint256 quantity) payable public {
    checkGenesisMaxSupply(quantity);
    checkMaxSupply(quantity);

    require(msg.value >= (quantity * mintRate), "Not enough ether sent."); // string.concat("Not enough ether sent. You need", Strings.toString(amount * mintRate)));
    balance += msg.value;
    
    _safeMint(_msgSender(), quantity);
    postGenesis(_msgSender(), quantity);
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

  /** Overrides */
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

  /** Helpers */
  function postGenesis(address minter, uint256 quantity) internal {
    _currentGenesisSupply = _currentGenesisSupply + quantity;
    emit GenesisMermaid(minter, quantity, _nextTokenId() - quantity);
  }

  function checkMaxSupply(uint256 quantity) internal {
    if ((_totalMinted() + quantity) > maxSupply()) {
        revert MintQuantityExceedsMaxSupply(
            _totalMinted() + quantity,
            maxSupply()
        );
    }
  }

  function checkGenesisMaxSupply(uint256 quantity) internal {
    if(_currentGenesisSupply + quantity > _maxGenesisSupply) {
      revert MintQuantityExceedsMaxSupply(
        _currentGenesisSupply + quantity,
        _maxGenesisSupply);
    }
  }

  /** Mechanics */
  function getCurrentGenesisSupply() public view returns (uint256) {
    return _currentGenesisSupply;
  }

  function getCurrentChildSupply() public view returns (uint256) {
    return _currentChildSupply;
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
  
  function layEgg(uint256 mermaidTokenId, address to) public {
    mermaidMechanics.layEgg(_msgSender(), mermaidTokenId, to);
  }

  function birth(address to,
      uint256 parentMermaidTokenId, 
      uint256 eggTokenId) public {
    require(_currentChildSupply + 1 <= _maxChildSupply, "No more eggs can hatch.");
    mermaidMechanics.birth(_msgSender(), to, parentMermaidTokenId, eggTokenId);
    _safeMint(to, 1);
    _currentChildSupply = _currentChildSupply + 1;
    emit ChildMermaid(to, 1, _nextTokenId() -1);
  }
}