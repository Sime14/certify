import { ethers } from "ethers";

let provider;
let signer;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // Browser environment with MetaMask
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = provider.getSigner();
} else {
  // Server environment or no MetaMask
  provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
}

export default provider;

export const getContract = (abi, address) => {
  return new ethers.Contract(address, abi, provider);
};

export const getContractWithSigner = (abi, address) => {
  if (signer) {
    return new ethers.Contract(address, abi, signer);
  }
  return getContract(abi, address);
};

export const getAccounts = async () => {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    return await window.ethereum.request({ method: "eth_requestAccounts" });
  }
  return await provider.listAccounts();
};

export const getSigner = () => signer;
export const getProvider = () => provider;
