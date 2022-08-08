// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { GeoNFT } from "./GeoNFT.sol";
import { AreaCalculation } from "../lib/AreaCalculation.sol";
import { GeohashUtils } from "../lib/GeohashUtils.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";
// import console.log
import "hardhat/console.sol";

contract SDRegistry is ReentrancyGuard, Ownable {
    using BytesLib for bytes;
    // The GEONFT ERC721 token contract
    GeoNFT public geoNFT;

    // length of the geohash string
    uint8 public constant GEOHASH_LENGTH = 8;

    struct Node {
        uint256[] data;
    }

    mapping(uint256 => string) private geoJsons; // mapping of tokenId to geoJson
    mapping(string => Node) private nodes;
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
    function registerGeoNFT(uint256 tokenId, int64[2] memory _centroid) 
        external 
        onlyOwner
        returns (uint256 area)
    {
        int64 lat = _centroid[0];
        int64 lon = _centroid[1];
        // retrieve the geoJson from the GeoNFT contract
        string memory geoJson = geoNFT.geoJson(tokenId);

        // add GeoNFT to the registry
        uint256 _area = 10;

        // solhint-disable-next-line mark-callable-contracts
        string memory geohash = GeohashUtils.encode(lat, lon, GEOHASH_LENGTH);

        add(geohash, tokenId);

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

    /**
     * @notice Add uint data by geohash to its relative subtree
     * @param _geohash the geohash
     * @param _data the uint data
     */
    function add(string memory _geohash, uint256 _data) public {
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
            Node storage node = nodes[subhash];

            // check if data is in node
            bool isInNode = dataExists(node, _data);

            // if data already in node, return
            if (isInNode) {
                console.log("Data already in the node");
                continue;
            }
            // if node does not exist, create it
            if (node.data.length == 0) {
                node.data = new uint256[](1);
                node.data[0] = _data;
                nodes[subhash] = node;
            } else {
                // if node exists, add data to it
                uint256[] memory newData = new uint256[](node.data.length + 1);
                for (uint256 j = 0; j < node.data.length; j++) {
                    newData[j] = node.data[j];
                }
                newData[node.data.length] = _data;
                node.data = newData;
                nodes[subhash] = node;
            }
        }
    }

    /**
     * @notice Get a data by geohash
     * @param _geohash the geohash
     */
    function get(string memory _geohash)
        public
        view
        returns (uint256[] memory)
    {
        Node storage node = nodes[_geohash];
        return node.data;
    }

    /**
     * @notice Update geohash
     * @param _formergeohash the former geohash
     * @param _newgeohash the new geohash
     * @param _data the uint data
     */
    function update(
        string memory _formergeohash,
        string calldata _newgeohash,
        uint256 _data
    ) public {
        // remove data from former geohash
        remove(_formergeohash, _data);

        // add data to new node
        add(_newgeohash, _data);
    }

    /**
     * @notice Remove data from node with specified geohash
     * @param _geohash geohash
     * @param _data the uint data
     */
    function remove(string memory _geohash, uint256 _data) public {
        // lookup existing node
        Node storage node = nodes[_geohash];

        // check if data is in node
        bool isInNode = dataExists(node, _data);

        // if data wasn't in node, return
        if (!isInNode) {
            console.log("Data not in node");
            return;
        }

        // if node contains only one value, delete node
        if (node.data.length == 1) {
            delete nodes[_geohash];
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
            nodes[_geohash] = node;
        }
    }

    /**
     * @notice Check if data in node
     * @param _node node
     * @param _data the uint data
     */
    function dataExists(Node memory _node, uint256 _data)
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

    // TODO
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

    // TODO
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
        uint256[] memory _tokenIds = new uint256[](geoJsonMapSize);
        uint256 i;

        for (i = 0; i < geoJsonMapSize; i++) {
            _tokenIds[i] = i;
        }
        return (_tokenIds);
    }

    // TODO: REMOVE THE FOLLOWING FUNCTIONS WHEN AREA CALCULATION IS CALLED IN THE REGISTER FUNCTION

    /**
     * @notice Calculate the area of a multi polygon coordinates
     * @param _coordinates Big Number integer coordinates of a multi polygon
     * @return Area measured in square meters
    */
    function multiPolygonArea(int256[][][][] memory _coordinates) public pure returns (uint256) {
        // solhint-disable-next-line mark-callable-contracts
        return AreaCalculation.multiPolygonArea(_coordinates);
    }

    /**
     * @notice Calculate the area of a single polygon coordinates
     * @param _coordinates Big Number integer coordinates of a single polygon - an array of rings
     * @return Area measured in square meters
    */
    function polygonArea (int256[][][] memory _coordinates) public pure returns (uint256) {
        // solhint-disable-next-line mark-callable-contracts
        return AreaCalculation.polygonArea(_coordinates);
    }
}