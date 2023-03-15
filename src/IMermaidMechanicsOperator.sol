// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @custom:security-contact steve@megacatstudios.com
interface IMermaidMechanicsOperator {
  // Owner mechanics
  function roost(uint256 tokenId) external;
  function unroost(uint256 tokenId) external;
  function embark(uint256 tokenId) external;
  function conclude(uint256 tokenId) external;

  // Smart Contract mechanics
  function layEgg(uint256 mermaidTokenId, address to) external;
  function birth(address to, uint256 parentMermaidTokenId, uint256 eggTokenId) external;
}