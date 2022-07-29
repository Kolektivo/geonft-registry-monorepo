// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// import console.log
import "hardhat/console.sol";

contract GeohashRegistry {
    // length of the geohash string
    uint8 public constant GEOHASH_LENGTH = 8;
    uint256 private constant COORD_EXP = 1e9; // Coordinates exponent to avoid decimals
    int64 private constant MIN_LAT = -90 * int64(int256(COORD_EXP));
    int64 private constant MAX_LAT = 90 * int64(int256(COORD_EXP));
    int64 private constant MIN_LON = -180 * int64(int256(COORD_EXP));
    int64 private constant MAX_LON = 180 * int64(int256(COORD_EXP));
    string private constant BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz"; // Codes for geohash encoding
    bytes private constant CODES_BYTES = bytes(BASE32_CODES); // Codes in bytes format to iterate as array

    struct Node {
        uint256[] data;
    }

    mapping(string => Node) private nodes;
    mapping(string => uint8) private codesDict; // Character => it's position in the base32 codes string

    // solhint-disable-next-line func-visibility
    constructor() {
        // Populates codes map
        for (uint8 i = 0; i < CODES_BYTES.length; i++) {
            string memory char = string(abi.encodePacked(CODES_BYTES[i]));
            codesDict[char] = i;
        }
    }

    /**
     * @notice Encode point into geohash (more of geohash: https://en.wikipedia.org/wiki/Geohash).
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _lat latitude
     * @param _lon longitude
     * @param _data GeoNFT ID
     */
    function register(
        int64 _lat,
        int64 _lon,
        uint256 _data
    ) public {
        string memory geohash = encode(_lat, _lon, GEOHASH_LENGTH);
        this.add(geohash, _data);
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
     * @notice Add uint data by geohash to its relative subtree
     * @param _geohash the geohash
     * @param _data the uint data
     */
    function add(string calldata _geohash, uint256 _data) public {
        // require the length of the _geohash is GEOHASH_LENGTH
        require(bytes(_geohash).length == GEOHASH_LENGTH);

        // geohash characters splitted into an array
        bytes calldata geohashArray = bytes(_geohash);
        // geohash substring used each level of the subtree
        // string memory subhash;

        // iterates over all 8 levels of the geohash and insert/append data
        // to each of those levels indexed by its subhash
        for (uint8 i = 0; i < geohashArray.length; i++) {
            // create subhash according to the depth level by slicing original geohash;
            // subhash of 'gc7j98fg' at level 3 would be -> 'gc7';
            // solhint-disable-next-line
            string memory subhash = string(geohashArray[0:i + 1]);

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
     * @notice Encode point into geohash (more of geohash: https://en.wikipedia.org/wiki/Geohash).
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _lat latitude
     * @param _lon longitude
     * @param _precision geohash length precision
     * @return Geohash string with the same length as the _precision value (1-9)
     */
    function encode(
        int64 _lat,
        int64 _lon,
        uint8 _precision
    ) public pure returns (string memory) {
        bytes memory hashBytes = new bytes(_precision);
        int8 bits = 0;
        int8 bitsTotal = 0;
        int8 hashValue = 0;
        int64 maxLat = MAX_LAT;
        int64 minLat = MIN_LAT;
        int64 maxLon = MAX_LON;
        int64 minLon = MIN_LON;
        int64 mid;
        uint8 counter;

        while (counter < _precision) {
            if (bitsTotal % 2 == 0) {
                mid = (maxLon + minLon) / 2;

                if (_lon > mid) {
                    hashValue = (hashValue << 1) + 1;
                    minLon = mid;
                } else {
                    hashValue = (hashValue << 1) + 0;
                    maxLon = mid;
                }
            } else {
                mid = (maxLat + minLat) / 2;

                if (_lat > mid) {
                    hashValue = (hashValue << 1) + 1;
                    minLat = mid;
                } else {
                    hashValue = (hashValue << 1) + 0;
                    maxLat = mid;
                }
            }

            bits++;
            bitsTotal++;

            if (bits == 5) {
                bytes1 charByte = CODES_BYTES[uint8(hashValue)];
                hashBytes[counter] = charByte;
                bits = 0;
                hashValue = 0;
                counter++;
            }
        }

        return string(hashBytes);
    }

    /**
     * @notice Decode a geohash of any given length to a pair of coordinates
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _geohash Geohash string up to 9 characters of precision
     * @return Array of Big Number integer coordinates (lat, lon)
     */
    function decode(string memory _geohash)
        public
        view
        returns (int64[2] memory)
    {
        int64[4] memory bbox = decodeBbox(_geohash);
        int64 minLat = bbox[0];
        int64 minLon = bbox[1];
        int64 maxLat = bbox[2];
        int64 maxLon = bbox[3];
        // Get center value of bounding box
        int64 lat = (minLat + maxLat) / 2; // Latitude middle point
        int64 lon = (minLon + maxLon) / 2; // Longitude middle point

        return [lat, lon];
    }

    /**
     * @notice Decode the bounding box of a given geohash
     *     Obtained from the node geohash package (ngeohash): https://github.com/sunng87/node-geohash
     * @param _geohash Geohash string up to 9 characters of precision
     * @return Array of Big Number integer coordinates representing the 
        bounding box (lower left point, upper right point)
     */
    function decodeBbox(string memory _geohash)
        private
        view
        returns (int64[4] memory)
    {
        bool isLon = true;
        int64 maxLat = MAX_LAT;
        int64 minLat = MIN_LAT;
        int64 maxLon = MAX_LON;
        int64 minLon = MIN_LON;
        int64 mid;
        uint8 hashValue;

        for (uint8 i = 0; i < bytes(_geohash).length; i++) {
            string memory code = string(abi.encodePacked(bytes(_geohash)[i]));
            hashValue = codesDict[code];

            for (uint8 bits = 5; bits > 0; bits--) {
                uint8 bit = (hashValue >> (bits - 1)) & 1;

                if (isLon) {
                    mid = (maxLon + minLon) / 2;

                    if (bit == 1) {
                        minLon = mid;
                    } else {
                        maxLon = mid;
                    }
                } else {
                    mid = (maxLat + minLat) / 2;

                    if (bit == 1) {
                        minLat = mid;
                    } else {
                        maxLat = mid;
                    }
                }
                isLon = !isLon;
            }
        }
        return [minLat, minLon, maxLat, maxLon];
    }
}
