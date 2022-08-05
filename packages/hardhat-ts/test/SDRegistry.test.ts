import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import chai from "chai";
import {
  GeoNFT,
  SDRegistry,
  AreaCalculation,
  // eslint-disable-next-line node/no-missing-import, node/no-unpublished-import
} from "../typechain";
import {
  transformSolidityGeoJSON,
  solidityCoordinate,
  isPolygonType,
  // eslint-disable-next-line node/no-missing-import
} from "../utils/geomUtils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  GEOJSON1,
  GEOJSON2,
  GEOJSON2_CLOCKWISE,
  GEOJSON3_MULTIPOLYGON,
  GEOJSON3_POLYGON,
  // eslint-disable-next-line node/no-missing-import
} from "./mockData";

const { expect } = chai;

let sdRegistry: SDRegistry;
let geoNFT: GeoNFT;
let areaCalculation: AreaCalculation;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("registry", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();

    // Libraries
    const trigonometryFactory = await ethers.getContractFactory("Trigonometry");
    const trigonometry = await trigonometryFactory.deploy();

    const areaFactory = await ethers.getContractFactory("AreaCalculation", {
      libraries: {
        Trigonometry: trigonometry.address,
      },
    });
    areaCalculation = (await areaFactory.deploy()) as AreaCalculation;

    // Contracts
    const geoNFTFactory = await ethers.getContractFactory("GeoNFT", deployer);
    geoNFT = (await geoNFTFactory.deploy()) as GeoNFT;

    const sdRegistryFactory = await ethers.getContractFactory("SDRegistry", {
      libraries: {
        AreaCalculation: areaCalculation.address,
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
        geoNFT
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
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
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
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
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
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
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
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
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
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
        [-68.890674, 12.147418],
        [-68.890746, 12.147347],
        [-68.890721, 12.147236],
        [-68.890593, 12.147198],
        [-68.890518, 12.14728],
        [-68.890551, 12.147379],
        [-68.890674, 12.147418],
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        solidityCoordinate(x[0]),
        solidityCoordinate(x[1]),
      ]);
      const isPolygon = await areaCalculation
        .connect(deployer)
        .isPolygon(polygonInt);
      expect(isPolygon).to.equal(true);
    });

    it("test isPolygon false", async () => {
      const polygon = [
        [-68.890674, 12.147418],
        [-68.890746, 12.147347],
        [-68.890721, 12.147236],
        [-68.890593, 12.147198],
        [-68.890518, 12.14728],
        [-68.890551, 12.147379],
        [-68.890674, 12.147417], // should match first point
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        solidityCoordinate(x[0]),
        solidityCoordinate(x[1]),
      ]);
      const isPolygon = await areaCalculation
        .connect(deployer)
        .isPolygon(polygonInt);
      expect(isPolygon).to.equal(false);
    });

    it("elliptical area of polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[0]; // Curazao

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(451167820); // In square meters (m2)
    });

    it("elliptical area of small polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[7];

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(27172); // In square meters (m2)
    });

    it("elliptical area of small food forest", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON2);

      const feature = geojsonSol.features[0];

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(417); // In square meters (m2)
    });

    it("elliptical area of multipart polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[5]; // Splitted geometry

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);
      const area =
        feature.geometry.type === "Polygon"
          ? await contract.polygonArea(coordinates as BigNumber[][][])
          : await contract.multiPolygonArea(coordinates as BigNumber[][][][]);

      expect(area).to.equal(5376806769293); // In square meters (m2)
    });

    it("area is equal on polygon and multipolygon format", async () => {
      const geojsonSolSinglePolygon =
        transformSolidityGeoJSON(GEOJSON3_POLYGON);
      const geojsonSolMultipolygon = transformSolidityGeoJSON(
        GEOJSON3_MULTIPOLYGON
      );

      const featureIndex = 0;
      const featureSingle = geojsonSolSinglePolygon.features[featureIndex];
      const featureMulti = geojsonSolMultipolygon.features[featureIndex];

      if (
        !isPolygonType(featureSingle.geometry) ||
        !isPolygonType(featureMulti.geometry)
      ) {
        throw new Error(`
          Geometry type invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinatesSingle = featureSingle.geometry.coordinates;
      const coordinatesMulti = featureMulti.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);

      const areas = await Promise.all([
        contract.polygonArea(coordinatesSingle as BigNumber[][][]),
        contract.multiPolygonArea(coordinatesMulti as BigNumber[][][][]),
      ]);

      const [areaSingle, areaMulti] = areas;
      expect(areaSingle).to.equal(areaMulti).to.equal(451167820); // In square meters (m2)
    });

    it("area is equal on clockwise and counter-clockwise direction", async () => {
      // CCW -> Counter clockwise (default)
      // CW  -> Clockwise
      const geojsonSolCCW = transformSolidityGeoJSON(GEOJSON2);
      const geojsonSolCW = transformSolidityGeoJSON(GEOJSON2_CLOCKWISE);

      const featureIndex = 0;
      const featureCCW = geojsonSolCCW.features[featureIndex];
      const featureCW = geojsonSolCW.features[featureIndex];

      if (
        !isPolygonType(featureCCW.geometry) ||
        !isPolygonType(featureCW.geometry)
      ) {
        throw new Error(`
          Geometry type invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinatesCCW = featureCCW.geometry.coordinates;
      const coordinatesCW = featureCW.geometry.coordinates;
      const contract = areaCalculation.connect(deployer);

      const areaCCWPromise =
        featureCCW.geometry.type === "Polygon"
          ? contract.polygonArea(coordinatesCCW as BigNumber[][][])
          : contract.multiPolygonArea(coordinatesCCW as BigNumber[][][][]);

      const areaCWPromise =
        featureCW.geometry.type === "Polygon"
          ? contract.polygonArea(coordinatesCW as BigNumber[][][])
          : contract.multiPolygonArea(coordinatesCW as BigNumber[][][][]);

      const areas = await Promise.all([areaCCWPromise, areaCWPromise]);
      const [areaCCW, areaCW] = areas;

      expect(areaCCW).to.equal(areaCW).to.equal(417); // In square meters (m2)
    });

    it("elliptical area sum of GeoJSON", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      // Array with the area of every feature
      const featureAreas = await Promise.all(
        geojsonSol.features.map((feature) => {
          if (!isPolygonType(feature.geometry)) {
            throw new Error(`
            Geometry type '${feature.geometry.type}' invalid.
            Value must be 'Polygon' or 'MultiPolygon'.
          `);
          }

          const coordinates = feature.geometry.coordinates;
          const contract = areaCalculation.connect(deployer);
          return feature.geometry.type === "Polygon"
            ? contract.polygonArea(coordinates as BigNumber[][][])
            : contract.multiPolygonArea(coordinates as BigNumber[][][][]);
        })
      );

      // Sum the area of all the features
      const totalArea = featureAreas.reduce((a, b) => a + b.toNumber(), 0);
      expect(totalArea).to.equal(10276251371240); // In square meters (m2)
    });
  });
});
