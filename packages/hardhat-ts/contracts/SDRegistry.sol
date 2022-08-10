// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { GeoNFT } from "./GeoNFT.sol";
import { AreaCalculation } from "../lib/AreaCalculation.sol";
import { GeohashUtils } from "../lib/GeohashUtils.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol"; // Utils to slice array
import "hardhat/console.sol"; // Import console.log

contract SDRegistry is ReentrancyGuard, Ownable {
    using BytesLib for bytes;
    // The GEONFT ERC721 token contract
    GeoNFT public geoNFT;

    // length of the geohash string
    uint8 public constant GEOHASH_LENGTH = 8;

    // Array of registered token IDs
    uint256[] private tokenArray;

    struct Node {
        uint256[] data;
    }

    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    mapping(string => Node) private geotree;
    mapping(uint256 => string) private tokenGeohash; // mapping of tokenId to geohash
    uint private geotreeMapSize;

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
     * @param _tokenId the index of the GeoNFT to register
     * @param _centroid Centroid of the polygon passed as [latitude, longitude]
     * @return area of the GeoNFT in meters squared
     */
    function registerGeoNFT(uint256 _tokenId, int64[2] memory _centroid, int256[2][][] memory _coordinates) 
        external 
        onlyOwner
        returns (uint256 area)
    {
        int64 lat = _centroid[0];
        int64 lon = _centroid[1];

        // Add token ID to tokenArray
        tokenArray.push(_tokenId);
        // retrieve the geoJson from the GeoNFT contract
        string memory geoJson = geoNFT.geoJson(_tokenId);

        // TODO: Check all parts are valid polygons using the AreaCalculation.isPolygon() function
        // solhint-disable-next-line mark-callable-contracts
        uint256 _area = AreaCalculation.polygonArea(_coordinates);

        // solhint-disable-next-line mark-callable-contracts
        string memory geohash = GeohashUtils.encode(lat, lon, GEOHASH_LENGTH);
        // Add token ID to the geotree
        addToGeotree(geohash, _tokenId);
        // Add token ID - geohash to the registry
        tokenGeohash[_tokenId] = geohash;

        geotreeMapSize++;

        emit GeoNFTRegistered(_tokenId, geoJson, _area);
        return _area;
    }

    /**
     * @notice Unregister a GeoNFT from the Spatial Data Registry
     * @param _tokenId the index of the GeoNFT to unregister
    */
    function unregisterGeoNFT(uint256 _tokenId) 
        external 
        onlyOwner 
    { 
        string memory geohash = tokenGeohash[_tokenId];
        // geohash characters splitted into an array
        bytes memory geohashArray = bytes(geohash);
        // require the length of the _geohash is GEOHASH_LENGTH
        require(geohashArray.length == GEOHASH_LENGTH);

        for (uint8 i = 0; i < geohashArray.length; i++) {
            // create subhash at each depth level from 0 to GEOHASH_LENGTH by slicing original geohash;
            // subhash of 'gc7j98fg' at level 3 would be -> 'gc7';
            string memory subhash = string(geohashArray.slice(0, i + 1));
            removeFromGeotree(subhash, _tokenId);
        }

        // Remove token ID from the global token array
        if (tokenArray.length == 1) {
            tokenArray.pop();
        } else {
            uint256[] memory newData = new uint256[](tokenArray.length - 1);
            uint256 counter = 0;
            for (uint256 i = 0; i < tokenArray.length - 1; i++) {
                if (tokenArray[i] != _tokenId) {
                    newData[counter] = tokenArray[i];
                    counter++;
                }
            }
        }

        emit GeoNFTUnregistered(_tokenId);
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

    /**
     * @notice Return all the GeoNFT ids in the registry
     * @return geoNFTsArray Array of all registered token IDs
     */
    function getAllGeoNFTs() public view returns (uint256[] memory geoNFTsArray) { 
        return tokenArray;
    }

    /**
     * @notice Query registry by latitude, longitude and geohash depth level
     * @param _latitude Latitude
     * @param _longitude Longitude
     * @param _precision Precision (geohash depth level) of the query. Must be in range [1, 8]
     * @return geoNFTsArray Array of all registered token IDs
     */
    // 
    function queryGeoNFTsByLatLng(       
        int64 _latitude,       
        int64 _longitude,
        uint8 _precision
    )
        public
        view
        returns (
            uint256[] memory
        )
    {
        // solhint-disable-next-line mark-callable-contracts
        string memory geohash = GeohashUtils.encode(_latitude, _longitude, _precision);
        Node memory node = geotree[geohash];

        return node.data;
    }

    // TODO
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
        uint256[] memory _tokenIds = new uint256[](geotreeMapSize);
        uint256 i;

        for (i = 0; i < geotreeMapSize; i++) {
            _tokenIds[i] = i;
        }
        return (_tokenIds);
    }

    /**
     * @notice Add uint data by geohash to its relative subtree
     * @param _geohash the geohash
     * @param _data the uint data
     */
    function addToGeotree(string memory _geohash, uint256 _data) public {
        // require the length of the _geohash is GEOHASH_LENGTH
        require(bytes(_geohash).length == GEOHASH_LENGTH);

        // geohash characters splitted into an array
        bytes memory geohashArray = bytes(_geohash);
        // geohash substring used each level of the subtree
        // string memory subhash;

        // iterates over all 8 levels of the geohash and insert/append data
        // to each of those levels indexed by its subhash
        for (uint8 i = 0; i < geohashArray.length; i++) {
            // create subhash according to the depth level by slicing original geohash;
            // subhash of 'gc7j98fg' at level 3 would be -> 'gc7';
            // solhint-disable-next-line
            string memory subhash = string(geohashArray.slice(0, i + 1));

            // lookup existing node
            Node storage node = geotree[subhash];

            // check if data is in node
            bool isInNode = dataExistsInNode(node, _data);

            // if data already in node, continue
            if (isInNode) {
                console.log("Data already in the node");
                continue;
            }
            // if node does not exist, create it
            if (node.data.length == 0) {
                node.data = new uint256[](1);
                node.data[0] = _data;
                geotree[subhash] = node;
            } else {
                // if node exists, add data to it
                uint256[] memory newData = new uint256[](node.data.length + 1);
                for (uint256 j = 0; j < node.data.length; j++) {
                    newData[j] = node.data[j];
                }
                newData[node.data.length] = _data;
                node.data = newData;
                geotree[subhash] = node;
            }
        }
    }

    /**
     * @notice Get a data by geohash
     * @param _geohash the geohash
     */
    function getFromGeotree(string memory _geohash)
        public
        view
        returns (uint256[] memory)
    {
        Node storage node = geotree[_geohash];
        return node.data;
    }

    /**
     * @notice Update geohash
     * @param _formergeohash the former geohash
     * @param _newgeohash the new geohash
     * @param _data the uint data
     */
    function updateGeotree(
        string memory _formergeohash,
        string calldata _newgeohash,
        uint256 _data
    ) public {
        // remove data from former geohash
        removeFromGeotree(_formergeohash, _data);

        // add data to new node
        addToGeotree(_newgeohash, _data);
    }

    /**
     * @notice Remove data from node with specified geohash
     * @param _geohash geohash
     * @param _data the uint data
     */
    function removeFromGeotree(string memory _geohash, uint256 _data) public {
        // lookup existing node
        Node storage node = geotree[_geohash];

        // check if data is in node
        bool isInNode = dataExistsInNode(node, _data);

        // if data wasn't in node, return
        if (!isInNode) {
            console.log("Data not in node");
            return;
        }

        // if node contains only one value, delete node
        if (node.data.length == 1) {
            delete geotree[_geohash];
        } else {
            // if node contains more than one value, rebuild data array
            uint256[] memory newData = new uint256[](node.data.length - 1);
            uint256 counter = 0;
            for (uint256 i = 0; i < node.data.length - 1; i++) {
                if (node.data[i] != _data) {
                    newData[counter] = node.data[i];
                    counter++;
                }
            }
            node.data = newData;
            geotree[_geohash] = node;
        }
    }

    /**
     * @notice Check if data in node
     * @param _node node
     * @param _data the uint data
     */
    function dataExistsInNode(Node memory _node, uint256 _data)
        internal
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < _node.data.length; i++) {
            if (_node.data[i] == _data) {
                return true;
            }
        }
        return false;
    }
}