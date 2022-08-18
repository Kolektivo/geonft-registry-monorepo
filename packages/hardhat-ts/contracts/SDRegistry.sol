// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { GeoNFT } from "./GeoNFT.sol";
import { Trigonometry } from "../lib/Trigonometry.sol";

contract SDRegistry is ReentrancyGuard, Ownable {
    // The GEONFT ERC721 token contract
    GeoNFT public geoNFT;

    // Trigonometry functions library
    // using Trigonometry for uint256;
    // TODO: remove this list when quadtree is implemented
    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    uint private geoJsonMapSize;
    // Exponents to avoid decimals
    int256 private constant RAD_EXP = 1e9; // Radians exponent
    int256 private constant SIN_EXP = 1e9; // Sine exponent
    int256 private constant PI_EXP = 1e9; // Pi exponent
    int256 private constant COORD_EXP = 1e9; // Coordinates exponent
    int256 private constant PI = 3141592653;
    int256 private constant EARTH_RADIUS = 6371008; // m

    /**
     * @notice Set up the Spatial Data Registry and prepopulate initial values
     */
    
    constructor(
        GeoNFT _geoNFT
    // solhint-disable-next-line func-visibility
    ) {
        geoNFT = _geoNFT;
    }

    event GeoNFTRegistered(uint256 tokenId, string geoJson, uint256 _area);
    event GeoNFTUnregistered(uint256 tokenId);
    event GeoNFTTopologyUpdated(uint256 tokenId, string geoJson, uint256 _area);

    /**
     * @notice Register a GeoNFT in the Spatial Data Registry
     * @param tokenId the index of the GeoNFT to register
     * @return area of the GeoNFT in meters squared
     */
    function registerGeoNFT(uint256 tokenId) 
        external 
        onlyOwner
        returns (uint256 area)
    {
        // retrieve the geoJson from the GeoNFT contract
        string memory geoJson = geoNFT.geoJson(tokenId);

        // add GeoNFT to the registry
        uint256 _area = _register(tokenId, geoJson);

        emit GeoNFTRegistered(tokenId, geoJson, _area);
        return _area;
    }

    /**
     * @notice Unregister a GeoNFT from the Spatial Data Registry
     * @param tokenId the index of the GeoNFT to unregister
    */
    function unregisterGeoNFT(uint256 tokenId) 
        external 
        onlyOwner 
    {
        // TODO: remove tokenId from quadtree instead of mapping
        delete geoJsons[tokenId];
        geoJsonMapSize--;

        emit GeoNFTUnregistered(tokenId);
    }

    function _register(uint256 tokenId, string memory geoJson)
        internal
        returns (uint256 area)
    {
        // TODO: add tokenId to quadtree instead of mapping
        geoJsons[tokenId] = geoJson;
        geoJsonMapSize++;

        // TODO: calculate area
        uint256 _area = 10;

        return _area;
    }

    /**
     * @notice Update the topology of the GeoNFT
     * @param tokenId the index of the GeoNFT to update
    */
    function updateGeoNFTTopology(uint256 tokenId) 
        external 
        onlyOwner
        returns (uint256 area)        
    {
        // retrieve the geoJson from the GeoNFT contract
        string memory geoJson = geoNFT.geoJson(tokenId);

        // TODO: update topology in the quadtree
        geoJsons[tokenId] = geoJson;

        // TODO: calculate area
        uint256 _area = 20;

        emit GeoNFTTopologyUpdated(tokenId, geoJson, _area);
        return _area;
    }

    // Return all the GeoNFTs in the registry
    function getAllGeoNFTs()
        public
        view
        returns (
            uint256[] memory
        )
    {
        // TODO: use quadtree to get all tokens
        uint256[] memory _tokenIds = new uint256[](geoJsonMapSize);
        uint256 i;

        for (i = 0; i < geoJsonMapSize; i++) {
            _tokenIds[i] = i;
        }
        return (_tokenIds);
    }



}