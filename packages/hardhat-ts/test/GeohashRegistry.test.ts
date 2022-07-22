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
import { solidityCoordinate } from "../utils/geomUtils";

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
    it("Encodes coordinates with precision 1", async () => {
      const lat = 12.194946;
      const lon = -69.011151;
      const precision = 1;

      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version
      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d");
    });

    it("Encodes coordinates with precision 4", async () => {
      const lat = 12.194946;
      const lon = -69.011151;
      const precision = 4;

      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version
      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6nv");
    });

    it("Encodes coordinates with precision 6", async () => {
      const lat = 12.194946;
      const lon = -69.011151;
      const precision = 6;

      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version
      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6nvms");
    });

    it("Encodes coordinates with precision 8", async () => {
      const lat = 12.194946;
      const lon = -69.011151;
      const precision = 8;

      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version
      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6nvms58");
    });

    it("Encodes coordinates with precision 9", async () => {
      const lat = 12.194946;
      const lon = -69.011151;
      const precision = 9;

      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version
      const geohash = await geohashRegistry.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6nvms58e");
    });
  });

  describe("Geohash decoding", async () => {
    it("Decodes geohash with precision 8", async () => {
      const geohash = "d6nvms58";
      const latExpected = 12194910048; // Solidity latitude version with a little error deviation
      const lonExpected = -69011135100; // Solidity longitude version with a little error devaition

      const coordinatesBigNumber = await geohashRegistry.decode(geohash);
      // Transform from BigNumber hex value to number
      const [lat, lon] = coordinatesBigNumber.map((coord) => coord.toNumber());

      expect(lat).to.equal(latExpected);
      expect(lon).to.equal(lonExpected);
    });
  });
});
