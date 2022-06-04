// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GeoNFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // GeoNFT token properties
    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    mapping(uint256 => uint8) private indices; // mapping of tokenId to index
    mapping(uint256 => string) private indicesType; // mapping of tokenId to index type

    // A reference to the Spatial Data Registry contract for security checks
    address public sdRegistry;

    // solhint-disable-next-line no-empty-blocks, func-visibility
    constructor() ERC721("GEONFT Minter", "GEONFT") {}

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function safeMint(
        address to,
        string memory uri,
        string memory geoJson
    ) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        // set geoJson
        geoJsons[tokenId] = geoJson;

        // default index value to 0 type to area_m2
        indices[tokenId] = 0;
        indicesType[tokenId] = "area_m2";

        _setTokenURI(tokenId, uri);
    }

    // Returns an array of tokenIds
    function getAllTokens()
        public
        view
        returns (
            uint256[] memory,
            string[] memory,
            string[] memory
        )
    {
        uint256 totalTokens = totalSupply();
        uint256[] memory _tokenIds = new uint256[](totalTokens);
        string[] memory _uris = new string[](totalTokens);
        string[] memory _geoJsons = new string[](totalTokens);
        uint256 i;

        for (i = 0; i < totalTokens; i++) {
            // solhint-disable-next-line mark-callable-contracts
            _tokenIds[i] = ERC721Enumerable.tokenByIndex(i);
            _uris[i] = tokenURI(_tokenIds[i]);
            _geoJsons[i] = geoJsons[_tokenIds[i]];
        }
        return (_tokenIds, _uris, _geoJsons);
    }

    // Returns an array of tokenIds, URIs for an owner address
    function getTokensByOwner(address owner)
        public
        view
        returns (
            uint256[] memory,
            string[] memory,
            string[] memory
        )
    {
        // solhint-disable-next-line mark-callable-contracts
        uint256 totalTokensForOwner = ERC721.balanceOf(owner);
        uint256[] memory _tokenIds = new uint256[](totalTokensForOwner);
        string[] memory _uris = new string[](totalTokensForOwner);
        string[] memory _geoJsons = new string[](totalTokensForOwner);
        uint256 i;

        for (i = 0; i < totalTokensForOwner; i++) {
            // solhint-disable-next-line mark-callable-contracts
            _tokenIds[i] = ERC721Enumerable.tokenOfOwnerByIndex(owner, i);
            _uris[i] = tokenURI(_tokenIds[i]);
            _geoJsons[i] = geoJsons[_tokenIds[i]];
        }
        return (_tokenIds, _uris, _geoJsons);
    }

    function setTokenURI(uint256 tokenId, string memory uri)
        external
        onlyOwner
    {
        _setTokenURI(tokenId, uri);
    }

    function setGeoJson(uint256 tokenId, string memory geoJson)
        external
        onlyOwner
    {
        geoJsons[tokenId] = geoJson;
    }

    function setIndice(uint256 tokenId, uint8 indice)
        external
        onlyOwner
    {
        indices[tokenId] = indice;
    }

    function setIndiceType(uint256 tokenId, string memory indiceType)
        external
        onlyOwner
    {
        indicesType[tokenId] = indiceType;
    }

    /**
     * @notice called by the owner to make sure the checks pass correctly
     * @param _sdRegistry the address of the registry contract
     */
    function setSDRegistry(address _sdRegistry) 
        external 
        onlyOwner 
    {
        sdRegistry = _sdRegistry;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
