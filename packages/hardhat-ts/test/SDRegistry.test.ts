import { ethers } from "hardhat";
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
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ContractReceipt, ContractTransaction } from "ethers";

const { expect } = chai;

let sdRegistry: SDRegistry;
let geoNFT: GeoNFT;
// eslint-disable-next-line camelcase
let geoNFTFactory: GeoNFT__factory;
// eslint-disable-next-line camelcase
let sdRegistryFactory: SDRegistry__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-428.8906744122505, 12.147418397582491],
            [-428.8907468318939, 12.147347599447487],
            [-428.8907213509083, 12.14723615790054],
            [-428.8905939459801, 12.147198136656193],
            [-428.89051884412766, 12.147280734524921],
            [-428.89055103063583, 12.147379065287602],
            [-428.8906744122505, 12.147418397582491],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-428.8905443251133, 12.147381687440772],
            [-428.89051616191864, 12.147279423447841],
            [-428.89041021466255, 12.147224358204612],
            [-428.8903096318245, 12.147300400680368],
            [-428.8903257250786, 12.147409220047532],
            [-428.8904584944248, 12.147449863414236],
            [-428.8905443251133, 12.147381687440772],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-428.8901272416115, 12.147367265597998],
            [-428.89017820358276, 12.147195514501217],
            [-428.8900186121464, 12.147116849839737],
            [-428.8899327814579, 12.147217802817746],
            [-428.8899743556976, 12.147334488679682],
            [-428.8901272416115, 12.147367265597998],
          ],
        ],
      },
    },
  ],
};

describe("registry", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();
    geoNFTFactory = (await ethers.getContractFactory(
      "GeoNFT",
      deployer
    )) as GeoNFT__factory; // eslint-disable-line camelcase
    geoNFT = (await geoNFTFactory.deploy()) as GeoNFT;

    sdRegistryFactory = (await ethers.getContractFactory(
      "SDRegistry",
      deployer
    )) as SDRegistry__factory; // eslint-disable-line camelcase
    sdRegistry = (await sdRegistryFactory.deploy(geoNFT.address)) as SDRegistry;
  });

  describe("deployment", async () => {
    it("deployer is owner", async () => {
      expect(await geoNFT.owner()).to.equal(deployer.address);
      expect(await sdRegistry.owner()).to.equal(deployer.address);
    });
  });

  describe("register geonft", async () => {
    it("contract owner can mint tokens to other", async () => {
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
        .registerGeoNFT(tokenId, GEOJSON.toString());
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
});
