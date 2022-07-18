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
    // Exponents to void decimals
    int256 private RAD_EXP = 1e9;
    int256 private SIN_EXP = 1e9;
    int256 private PI_EXP = 1e9;
    int256 private COORD_EXP = 1e9;
    int256 private EARTH_RADIUS = 6371008; // m


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

    function multiPolygonArea(int256[][][][] memory coords) public view returns (int256) {
        int256 total = 0;

        for (uint256 i = 0; i < coords.length; i++) {
            total += polygonArea(coords[i]);
        }

        return total;
    }

    function polygonArea (int256[][][] memory coords) public view returns (int256) {
        int256 total = 0;

        if (coords.length > 0) {
            total += abs(ringArea(coords[0]));

            for (uint256 i = 1; i < coords.length; i++) {
                total -= abs(ringArea(coords[i]));
            }
        }
        return total;
    }

    // Obtained from Turf.js area function 
    // (https://github.com/Turfjs/turf/blob/master/packages/turf-area/index.ts)
    function ringArea(int256[][] memory coords) public view returns (int256) {
        uint256 coordsLength = coords.length;
        int256[] memory p1;
        int256[] memory p2;
        int256[] memory p3;
        uint256 lowerIndex;
        uint256 middleIndex;
        uint256 upperIndex;
        int256 total = 0;

        if (coordsLength > 2) {
            for (uint256 i = 0; i < coordsLength; i++) {
                if (i == coordsLength - 2) {
                    // i = N-2
                    lowerIndex = coordsLength - 2;
                    middleIndex = coordsLength - 1;
                    upperIndex = 0;
                } else if (i == coordsLength - 1) {
                    // i = N-1
                    lowerIndex = coordsLength - 1;
                    middleIndex = 0;
                    upperIndex = 1;
                } else {
                    // i = 0 to N-3
                    lowerIndex = i;
                    middleIndex = i + 1;
                    upperIndex = i + 2;
                }
                p1 = coords[lowerIndex];
                p2 = coords[middleIndex];
                p3 = coords[upperIndex];

                int256 v1 = nanoRad(p3[0]);
                int256 v2 = nanoRad(p1[0]);
                int256 v3 = nanoSin(p2[1]);

                int256 subTotal = (v1 - v2) * v3;
                total += subTotal;
            }

            total = total * EARTH_RADIUS**2 / (2 * RAD_EXP * SIN_EXP * PI_EXP * COORD_EXP);
        }
        return total;
    }

    // Return nano radians (radians * 10^9) of a certain degree angle (coordinate)
    function nanoRad(int256 n) private view returns (int256) {
        int256 PI = 3141592653;
        return (n * PI * RAD_EXP) / (180);
    }

    /**
    The sine of an angle is given in a range [-1, 1]. The argument of the sine function 
    is usually radians, which exists in a range [0, 2π rad]. Since this is not possible in 
    Solidity, the following function returns the angle in 'nano' units (sine * 10^9). To do 
    so, the sine is calculated using integer values. Instead of using a circle divided 
    in 360 angle units (degrees), it assumes a circle divided in 16384 angle units (tAngle).
    To convert from degrees to tAngle units we need to do the following:
        tAngle = (degrees * 16384) / 360;
    The returning value exists on a range [-32676, 32676] (signed 16-bit). Therefore, to 
    finally get the sine value, we need to divide the sin() function by 32676;
    */
    function nanoSin(int256 angle) private view returns (int256) {
        int256 angleUnits = 1073741824;
        int256 maxAngle = 2147483647;
        int256 tAngle = (angle * angleUnits) / (360 * COORD_EXP);
        return Trigonometry.sin(uint256(tAngle)) * int(SIN_EXP) / maxAngle;
    }
    // Returns absolute value of input
    function abs(int256 value) private pure returns (int256) {
        return value >= 0
            ? value
            : -value;
    }
}