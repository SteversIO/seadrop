// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @custom:security-contact steve@megacatstudios.com
interface IMermaidMechanics {
  // Owner mechanics
  function roost(address owner, uint256 tokenId) external;
  function unroost(address owner, uint256 tokenId) external;
  function embark(address owner, uint256 tokenId) external;
  function conclude(address owner, uint256 tokenId) external;

  // Smart Contract mechanics
  /**
   * Gaia smart contract handles egg laying mechanics. Uses this method to "lay an egg", tying a MermaidEgg (external) to a Mermaid. 
   * Emits an event that off-chain mechanics will monitor to aidrop a MermaidEgg.
   * @param operator Owner of Mermaid that lays the egg. Also receives the MermaidEgg
   * @param mermaidTokenId tokenId of Mermaid
   * @param to Recipient of MermaidEgg
   */
  function layEgg(address operator, uint256 mermaidTokenId, address to) external;
  
  /**
   * MermaidEgg NFT smart contract calls this to turn a MermaidEgg (external NFT smart contract) into a Mermaid (this NFT smart contract)
   * @param operator operator contract invoking this call
   * @param to recipient of Mermaid that hatches
   * @param parentMermaidTokenId tokenId of parent Mermaid NFT
   * @param eggTokenId tokenId of MermaidEgg NFT
   */
  function birth (address operator, address to, uint256 parentMermaidTokenId, uint256 eggTokenId) external;

  function safeTransferFromCheck(address from, address to, uint256 tokenId) external;
}