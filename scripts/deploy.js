const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerifier contract...");

  const CertificateVerifier = await hre.ethers.getContractFactory(
    "CertificateVerifier"
  );
  const certificateVerifier = await CertificateVerifier.deploy();

  await certificateVerifier.waitForDeployment();

  const address = await certificateVerifier.getAddress();
  console.log(`CertificateVerifier deployed to: ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
