import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import chai from "chai";
import { GeoNFT, SDRegistry, AreaCalculation } from "../typechain";
import { solidityCoordinate } from "../utils/geomUtils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { GEOJSON1, GEOJSON2 } from "./mockData";

const { expect } = chai;

let sdRegistry: SDRegistry;
let geoNFT: GeoNFT;
let areaCalculation: AreaCalculation;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CENTROID: [BigNumber, BigNumber] = [
  solidityCoordinate(-68.890674),
  solidityCoordinate(12.147418),
];

describe("registry", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();

    // Libraries
    const trigonometryFactory = await ethers.getContractFactory("Trigonometry");
    const trigonometry = await trigonometryFactory.deploy();

    const geohashUtilsFactory = await ethers.getContractFactory("GeohashUtils");
    const geohashUtils = await geohashUtilsFactory.deploy();

    const areaFactory = await ethers.getContractFactory("AreaCalculation", {
      libraries: {
        Trigonometry: trigonometry.address,
      },
    });
    areaCalculation = (await areaFactory.deploy()) as AreaCalculation;

    // Contracts
    const geoNFTFactory = await ethers.getContractFactory("GeoNFT");
    geoNFT = (await geoNFTFactory.deploy()) as GeoNFT;

    const sdRegistryFactory = await ethers.getContractFactory("SDRegistry", {
      libraries: {
        AreaCalculation: areaCalculation.address,
        GeohashUtils: geohashUtils.address,
      },
    });
    sdRegistry = (await sdRegistryFactory.deploy(geoNFT.address)) as SDRegistry;
  });

  describe("deployment", async () => {
    it("deployer is owner", async () => {
      expect(await geoNFT.owner()).to.equal(deployer.address);
      expect(await sdRegistry.owner()).to.equal(deployer.address);
    });
  });

  describe("register geonft", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then updates area", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const newArea = 10;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get calculated area from spatial data registry
      const calculatedArea = registerReceipt.events?.[0].args?.[2];
      expect(calculatedArea).to.equal(newArea);

      // set area on minted GeoNFT
      await geoNFT.setIndexValue(tokenId, calculatedArea);

      // verify area on minted GeoNFT
      expect(await geoNFT.indexValue(tokenId)).to.equal(calculatedArea);
    });
  });

  describe("unregister geonft", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then removes from registry", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // unregister minted GeoNFT with Spatial Data Registry
      const unregisterTX: ContractTransaction =
        await sdRegistry.unregisterGeoNFT(tokenId);
      const unregisterReceipt: ContractReceipt = await unregisterTX.wait();
      expect(unregisterReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokensAfterUnregister = await sdRegistry.getAllGeoNFTs();
      expect(tokensAfterUnregister.length).to.equal(0);
    });
  });

  describe("update geonft topology", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then updates the topology", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const updatedArea = 20;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      await sdRegistry.registerGeoNFT(tokenId, CENTROID);
      // update geoJson on minted GeoNFT
      await geoNFT.setGeoJson(tokenId, GEOJSON2.toString());

      const updateTopologyTX: ContractTransaction =
        await sdRegistry.updateGeoNFTTopology(tokenId);
      const updateTopologyReceipt: ContractReceipt =
        await updateTopologyTX.wait();

      // get calculated area from spatial data registry
      const calculatedArea = updateTopologyReceipt.events?.[0].args?.[2];
      expect(calculatedArea).to.equal(updatedArea);

      // set area on minted GeoNFT
      await geoNFT.setIndexValue(tokenId, calculatedArea);

      // verify area on minted GeoNFT
      expect(await geoNFT.indexValue(tokenId)).to.equal(calculatedArea);
    });
  });

  describe("query geonfts by lat/lng", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then queries for it with lat/lng", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const latitude = -10613206;
      const longitude = 2301056;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // query for minted GeoNFT with lat/lng
      const tokensQuery = await sdRegistry.queryGeoNFTsByLatLng(
        latitude,
        longitude
      );
      expect(tokensQuery.length).to.equal(1);
    });
  });

  describe("query geonfts by bounding box", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then queries for it by bounding box", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const minLatitude = -10613206;
      const minLongitude = 2301056;
      const maxLatitude = -10613205;
      const maxLongitude = 2301057;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // query for minted GeoNFT with bounding box
      const tokensQuery = await sdRegistry.queryGeoNFTsByBoundingBox(
        minLatitude,
        minLongitude,
        maxLatitude,
        maxLongitude
      );
      expect(tokensQuery.length).to.equal(1);
    });
  });

  describe("geohash registry", async () => {
    const geohash1 = "d6nuzk8c";
    const geohash2 = "d6nuzk8d";
    const tokenId1 = 42; // Simulates GeoNFT ID
    const tokenId2 = 676; // Simulates GeoNFT ID

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

      await sdRegistry.add(geohash1, tokenId1);

      // Node array of all geohash subhashe's tree
      const nodes = await Promise.all(
        Array.from({ length: geohash1.length }).map((_, i) => {
          const subhash = geohash1.slice(0, i + 1);
          return sdRegistry.get(subhash);
        })
      );

      // Get first value of each subhash array and check it's the expected value
      nodes.forEach((node) => {
        expect(node[0]).to.equal(tokenId1);
      });
    });
    it("add two nfts to same geohash", async () => {
      await sdRegistry.add(geohash1, tokenId1);

      // add a node to the tree
      await sdRegistry.add(geohash1, tokenId2);

      const node = await sdRegistry.get(geohash1);

      expect(node.length).to.equal(2);
      expect(node[0]).to.equal(tokenId1);
      expect(node[1]).to.equal(tokenId2);
    });
    it("add the same nft to same geohash", async () => {
      await sdRegistry.add(geohash1, tokenId1);

      // add a node to the tree
      await sdRegistry.add(geohash1, tokenId1);

      const node = await sdRegistry.get(geohash1);

      expect(node.length).to.equal(1);
      expect(node[0]).to.equal(tokenId1);
    });
    it("update geohash", async () => {
      await sdRegistry.add(geohash1, tokenId1);

      const node = await sdRegistry.get(geohash1);
      expect(node.length).to.equal(1);

      // update geohash from geohash1 (d6nuzk8c) to geohash2 (d6nuzk8d) for tokenId1 (42)
      const formerGeohash = geohash1;
      const newGeohash = geohash2;
      await sdRegistry.update(formerGeohash, newGeohash, tokenId1);

      const formerNode = await sdRegistry.get(geohash1);
      expect(formerNode.length).to.equal(0);

      const newNode = await sdRegistry.get(geohash2);
      expect(newNode.length).to.equal(1);
    });
    it("remove data from node with geohash", async () => {
      await sdRegistry.add(geohash1, tokenId1);

      const node = await sdRegistry.get(geohash1);
      expect(node.length).to.equal(1);

      // remove tokenId1 (42) from geohash d6nuzk8c
      await sdRegistry.remove(geohash1, tokenId1);

      const formerNode = await sdRegistry.get(geohash1);
      expect(formerNode.length).to.equal(0);
    });
    it("remove data from geohash with two items", async () => {
      await sdRegistry.add(geohash1, tokenId1);
      await sdRegistry.add(geohash1, tokenId2);

      const node = await sdRegistry.get(geohash1);
      expect(node.length).to.equal(2);

      // remove tokenId1 from geohash d6nuzk8c
      await sdRegistry.remove(geohash1, tokenId1);

      const formerNode = await sdRegistry.get(geohash1);
      expect(formerNode.length).to.equal(1);
    });
    it("try to remove data from geohash that hasn't been added", async () => {
      await sdRegistry.add(geohash1, tokenId1);

      const node = await sdRegistry.get(geohash1);
      expect(node.length).to.equal(1);

      // remove tokenId2 (676) from geohash d6nuzk8c
      await sdRegistry.remove(geohash1, tokenId2);

      const formerNode = await sdRegistry.get(geohash1);
      expect(formerNode.length).to.equal(1);
    });
  });

  describe("geohash searching", async () => {
    it("find data of multiple geohashes at different levels", async () => {
      const geohash1 = "gc7j98fg";
      const geohash2 = "gc7j98fj";
      const geohash3 = "gc7j98k3";
      const tokenId1 = 22;
      const tokenId2 = 33;
      const tokenId3 = 44;

      /**
       * Level 6                   gc7j98
       *                          /      \
       * Level 7            gc7j98f       gc7j98k
       *                   /      \             \
       * Level 8    gc7j98fg     gc7j98fj       gc7j98k3
       *             [22]          [33]           [44]
       */
      await Promise.all([
        sdRegistry.add(geohash1, tokenId1),
        sdRegistry.add(geohash2, tokenId2),
        sdRegistry.add(geohash3, tokenId3),
      ]);

      const subhashLevel7 = geohash1.slice(0, 7);
      const subhashLevel6 = geohash1.slice(0, 6);
      const [resultLevel7BigNumber, resultLevel6BigNumber] = await Promise.all([
        sdRegistry.get(subhashLevel7),
        sdRegistry.get(subhashLevel6),
      ]);

      // Transform from Big Number values to integer values
      const resultLevel7 = resultLevel7BigNumber.map((value) =>
        value.toNumber()
      );
      const resultLevel6 = resultLevel6BigNumber.map((value) =>
        value.toNumber()
      );

      // Geohash gc7j98f groups geohash1 and geohash2, so its data is -> [tokenId1, tokenId2]
      expect(resultLevel7).deep.equal([tokenId1, tokenId2]);
      // Geohash gc7j98 groups geohash1, geohash2 and geohash3, so its data is -> [tokenId1, tokenId2, tokenId3]
      expect(resultLevel6).deep.equal([tokenId1, tokenId2, tokenId3]);
    });
  });
});
