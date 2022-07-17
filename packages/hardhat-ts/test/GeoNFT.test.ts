import { ethers } from "hardhat";
import chai from "chai";
// eslint-disable-next-line camelcase, node/no-missing-import, node/no-unpublished-import
import { GeoNFT__factory, GeoNFT } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const { expect } = chai;

let geonft: GeoNFT;
// eslint-disable-next-line camelcase
let geonftFactory: GeoNFT__factory;
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
            [-68.8906744122505, 12.147418397582491],
            [-68.8907468318939, 12.147347599447487],
            [-68.8907213509083, 12.14723615790054],
            [-68.8905939459801, 12.147198136656193],
            [-68.89051884412766, 12.147280734524921],
            [-68.89055103063583, 12.147379065287602],
            [-68.8906744122505, 12.147418397582491],
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
            [-68.8905443251133, 12.147381687440772],
            [-68.89051616191864, 12.147279423447841],
            [-68.89041021466255, 12.147224358204612],
            [-68.8903096318245, 12.147300400680368],
            [-68.8903257250786, 12.147409220047532],
            [-68.8904584944248, 12.147449863414236],
            [-68.8905443251133, 12.147381687440772],
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
            [-68.8901272416115, 12.147367265597998],
            [-68.89017820358276, 12.147195514501217],
            [-68.8900186121464, 12.147116849839737],
            [-68.8899327814579, 12.147217802817746],
            [-68.8899743556976, 12.147334488679682],
            [-68.8901272416115, 12.147367265597998],
          ],
        ],
      },
    },
  ],
};

const GEOJSON2 = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-68.8906744122505, 12.147418397582491],
            [-68.8907468318939, 12.147347599447487],
            [-68.8907213509083, 12.14723615790054],
            [-68.8905939459801, 12.147198136656193],
            [-68.89051884412766, 12.147280734524921],
            [-68.89055103063583, 12.147379065287602],
            [-68.8906744122505, 12.147418397582491],
          ],
        ],
      },
    },
  ],
};

describe("geonft", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();
    geonftFactory = (await ethers.getContractFactory(
      "GeoNFT",
      deployer
    )) as GeoNFT__factory; // eslint-disable-line camelcase

    geonft = (await geonftFactory.deploy()) as GeoNFT;
  });

  describe("deployment", async () => {
    it("deployer is owner", async () => {
      expect(await geonft.owner()).to.equal(deployer.address);
    });

    it("has expected name and symbol", async function () {
      expect(await geonft.name()).to.equal("GEONFT Minter");
      expect(await geonft.symbol()).to.equal("GEONFT");
    });
  });

  describe("minting", async () => {
    it("contract owner can mint tokens to other", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
      expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);

      const tokens = await geonft.getTokensByOwner(other.address);
      const { 0: tokenIds } = tokens;

      expect(tokenIds[0]).to.equal(0);
    });

    it("other accounts can mint tokens to themselves", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      await expect(
        geonft
          .connect(other)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
      expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });

  describe("update on-chain data", async () => {
    it("update Token URI", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const tokenURIUpdate = "0 update";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await geonft.setTokenURI(tokenId, tokenURIUpdate);
      expect(await geonft.tokenURI(tokenId)).to.be.equal(tokenURIUpdate);
    });

    it("update GeoJSON", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await geonft.setGeoJson(tokenId, GEOJSON2.toString());
      expect(await geonft.geoJson(tokenId)).to.be.equal(GEOJSON2.toString());
    });

    it("update index value", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const indexValueDefault = 0;
      const indexValueUpdate = 10;

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);
      expect(await geonft.indexValue(tokenId)).to.be.equal(indexValueDefault);

      await geonft.setIndexValue(tokenId, indexValueUpdate);
      expect(await geonft.indexValue(tokenId)).to.be.equal(indexValueUpdate);
    });

    it("update index type", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const indexTypeDefault = "area_m2";
      const indexTypeUpdate = "ecologicalindex_percent";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, tokenURI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);
      expect(await geonft.indexType(tokenId)).to.be.equal(indexTypeDefault);

      await geonft.setIndexType(tokenId, indexTypeUpdate);
      expect(await geonft.indexType(tokenId)).to.be.equal(indexTypeUpdate);
    });
  });

  describe("get tokens for address", async () => {
    it("contract owner mints three tokens, burns the second one", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";
      const token1URI = "1";
      const token2URI = "2";
      const token3URI = "3";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(deployer.address, token0URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId);

      await expect(
        geonft
          .connect(deployer)
          .safeMint(deployer.address, token1URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(1));

      await expect(
        geonft
          .connect(deployer)
          .safeMint(deployer.address, token2URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(2));

      expect(await geonft.balanceOf(deployer.address)).to.equal(3);

      // burn token 1
      await expect(geonft.connect(deployer).burn(1))
        .to.emit(geonft, "Transfer")
        .withArgs(deployer.address, ZERO_ADDRESS, 1);

      const tokens = await geonft.getTokensByOwner(deployer.address);
      const { 0: tokenIds, 1: uris } = tokens;
      expect(tokenIds.length).to.equal(2);
      expect(tokenIds[0]).to.equal(0);
      expect(tokenIds[1]).to.equal(2);

      expect(uris[0]).to.equal(token0URI);
      expect(uris[1]).to.equal(token2URI);

      await expect(
        geonft
          .connect(other)
          .safeMint(other.address, token3URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId.add(3));

      const alltokens = await geonft.getAllTokens();
      expect(alltokens.length).to.equal(3);
    });
  });

  describe("burning", async () => {
    it("holders can burn their tokens", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, token0URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await expect(geonft.connect(other).burn(tokenId))
        .to.emit(geonft, "Transfer")
        .withArgs(other.address, ZERO_ADDRESS, tokenId);
      expect(await geonft.balanceOf(other.address)).to.equal(0);
      await expect(geonft.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721: owner query for nonexistent token"
      );
      expect(await geonft.totalSupply()).to.equal(0);

      const tokens = await geonft.getTokensByOwner(deployer.address);
      const { 0: tokenIds } = tokens;
      expect(tokenIds.length).to.equal(0);
    });

    it("cannot burn if not token owner", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";

      await expect(
        geonft
          .connect(deployer)
          .safeMint(other.address, token0URI, GEOJSON.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await expect(geonft.connect(deployer).burn(tokenId)).to.be.revertedWith(
        "ERC721Burnable: caller is not owner nor approved"
      );

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.totalSupply()).to.equal(1);
    });
  });

  describe("supports interfaces", async () => {
    it("supports ERC721", async function () {
      expect(await geonft.supportsInterface("0x80ac58cd")).to.equal(true);
    });
  });
});
