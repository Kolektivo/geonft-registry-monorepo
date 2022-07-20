import { ethers } from "hardhat";
import chai from "chai";
import {
  // eslint-disable-next-line camelcase
  GeohashRegistry__factory,
  GeohashRegistry,
  // eslint-disable-next-line node/no-missing-import, node/no-unpublished-import
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

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
});
