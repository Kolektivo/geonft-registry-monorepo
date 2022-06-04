// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ReentrancyGuard } from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
// import { GEONFTInterface } from '../typechain/GEONFT.ts';

contract SDRegistry is ReentrancyGuard, Ownable {
    // The GEONFT ERC721 token contract
    // GEONFTInterface public geoNFT;

    // TODO: remove this list when quadtree is implemented
    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson

    /**
     * @notice Set up the Spatial Data Registry and prepopulate initial values
     */
    constructor(
        // GEONFTInterface _geoNFT
    ) {
        // geoNFT = _geoNFT;
    }

    event GeoNFTRegistered(uint256 tokenId, string geoJson, uint256 _area);
    event GeoNFTUnregistered(uint256 tokenId);

    /**
     * @notice Register a GeoNFT in the Spatial Data Registry
     * @param tokenId the index of the GeoNFT to register
     * @param geoJson the GeoJSON topology of the GeoNFT, simple polygon or point
     * @return area of the GeoNFT in meters squared
     */
    function registerGeoNFT(uint256 tokenId, string memory geoJson) 
        external 
        onlyOwner
        returns (uint256 area)
    {
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
        geoJsons[tokenId] = "";

        emit GeoNFTUnregistered(tokenId);
    }

    function _register(uint256 tokenId, string memory geoJson)
        internal
        returns (uint256 area)
    {
        // TODO: add tokenId to quadtree instead of mapping
        geoJsons[tokenId] = geoJson;

        // TODO: calculate area
        uint256 _area = 10;

        return _area;
    }
    
}