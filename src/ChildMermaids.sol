// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {
    ERC721ContractMetadata,
    ISeaDropTokenContractMetadata
} from "./ERC721ContractMetadata.sol";

import { AccessControl } from "openzeppelin-contracts/access/AccessControl.sol";

import { ERC721A } from "ERC721A/ERC721A.sol";

import {
    IERC165
} from "openzeppelin-contracts/utils/introspection/IERC165.sol";

/**
 * @title  Child Mermaids 
 * @author Steve Livingston (stevers.eth)
 * @author OpenSea developers
 * @notice GenesisMermaidSeaDrop is a token contract
 */
contract ChildMermaids is
    ERC721ContractMetadata, AccessControl
{
  bytes32 public constant GAIA_ROLE = keccak256("GAIA_ROLE");
  mapping (uint256 => bool) private eggs;
  mapping (uint256 => uint256) private childTokenToMetadataIndex;
  mapping (uint256 => uint256) private eggToMermaid;

  string public _baseEggUri;
  uint256 public maxMermaids = 6667;
  uint256 private _currentCount = 0;
  uint256 private _currentChildMetadataIndex = 1;

  /**
   * @notice Deploy the token contract with its name, symbol, and uris
   */
  constructor(
      string memory name,
      string memory symbol,
      string memory tokenUri,
      string memory baseEggUri,
      string memory contractUri
  ) ERC721ContractMetadata(name, symbol) { 
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(GAIA_ROLE, msg.sender);
    _baseEggUri = baseEggUri;
    ERC721ContractMetadata._tokenBaseURI = tokenUri;
    ERC721ContractMetadata._contractURI = contractUri;
  }

  event LayEgg(
    address indexed _invoker,
    address indexed _to,
    uint256 indexed _tokenId
);

  event EggHatched(
    address indexed _to,
    uint256 indexed _hatchedEggTokenId,
    uint256 indexed _babyTokenId
  );


  function setEggUri(string calldata newEggUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _baseEggUri = newEggUri;
  }

  function layEgg(address recipient) public onlyRole(GAIA_ROLE) {
    require(_currentCount + 1 <= maxMermaids, "No more mermaids are allowed.");
    uint256 eggTokenId = _nextTokenId();
    _safeMint(recipient, 1);
    eggs[eggTokenId] = true;
    _currentCount = _currentCount + 1;
    emit LayEgg(msg.sender, recipient, eggTokenId);
  }

  function hatch(uint256 eggTokenId) public {
    // burn the egg
    require(eggs[eggTokenId], "That is not an egg");
    require(ownerOf(eggTokenId) == msg.sender, "You are not the owner.");
    _burn(eggTokenId);

    // get internal tokenId for new child mermaid
    uint256 childTokenId = _nextTokenId();
    _safeMint(msg.sender, 1);

    // tracks the child mermaid's tokenId and its "metadata index" in our metadata system.
    // eggs won't have an index since they're intended to be transient
    eggToMermaid[eggTokenId] = childTokenId;
    childTokenToMetadataIndex[childTokenId] = _currentChildMetadataIndex;
    _currentChildMetadataIndex = _currentChildMetadataIndex + 1;
    emit EggHatched(msg.sender, eggTokenId, childTokenId);
  }

  function setMaxMermaids(uint256 _maxMermaids) external onlyRole(DEFAULT_ADMIN_ROLE) {
    maxMermaids = _maxMermaids;
  }

  function lookupTokenIdFromEgg(uint256 eggTokenId) public view virtual returns (uint256) {
    if(eggs[eggTokenId]) {
      return eggToMermaid[eggTokenId];
    }

    return 0;
  }

  function lookupMetadataIndex(uint256 tokenId) public view virtual returns (uint256) {
    if(eggs[tokenId]) {
      return 0;
    }

    return childTokenToMetadataIndex[tokenId];
  }

  /**
   * @dev Overrides the `_startTokenId` function from ERC721A
   *      to start at token id `1`.
   *
   *      This is to avoid future possible problems since `0` is usually
   *      used to signal values that have not been set or have been removed.
   */
  function _startTokenId() internal view virtual override returns (uint256) {
      return 1;
  }

  /**
   * @dev Overrides the `tokenURI()` function from ERC721A
   *      to return just the base URI if it is implied to not be a directory.
   *
   *      This is to help with ERC721 contracts in which the same token URI
   *      is desired for each token, such as when the tokenURI is 'unrevealed'.
   */
  function tokenURI(uint256 tokenId)
      public
      view
      virtual
      override
      returns (string memory)
  {
      if(eggs[tokenId]) {
        return string(abi.encodePacked(_baseEggUri, _toString(tokenId)));
      }

      if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

      string memory baseURI = _baseURI();

      // Exit early if the baseURI is empty.
      if (bytes(baseURI).length == 0) {
          return "";
      }

      // Check if the last character in baseURI is a slash.
      if (bytes(baseURI)[bytes(baseURI).length - 1] != bytes("/")[0]) {
          return baseURI;
      }

      uint256 metadataIndex = childTokenToMetadataIndex[tokenId];

      return string(abi.encodePacked(baseURI, _toString(metadataIndex)));
  }

  /**
   * @notice Returns whether the interface is supported.
   *
   * @param interfaceId The interface id to check against.
   */
  function supportsInterface(bytes4 interfaceId)
      public
      view
      virtual
      override(ERC721ContractMetadata, AccessControl)
      returns (bool)
  {
      return
          super.supportsInterface(interfaceId);
  }
}