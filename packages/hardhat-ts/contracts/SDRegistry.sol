// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { GeoNFT } from "./GeoNFT.sol";

contract SDRegistry is ReentrancyGuard, Ownable {
    // The GEONFT ERC721 token contract
    GeoNFT public geoNFT;

    // TODO: remove this list when quadtree is implemented
    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    uint private geoJsonMapSize;

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

    // Query registry by latitude and longitude
    function queryGeoNFTsByLatLng(
        // solhint-disable-next-line no-unused-vars        
        int256 latitude,
        // solhint-disable-next-line no-unused-vars        
        int256 longitude
    )
        public
        view
        returns (
            uint256[] memory
        )
    {
        // TODO: use quadtree to search by lat/lng
        uint256[] memory _tokenIds = new uint256[](geoJsonMapSize);
        uint256 i;

        for (i = 0; i < geoJsonMapSize; i++) {
            _tokenIds[i] = i;
        }
        return (_tokenIds);
    }

    // Query registry by bounding box
    function queryGeoNFTsByBoundingBox(
        // solhint-disable-next-line no-unused-vars
        int256 minLatitude,
        // solhint-disable-next-line no-unused-vars        
        int256 minLongitude,
        // solhint-disable-next-line no-unused-vars        
        int256 maxLatitude,
        // solhint-disable-next-line no-unused-vars        
        int256 maxLongitude
    )
        public
        view
        returns (
            uint256[] memory
        )
    {
        // TODO: use quadtree to search by bounding box
        uint256[] memory _tokenIds = new uint256[](geoJsonMapSize);
        uint256 i;

        for (i = 0; i < geoJsonMapSize; i++) {
            _tokenIds[i] = i;
        }
        return (_tokenIds);
    }

    // Checks to make sure first and last coordinates are the same.
    function isPolygon (int256[2][] memory _coordinates) public pure returns (bool) {
        uint256 length = _coordinates.length;
        if ((length > 2) &&
            (_coordinates[0][0] == _coordinates[length - 1][0]) &&
            (_coordinates[0][1] == _coordinates[length - 1][1])) {
            return true;
        } else {
            return false;
        }
    }

    // calculate the area of an arbitrary polygon in a plane
    // https://www.mathopenref.com/coordpolygonarea.html
    // Only accepts simple polygons, not multigeometry polygons
    function area (int256[2][] memory _coordinates ) public pure returns (uint256 area_) {
        require(isPolygon(_coordinates) == true);

        uint256 length = _coordinates.length;

        int256 counter = 0;
        for (uint256 i = 0; i < length - 1; i++) {

            int256 clockwiseCounter = _coordinates[i][0] * _coordinates[i + 1][1];
            int256 anticlockwiseCounter = _coordinates[i][1] * _coordinates[i + 1][0];

            counter += clockwiseCounter - anticlockwiseCounter;
        }

        return uint256(counter / 2);
    }
}