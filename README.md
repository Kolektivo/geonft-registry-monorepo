# Kolektivo GeoNFT Registry Monorepo

## Overview

The Kolektivo GeoNFT Registry module will power the minting, deploy, contract interactions and listing of the GeoNFT (Geospatial Non-fungible Token). GeoNFTs are ERC-1155 tokens that corresponds topological data of real world areas.

GeoNFT are at the heart of Kolektivo’s approach to ecological assets aiming to provide a faithful digital twin of the underlying physical reality. A GeoNFT consists of topological data defined with points, polygonal chains and areas. It includes a centralized or decentralized identifier (CID/DID) pointing to a datastore of the ecological state data for its constituent territory.

GeoNFT borders can be computationally defined — e.g., the boundary of an area of a certain level of forestation — or manually determined through the local governance of a geographic expert.

Following from the GeoNFT are ecological tokens: fungible ERC20 tokens split from the GeoNFT through a process known as *fractionalization* — the act of dividing a NFT into multiple fractions, or shards. These ecological tokens can be both:

- **Collateral** in local reserves, such as the Kolektivo Curaçao Reserve for community currency production, or global reserves, such as the Celo Reserve ****for Celo stablecoin production.
- **Treasury assets**, materially backing the wealth of the Kolektivo Network and KTT to seed new community economies all around the world.

Beyond their role as collateral and treasury assets, though, there are four means of monetizing and binding ecological assets to our underlying material reality: as **datatokens, outputs-rights tokens, insurance tokens, and ownership tokens**.

To learn more about GeoNFT please refer to:

- The **Kolektivo Framework Bluepaper**, available [here](https://assets.website-files.com/5fcaa3a6fcb269f7778d1f87/6319a99a8861af08a497e3a9_Kolektivo%20Bluepaper.pdf).
- The **Kolektivo Framework Whitepaper**, available [here](https://github.com/Curve-Labs/Kolektivo/blob/main/The%20Kolektivo%20Framework%20Whitepaper%20v.3.pdf).

This `geonft-registry-monorepo` repository pertains to all things related to GeoNFT within the Kolektivo Framework.

This repository is organized as a [monorepo](https://monorepo.tools/), a single repository containing multiple distinct code bases, with well-defined relationships.

This monorepo has three main packages whose function can be summarized as follows:

- [hardhat-ts](https://github.com/Kolektivo/geonft-registry-monorepo/tree/main/packages/hardhat-ts): a hardhat typescript project
    - runs and deploys the GeoNFT and Registry contracts to a local node
        - The function of the registry is twofold:
            - provide a list of "approved" GeoNFTs
            - geospatial searching
    - deploys contracts to Alfajores testnet
    - deploys contracts to Celo mainnet
- [dapp](https://github.com/Kolektivo/geonft-registry-monorepo/tree/main/packages/dapp) (TODO): an Aurelia web application
    - allows anyone to mint a GeoNFT
    - IPFS for metadata
    - display map of GeoNFTs (registered and un-registered)
    - adds a Ceramic document
    - uses wallet mock to test in Jest
- [subgraph](https://github.com/Kolektivo/geonft-registry-monorepo/tree/main/packages/subgraph) (TODO): deploys a subgraph to The Graph
    - lists all GeoNFTs

## Development

### Prerequisites

Yarn package manager

### Install

```
git clone <https://github.com/Kolektivo/geonft-registry-monorepo.git>
cd geonft-registry-monorepo
yarn install
```

### Setup .env file for dapp

Create an Infura Account and an Infura project with IPFS Service, copy `packages/dapp/.env.sample` to `packages/dapp/.env` and fill in the following fields:

PROJECT_ID=

PROJECT_SECRET=

### Setup Metamask

To run locally, create a new profile in Chrome and open the Metamask plugin.

Import the test seed phrase: `test test test test test test test test test test test junk`

Under `Networks` click `Show/hide test networks`

Open Metamask `Settings`, `Networks`, and select `Localhost 8545`. Set chainId to `31337`

Select `Localhost 8545` network.

Notice: when running a Localhost node, you may receive this error: `Nonce too high. Expected nonce to be 1 but got N. Note that transactions can't be queued when automining.` As a fix, go to `Settings`, `Advanced`, and click `Reset Account`.

## Run

### Hardhat Local Node

Open a terminal and run `**yarn hardhat:localnode**`

### Run dapp

TODO

### Wallet

1. Select Metamask and connect with the localhost node.
2. Select WalletConnect and scan the QR Code with your Alfajores wallet.

## Available Scripts

In the project directory, you can run:

### dapp

`**yarn dapp:start**`

hardhat-ts

`**yarn hardhat:test**`

Run the tests in the test directory

`**yarn hardhat:watch**`

Starts a local node, deploys contracts, updates the deployments/localhost folder with contract address and abi.

On contract update, will redeploy contract and update deployments folder.

`**yarn hardhat:deployalfa**`

Deploys the contract to Alfajores and records the address in the deployments/alfajores directory

`**yarn hardhat:deploycelo**`

Deploys the contract to Celo and records the address in the deployments/celo directory