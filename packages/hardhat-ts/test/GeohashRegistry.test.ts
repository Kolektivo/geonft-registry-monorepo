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
    it("add two nfts to same geohash", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      // add a node to the tree
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        676
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );

      expect(node[1].length).to.equal(2);
      expect(node[1][0]).to.equal(42);
      expect(node[1][1]).to.equal(676);
    });
    it("add the same nft to same geohash", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      // add a node to the tree
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );

      expect(node[1].length).to.equal(1);
      expect(node[1][0]).to.equal(42);
    });
    it("update geohash", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(node[1].length).to.equal(1);

      // update geohash from d6nuzk8c to d6nuzk8d for 42
      await geohashRegistry.update(
        // former geohash
        "d6nuzk8c",
        // new geohash
        "d6nuzk8d",
        // data
        42
      );

      const formerNode = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(formerNode[1].length).to.equal(0);

      const newNode = await geohashRegistry.get(
        // geohash
        "d6nuzk8d"
      );
      expect(newNode[1].length).to.equal(1);
    });
    it("remove data from node with geohash", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(node[1].length).to.equal(1);

      // remove 42 from geohash d6nuzk8c
      await geohashRegistry.remove(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const formerNode = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(formerNode[1].length).to.equal(0);
    });
    it("remove data from geohash with two items", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        676
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(node[1].length).to.equal(2);

      // remove 42 from geohash d6nuzk8c
      await geohashRegistry.remove(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const formerNode = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(formerNode[1].length).to.equal(1);
    });
    it("try to remove data from geohash that hasn't been added", async () => {
      await geohashRegistry.add(
        // geohash
        "d6nuzk8c",
        // data
        42
      );

      const node = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(node[1].length).to.equal(1);

      // remove 676 from geohash d6nuzk8c
      await geohashRegistry.remove(
        // geohash
        "d6nuzk8c",
        // data
        676
      );

      const formerNode = await geohashRegistry.get(
        // geohash
        "d6nuzk8c"
      );
      expect(formerNode[1].length).to.equal(1);
    });
  });

  describe("Geohash encoding", async () => {
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

  describe("Geohash decoding", async () => {
    it("Decodes geohash with precision 8", async () => {
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
