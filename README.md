# Kolektivo GeoNFT Registry Monorepo

Monorepo with three packages:

- hardhat-ts: a hardhat typescript project
  - runs and deploys the GeoNFT and Registry contracts to a local node
  - deploys contracts to Alfajores testnet
  - deploys contracts to Celo mainnet
- dapp (TODO): an Aurelia web application
  - allows anyone to mint a GeoNFT
  - IPFS for metadata
  - display map of GeoNFTs (registered and un-registered)
  - adds a Ceramic document
  - uses wallet mock to test in Jest
- subgraph (TODO): deploys a subgraph to The Graph
  - lists all GeoNFTs

## Requirements

Yarn

## Install

```bash
git clone https://github.com/Kolektivo/geonft-registry-monorepo.git
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

Open a terminal and run `yarn hardhat:localnode`

### Run dapp

TODO

### Wallet

1) Select Metamask and connect with the localhost node.
2) Select WalletConnect and scan the QR Code with your Alfajores wallet.

## Available Scripts

In the project directory, you can run:

### dapp

#### `yarn dapp:start`

### hardhat-ts

#### `yarn hardhat:test`

Run the tests in the test directory

#### `yarn hardhat:watch`

Starts a local node, deploys contracts, updates the deployments/localhost folder with contract address and abi.

On contract update, will redeploy contract and update deployments folder.

#### `yarn hardhat:deployalfa`

Deploys the contract to Alfajores and records the address in the deployments/alfajores directory

#### `yarn hardhat:deploycelo`

Deploys the contract to Celo and records the address in the deployments/celo directory
