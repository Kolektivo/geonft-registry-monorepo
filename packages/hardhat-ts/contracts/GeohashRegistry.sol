// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// import console.log
import "hardhat/console.sol";

contract GeohashRegistry {
    // length of the geohash string
    uint256 GEOHASH_LENGTH = 8;

    struct Node {
        uint256[] data;
    }

    mapping(string => Node) nodes;

    /**
     * @notice Get a data by geohash
     * @param _geohash the geohash
     */
    function get(string memory _geohash) public view returns (string memory, uint256[] memory) {
        Node storage node = nodes[_geohash];
        return (_geohash, node.data);
    }

    /**
     * @notice Add uint data by geohash
     * @param _geohash the geohash
     * @param _data the uint data
     */
    function add(string memory _geohash, uint256 _data) public {
        // require the length of the _geohash is GEOHASH_LENGTH
        require(bytes(_geohash).length == GEOHASH_LENGTH);

        // lookup existing node
        Node storage node = nodes[_geohash];

        // if node does not exist, create it
        if (node.data.length == 0) {
            node.data = new uint256[](1);
            node.data[0] = _data;
            nodes[_geohash] = node;
        } else {
            // if node exists, add data to it
            uint256[] memory newData = new uint256[](node.data.length + 1);
            for (uint256 i = 0; i < node.data.length; i++) {
                newData[i] = node.data[i];
            }
            newData[node.data.length] = _data;
            node.data = newData;
            nodes[_geohash] = node;
        }
    }

    /**
     * @notice Update geohash
     * @param _formergeohash the former geohash
     * @param _newgeohash the new geohash
     * @param _data the uint data
     */
    function update(string memory _formergeohash, string memory _newgeohash, uint256 _data) public {
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

        // if node contains only one value, delete node
        if (node.data.length == 1) {
            delete nodes[_geohash];
        } else {
            // if node contains more than one value, remove data
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
}