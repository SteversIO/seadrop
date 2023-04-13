// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @custom:security-contact steve@megacatstudios.com
interface IMermaidMechanics {
  // Owner mechanics
  function roost(uint256 tokenId) external;
  function unroost(uint256 tokenId) external;
  function embark(uint256 tokenId) external;
  function conclude(uint256 tokenId) external;

  function isRoosting(uint256 tokenId) external view returns (bool);
  function isEmbarking(uint256 tokenId) external view returns (bool);
}