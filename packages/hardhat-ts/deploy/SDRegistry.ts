import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await getNamedAccounts();

  const geoNFTDeployment = await get('GeoNFT');

  // the following will only deploy "GenericMetaTxProcessor" if the contract was never deployed or if the code changed since last deployment
  const deployResult = await deploy("SDRegistry", {
    from: deployer,
    // gas: 4000000,
    args: [
        geoNFTDeployment.address,
    ],
  });

  // get address from the deployed SD Registry contract
  const sdRegistryAddress = deployResult.address;
  console.log('SD Registry contract address:', sdRegistryAddress);

  console.log(`GeoNFT contract address: ${geoNFTDeployment.address}`);
};
export default func;
func.runAtTheEnd = true;
