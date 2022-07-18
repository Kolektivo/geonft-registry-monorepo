import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import chai from "chai";
import {
  // eslint-disable-next-line camelcase
  GeoNFT__factory,
  GeoNFT,
  // eslint-disable-next-line camelcase
  SDRegistry__factory,
  SDRegistry,
  // eslint-disable-next-line node/no-missing-import, node/no-unpublished-import
} from "../typechain";
// eslint-disable-next-line node/no-missing-import
import { transformSolidityGeoJSON, isPolygon } from "../utils/geomUtils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// eslint-disable-next-line node/no-missing-import
import { GEOJSON, GEOJSON2, GEOJSON3 } from "./SDRegistry.mock";

const { expect } = chai;

let sdRegistry: SDRegistry;
let geoNFT: GeoNFT;
// eslint-disable-next-line camelcase
let geoNFTFactory: GeoNFT__factory;
// eslint-disable-next-line camelcase
let trigonometryFactory: any;
// eslint-disable-next-line camelcase
let sdRegistryFactory: SDRegistry__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("registry", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();
    geoNFTFactory = (await ethers.getContractFactory(
      "GeoNFT",
      deployer
    )) as GeoNFT__factory; // eslint-disable-line camelcase
    geoNFT = (await geoNFTFactory.deploy()) as GeoNFT;

    trigonometryFactory = await ethers.getContractFactory("Trigonometry");
    const trigonometryObj = await trigonometryFactory.deploy();

    sdRegistryFactory = (await ethers.getContractFactory("SDRegistry", {
      libraries: {
        Trigonometry: trigonometryObj.address,
      },
    })) as SDRegistry__factory; // eslint-disable-line camelcase
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .registerGeoNFT(tokenId);
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get calculated area from spatial data registry
      const calculatedArea = registerReceipt.events![0].args![2];
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .registerGeoNFT(tokenId);
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // unregister minted GeoNFT with Spatial Data Registry
      const unregisterTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .unregisterGeoNFT(tokenId);
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      await sdRegistry.connect(deployer).registerGeoNFT(tokenId);

      // update geoJson on minted GeoNFT
      await geoNFT.setGeoJson(tokenId, GEOJSON2.toString());

      const updateTopologyTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .updateGeoNFTTopology(tokenId);
      const updateTopologyReceipt: ContractReceipt =
        await updateTopologyTX.wait();

      // get calculated area from spatial data registry
      const calculatedArea = updateTopologyReceipt.events![0].args![2];
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .registerGeoNFT(tokenId);
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry
        .connect(deployer)
        .registerGeoNFT(tokenId);
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

  describe("calculate area", async () => {
    it("test isPolygon true", async () => {
      const polygon = [
        [-428.890674, 12.147418],
        [-428.890746, 12.147347],
        [-428.890721, 12.147236],
        [-428.890593, 12.147198],
        [-428.890518, 12.14728],
        [-428.890551, 12.147379],
        [-428.890674, 12.147418],
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        ethers.BigNumber.from(x[0] * 10 ** 6),
        ethers.BigNumber.from(x[1] * 10 ** 6),
      ]);
      const isPolygon = await sdRegistry
        .connect(deployer)
        .isPolygon(polygonInt);
      expect(isPolygon).to.equal(true);
    });

    it("test isPolygon false", async () => {
      const polygon = [
        [-428.890674, 12.147418],
        [-428.890746, 12.147347],
        [-428.890721, 12.147236],
        [-428.890593, 12.147198],
        [-428.890518, 12.14728],
        [-428.890551, 12.147379],
        [-428.890674, 12.147417], // should match first point
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        ethers.BigNumber.from(x[0] * 10 ** 6),
        ethers.BigNumber.from(x[1] * 10 ** 6),
      ]);
      const isPolygon = await sdRegistry
        .connect(deployer)
        .isPolygon(polygonInt);
      expect(isPolygon).to.equal(false);
    });

    it("area", async () => {
      const polygon = [
        [-428.890674, 12.147418],
        [-428.890746, 12.147347],
        [-428.890721, 12.147236],
        [-428.890593, 12.147198],
        [-428.890518, 12.14728],
        [-428.890551, 12.147379],
        [-428.890674, 12.147418],
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        ethers.BigNumber.from(x[0] * 10 ** 6), // 428.890674 > 428890674
        ethers.BigNumber.from(x[1] * 10 ** 6),
      ]);
      const area = await sdRegistry.connect(deployer).area(polygonInt);
      expect(area).to.equal(34440);
    });

    it("elliptical area of polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3);

      const feature = geojsonSol.features[0]; // Curazao

      if (!isPolygon(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = sdRegistry.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(451167821); // In square meters (m2)
    });

    it("elliptical area of small polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3);

      const feature = geojsonSol.features[7]; // Small area - it gives 0

      if (!isPolygon(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = sdRegistry.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(27172); // In square meters (m2)
    });

    it("elliptical area sum of GeoJSON", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3);

      // Array with the area of every feature
      const featureAreas = await Promise.all(
        geojsonSol.features.map((feature) => {
          if (!isPolygon(feature.geometry)) {
            throw new Error(`
            Geometry type '${feature.geometry.type}' invalid.
            Value must be 'Polygon' or 'MultiPolygon'.
          `);
          }

          const coordinates = feature.geometry.coordinates;
          const contract = sdRegistry.connect(deployer);
          return feature.geometry.type === "Polygon"
            ? contract.polygonArea(coordinates as BigNumber[][][])
            : contract.multiPolygonArea(coordinates as BigNumber[][][][]);
        })
      );

      const totalArea = featureAreas.reduce((a, b) => a + b.toNumber(), 0);
      expect(totalArea).to.equal(10276251371259); // In square meters (m2)
    });
  });
});
