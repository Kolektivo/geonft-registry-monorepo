import { ethers } from "hardhat";
import chai from "chai";
import {
  // eslint-disable-next-line camelcase
  GeohashRegistry__factory,
  GeohashRegistry,
  // eslint-disable-next-line node/no-missing-import, node/no-unpublished-import
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// eslint-disable-next-line node/no-missing-import
import { solidityCoordinate, centroid } from "../utils/geomUtils";
// eslint-disable-next-line node/no-missing-import
import { GEOJSON2 } from "./SDRegistry.mock";

const { expect } = chai;

let geohashRegistry: GeohashRegistry;
// eslint-disable-next-line camelcase
let geohashRegistryFactory: GeohashRegistry__factory;
let deployer: SignerWithAddress;

describe("geohash registry", () => {
  beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    geohashRegistryFactory = (await ethers.getContractFactory(
      "GeohashRegistry",
      deployer
    )) as GeohashRegistry__factory; // eslint-disable-line camelcase
    geohashRegistry = await geohashRegistryFactory.deploy();
  });

  describe("add to geohash registry", async () => {
    const geohash1 = "d6nuzk8c";
    const geohash2 = "d6nuzk8d";
    const data1 = 42; // Simulates GeoNFT ID
    const data2 = 676; // Simulates GeoNFT ID

    it("add nft to geohash and check subtree is filled", async () => {
      // When adding an nft, data is not only appended to it's geohash array, but also
      // to all subhashes arrays. E.g. for 'd6nuzk8c -> 42, data is added to the subtree:
      // 'd' -> [42]
      // 'd6' -> [42]
      // 'd6n' -> [42]
      // 'd6nu' -> [42]
      // 'd6nuz' -> [42]
      // 'd6nuzk' -> [42]
      // 'd6nuzk8' -> [42]
      // 'd6nuzk8c' -> [42]

      await geohashRegistry.add(geohash1, data1);

      // Node array of all geohash subhashe's tree
      const nodes = await Promise.all(
        Array.from({ length: geohash1.length }).map((_, i) => {
          const subhash = geohash1.slice(0, i + 1);
          return geohashRegistry.get(subhash);
        })
      );

      // Get first value of each subhash array and check it's the expected value
      nodes.forEach((node) => {
        const dataArray = node[1]; // node = [geohash: string, dataArray: number[]]
        expect(dataArray[0]).to.equal(data1);
      });
    });
    it("add two nfts to same geohash", async () => {
      await geohashRegistry.add(geohash1, data1);

      // add a node to the tree
      await geohashRegistry.add(geohash1, data2);

      const node = await geohashRegistry.get(geohash1);

      expect(node[1].length).to.equal(2);
      expect(node[1][0]).to.equal(data1);
      expect(node[1][1]).to.equal(data2);
    });
    it("add the same nft to same geohash", async () => {
      await geohashRegistry.add(geohash1, data1);

      // add a node to the tree
      await geohashRegistry.add(geohash1, data1);

      const node = await geohashRegistry.get(geohash1);

      expect(node[1].length).to.equal(1);
      expect(node[1][0]).to.equal(data1);
    });
    it("update geohash", async () => {
      await geohashRegistry.add(geohash1, data1);

      const node = await geohashRegistry.get(geohash1);
      expect(node[1].length).to.equal(1);

      // update geohash from geohash1 (d6nuzk8c) to geohash2 (d6nuzk8d) for data1 (42)
      await geohashRegistry.update(
        // former geohash
        geohash1,
        // new geohash
        geohash2,
        // data
        data1
      );

      const formerNode = await geohashRegistry.get(geohash1);
      expect(formerNode[1].length).to.equal(0);

      const newNode = await geohashRegistry.get(geohash2);
      expect(newNode[1].length).to.equal(1);
    });
    it("remove data from node with geohash", async () => {
      await geohashRegistry.add(geohash1, data1);

      const node = await geohashRegistry.get(geohash1);
      expect(node[1].length).to.equal(1);

      // remove data1 (42) from geohash d6nuzk8c
      await geohashRegistry.remove(geohash1, data1);

      const formerNode = await geohashRegistry.get(geohash1);
      expect(formerNode[1].length).to.equal(0);
    });
    it("remove data from geohash with two items", async () => {
      await geohashRegistry.add(geohash1, data1);
      await geohashRegistry.add(geohash1, data2);

      const node = await geohashRegistry.get(geohash1);
      expect(node[1].length).to.equal(2);

      // remove data1 from geohash d6nuzk8c
      await geohashRegistry.remove(geohash1, data1);

      const formerNode = await geohashRegistry.get(geohash1);
      expect(formerNode[1].length).to.equal(1);
    });
    it("try to remove data from geohash that hasn't been added", async () => {
      await geohashRegistry.add(geohash1, data1);

      const node = await geohashRegistry.get(geohash1);
      expect(node[1].length).to.equal(1);

      // remove data2 (676) from geohash d6nuzk8c
      await geohashRegistry.remove(geohash1, data2);

      const formerNode = await geohashRegistry.get(geohash1);
      expect(formerNode[1].length).to.equal(1);
    });
  });

  describe("find data by subhash", async () => {
    it("find data of multiple geohashes at different leves", async () => {
      const geohash1 = "gc7j98fg";
      const geohash2 = "gc7j98fj";
      const geohash3 = "gc7j98k3";
      const data1 = 22;
      const data2 = 33;
      const data3 = 44;

      /**
       * Level 6                   gc7j98
       *                          /      \
       * Level 7            gc7j98f       gc7j98k
       *                   /      \             \
       * Level 8    gc7j98fg     gc7j98fj       gc7j98k3
       *             [22]          [33]           [44]
       */
      await Promise.all([
        geohashRegistry.add(geohash1, data1),
        geohashRegistry.add(geohash2, data2),
        geohashRegistry.add(geohash3, data3),
      ]);

      const subhashLevel7 = geohash1.slice(0, 7);
      const subhashLevel6 = geohash1.slice(0, 6);
      const [resultLevel7BigNumber, resultLevel6BigNumber] = await Promise.all([
        geohashRegistry.get(subhashLevel7),
        geohashRegistry.get(subhashLevel6),
      ]);

      // Transform from Big Number values to integer values
      const resultLevel7 = resultLevel7BigNumber[1].map((value) =>
        value.toNumber()
      );
      const resultLevel6 = resultLevel6BigNumber[1].map((value) =>
        value.toNumber()
      );

      // Geohash gc7j98f groups geohash1 and geohash2, so its data is -> [data1, data2]
      expect(resultLevel7).deep.equal([data1, data2]);
      // Geohash gc7j98 groups geohash1, geohash2 and geohash3, so its data is -> [data1, data2, data3]
      expect(resultLevel6).deep.equal([data1, data2, data3]);
    });
  });

  describe("geohash encoding", async () => {
    // Reference: https://www.movable-type.co.uk/scripts/geohash.html
    it("Encodes Curazao's coordinates with precision from 1 to 9", async () => {
      const expectedGeohash = "d6nvms58e"; // Precision 9
      const lat = 12.194946;
      const lon = -69.011151;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      // Array of promises with the geohash returned from the encode() function.
      // Each geohash is calculated using the same coordinates pair but with
      // a different precision, withing a range from 1 to 9
      const geohashEncodingPromises: Array<Promise<string>> = Array.from({
        length: 9,
      }).map((_, i: number) => {
        const precision = i + 1;
        return geohashRegistry.encode(latSol, lonSol, precision);
      });
      const geohashes = await Promise.all(geohashEncodingPromises);

      geohashes.forEach((geohash, i) => {
        // Calculate expected geohash for certain precision i by slicing the
        // full expectedGeohash. So, the expected geohash for precision 4
        // would be: "d6nv" (length = 4)
        const expectedGeohashForPrecisionI = expectedGeohash.slice(0, i + 1);
        expect(geohash).to.equal(expectedGeohashForPrecisionI);
      });
    });

    it("Encodes Curazao's inverted coordinates with precision from 1 to 9", async () => {
      const expectedGeohash = "mtc4d7urk"; // Precision 9
      const lat = -12.194946;
      const lon = 69.011151;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      // Array of promises with the geohash returned from the encode() function.
      // Each geohash is calculated using the same coordinates pair but with
      // a different precision, withing a range from 1 to 9
      const geohashEncodingPromises: Array<Promise<string>> = Array.from({
        length: 9,
      }).map((_, i: number) => {
        const precision = i + 1;
        return geohashRegistry.encode(latSol, lonSol, precision);
      });
      const geohashes = await Promise.all(geohashEncodingPromises);

      geohashes.forEach((geohash, i) => {
        // Calculate expected geohash for certain precision i by slicing the
        // full expectedGeohash. So, the expected geohash for precision 4
        // would be: "d6nv" (length = 4)
        const expectedGeohashForPrecisionI = expectedGeohash.slice(0, i + 1);
        expect(geohash).to.equal(expectedGeohashForPrecisionI);
      });
    });

    it("Encodes GeoJSON 2 polygon with precision 8", async () => {
      const geometry = GEOJSON2.features[0].geometry;
      const [lat, lon] = centroid(geometry);
      const precision = 8;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6pj0777");
    });
  });

  describe("geohash decoding", async () => {
    it("decodes geohash with precision 8", async () => {
      const geohash = "d6nvms58";
      // Solidity coordinates version with a little error deviation
      const coordinatesExpected = [12194910048, -69011135100];

      const coordinatesBigNumber = await geohashRegistry.decode(geohash);
      // Transform from BigNumber hex value to number
      const coordinates = coordinatesBigNumber.map((coord) => coord.toNumber());

      expect(coordinates).deep.equal(coordinatesExpected);
    });
  });
});
