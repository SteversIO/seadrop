// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import { ERC1155 } from "openzeppelin-contracts/contracts/token/ERC1155/ERC1155.sol";
import { AccessControl } from "openzeppelin-contracts/contracts/access/AccessControl.sol";
import { ERC1155Burnable } from "openzeppelin-contracts/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import { Strings } from "openzeppelin-contracts/contracts/utils/Strings.sol";

/// @custom:security-contact steve@megacatstudios.com
contract Mermaids is ERC1155, AccessControl, ERC1155Burnable {
    bytes32 public constant GAIA_ROLE = keccak256("GAIA_ROLE");
    bytes32 public constant EGG_HATCHER_ROLE = keccak256("EGG_HATCHER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");

    mapping (uint256 => uint256) private eggsLaid;
    mapping (uint256 => uint256) private parents;
    mapping (uint256 => uint256) private eggs;

    uint256 public mintRate = 0.001 ether;
    uint256 limit = 1;

    // string default_uri = "https://meta.worldofmermaids.xyz";
    // string token_uri = "https://gateway.pinata.cloud/ipfs/QmVgmX6V6JB2mZvBP1VqFJkWLTuZ7QJmvyVw7pa7ks6WqA/{id}.json";

    string internal _contractUri;
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

    constructor(string memory newuri) ERC1155(newuri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GAIA_ROLE, msg.sender);
        _grantRole(URI_SETTER_ROLE, msg.sender);
        recipient = payable(msg.sender);
    }

    function setURI(string memory newuri) public onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function contractURI() public view returns (string memory) {
      return _contractUri;
    }

    function setContractURI(string memory newContractUri) public onlyRole(URI_SETTER_ROLE) {
        _contractUri = newContractUri;
    }

    function withdraw() public {
      require(_msgSender() == recipient, "YOu must be recipient to withdraw");
      recipient.transfer(balance);
    }

    function layEgg(uint256 mermaidTokenId, address to) public onlyRole(GAIA_ROLE) {
        eggsLaid[mermaidTokenId] = eggsLaid[mermaidTokenId] + 1;
        emit LayEgg(_msgSender(), to, mermaidTokenId);
    }

    function birth (
        address to,
        uint256 mermaidTokenId, 
        uint256 eggTokenId) public onlyRole(EGG_HATCHER_ROLE) {
        _mint(to, currentAvailableEggMintId, 1, "");
        parents[currentAvailableEggMintId] = mermaidTokenId;
        eggs[currentAvailableEggMintId] = eggTokenId;

        currentAvailableEggMintId = currentAvailableEggMintId + 1;
        emit EggHatched(to, currentAvailableEggMintId, eggTokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}