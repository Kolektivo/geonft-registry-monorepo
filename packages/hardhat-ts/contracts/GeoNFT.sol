// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GeoNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // GeoNFT token properties
    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    mapping(uint256 => uint8) private indexValues; // mapping of tokenId to index
    mapping(uint256 => string) private indexTypes; // mapping of tokenId to index type

    // solhint-disable-next-line no-empty-blocks, func-visibility
    constructor() ERC721("GEONFT Minter", "GEONFT") {}

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function safeMint(
        address to,
        string memory uri,
        string memory _geoJson
    ) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        // set geoJson
        geoJsons[tokenId] = _geoJson;

        // default index value to 0 type to area_m2
        indexValues[tokenId] = 0;
        indexTypes[tokenId] = "area_m2";

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

    function setGeoJson(uint256 tokenId, string memory _geoJson)
        external
        onlyOwner
    {
        geoJsons[tokenId] = _geoJson;
    }

    function setIndexValue(uint256 tokenId, uint8 indice) external onlyOwner {
        indexValues[tokenId] = indice;
    }

    function setIndexType(uint256 tokenId, string memory indiceType)
        external
        onlyOwner
    {
        indexTypes[tokenId] = indiceType;
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

    function geoJson(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        string memory _geoJson = geoJsons[tokenId];
        return _geoJson;
    }

    function indexValue(uint256 tokenId)
        public
        view
        returns (uint8)
    {
        uint8 _indexValue = indexValues[tokenId];
        return _indexValue;
    }

    function indexType(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        string memory _indexType = indexTypes[tokenId];
        return _indexType;
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
