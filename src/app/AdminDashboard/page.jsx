"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaCertificate,
  FaTimes,
  FaWallet,
  FaChartBar,
  FaClock,
  FaEye,
  FaCopy,
  FaExternalLinkAlt,
} from "react-icons/fa";
import StarBorder from "../components/ui/StarBorder";

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [showMintCertificates, setShowMintCertificates] = useState(false);
  const [csvValidation, setCsvValidation] = useState(null);
  const [mintingProgress, setMintingProgress] = useState(null);
  const [isRecipientMode, setIsRecipientMode] = useState(false);

  // Wallet state
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Enhanced dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    totalContracts: 0,
    totalCertificates: 0,
    recentActivity: [],
  });
  const [activeTab, setActiveTab] = useState("overview");

  // Contract creation form
  const [contractForm, setContractForm] = useState({
    contractName: "",
    networkName: "apothem",
  });

  // Certificate minting form with enhanced metadata
  const [mintForm, setMintForm] = useState({
    eventName: "",
    certificateName: "",
    contractAddress: "",
    participantList: null,
    // Single recipient fields
    recipientName: "",
    recipientWallet: "",
    // Enhanced metadata fields
    description: "",
    category: "",
    rarity: "Common",
    skills: "",
    customAttributes: "",
    certificateImage: null,
    imageUrl: "",
    imageInputType: "file",
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Ensure clean state on mount - no automatic connections
  useEffect(() => {
    // Clear any wallet connection on component mount
    setWalletAddress(null);
    setContracts([]);
  }, []);

  // Add MetaMask account and network change detection
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        console.log("MetaMask accounts changed:", accounts);
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          // User switched accounts
          setWalletAddress(accounts[0]);
          setSuccess(`Switched to account: ${accounts[0].substring(0, 10)}...`);
        }
      };

      const handleChainChanged = (chainId) => {
        console.log("MetaMask network changed:", chainId);
        // Reload the page when network changes
        window.location.reload();
      };

      // Add event listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Cleanup listeners on unmount
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [walletAddress]);

  // Load contracts when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchContracts();
    }
  }, [walletAddress]);

  // Update dashboard stats when contracts change
  useEffect(() => {
    fetchDashboardStats();
  }, [contracts, walletAddress]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not detected! Please install MetaMask extension.");
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setSuccess("Wallet connected successfully!");
      }
    } catch (error) {
      setError("Failed to connect wallet: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Clear local state
    setWalletAddress(null);
    setContracts([]);
    setShowCreateContract(false);
    setShowMintCertificates(false);
    setError(null);

    // Clear any stored wallet data
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress");
      sessionStorage.removeItem("walletAddress");
    }

    // Try to disconnect from MetaMask properly
    if (window.ethereum && window.ethereum.request) {
      try {
        // Revoke permissions if supported
        window.ethereum
          .request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          })
          .catch(() => {
            // Ignore errors if not supported
          });
      } catch (error) {
        // Ignore errors
      }
    }

    // Redirect to landing page for clean reconnection
    router.push("/");
  };

  const fetchContracts = async () => {
    if (!walletAddress) {
      setContracts([]);
      return;
    }

    try {
      // Fetch contracts for the connected wallet (backend now filters by walletAddress)
      const response = await fetch(
        `${API_BASE_URL}/api/contracts/deployments?walletAddress=${walletAddress}`
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.contracts)) {
        // Backend already filters by deployer wallet address, no need for client-side filtering
        const processedContracts = data.contracts.map((contract) => ({
          address: contract.contractAddress,
          contractAddress: contract.contractAddress,
          name: contract.contractName,
          contractName: contract.contractName,
          network: contract.network,
          deployer: contract.deployer,
          owner: contract.owner,
          deployedAt: new Date(contract.deployedAt),
          transactionHash: contract.transactionHash,
          blockNumber: contract.blockNumber,
          deploymentId: contract.deploymentId,
        }));

        setContracts(processedContracts);
      } else {
        console.error("Failed to fetch contracts:", data.error);
        setContracts([]);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setContracts([]);
    }
  };

  const fetchDashboardStats = async () => {
    if (!walletAddress) {
      setDashboardStats({
        totalContracts: 0,
        totalCertificates: 0,
        recentActivity: [],
      });
      return;
    }

    try {
      // Calculate stats from existing contracts
      const totalContracts = contracts.length;
      let totalCertificates = 0;
      const recentActivity = [];

      // You could enhance this by calling backend APIs to get more detailed stats
      // For now, we'll use the contracts data we already have
      contracts.forEach((contract) => {
        if (contract.certificateCount) {
          totalCertificates += parseInt(contract.certificateCount) || 0;
        }
        recentActivity.push({
          type: "contract_deployed",
          name: contract.name || "Certificate Contract",
          address: contract.address,
          timestamp: contract.deployedAt || new Date().toISOString(),
        });
      });

      setDashboardStats({
        totalContracts,
        totalCertificates,
        recentActivity: recentActivity.slice(0, 5), // Show only recent 5 activities
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    }
  };

  const handleContractFormChange = (e) => {
    const { name, value } = e.target;
    setContractForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMintFormChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setMintForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setMintForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const deployContract = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      // Import ethers for frontend deployment
      const { ethers } = await import("ethers");

      // Contract ABI and bytecode from compiled contract
      const contractABI = [
        {
          inputs: [
            { internalType: "address", name: "initialOwner", type: "address" },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [
            { internalType: "address", name: "to", type: "address" },
            { internalType: "string", name: "uri", type: "string" },
          ],
          name: "mint",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "owner",
          outputs: [{ internalType: "address", name: "", type: "address" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            { internalType: "uint256", name: "tokenId", type: "uint256" },
          ],
          name: "tokenURI",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function",
        },
      ];

      const contractBytecode =
        "0x608060405234801561000f575f5ffd5b5060405161281e38038061281e83398181016040528101906100319190610266565b806040518060400160405280601181526020017f4576656e744365727469666963617465730000000000000000000000000000008152506040518060400160405280600481526020017f4345525400000000000000000000000000000000000000000000000000000000815250815f90816100ac91906104ce565b5080600190816100bc91906104ce565b5050505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361012f575f6040517f1e4fbdf700000000000000000000000000000000000000000000000000000000815260040161012691906105ac565b60405180910390fd5b61013e8161014560201b60201c565b50506105c5565b5f60065f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508160065f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6102358261020c565b9050919050565b6102458161022b565b811461024f575f5ffd5b50565b5f815190506102608161023c565b92915050565b5f6020828403121561027b5761027a610208565b5b5f61028884828501610252565b91505092915050565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061030c57607f821691505b60208210810361031f5761031e6102c8565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026103817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610346565b61038b8683610346565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6103cf6103ca6103c5846103a3565b6103ac565b6103a3565b9050919050565b5f819050919050565b6103e8836103b5565b6103fc6103f4826103d6565b848454610352565b825550505050565b5f5f905090565b610413610404565b61041e8184846103df565b505050565b5b81811015610441576104365f8261040b565b600181019050610424565b5050565b601f8211156104865761045781610325565b61046084610337565b8101602085101561046f578190505b61048361047b85610337565b830182610423565b50505b505050565b5f82821c905092915050565b5f6104a65f198460080261048b565b1980831691505092915050565b5f6104be8383610497565b9150826002028217905092915050565b6104d782610291565b67ffffffffffffffff8111156104f0576104ef61029b565b5b6104fa82546102f5565b610505828285610445565b5f60209050601f831160018114610536575f8415610524578287015190505b61052e85826104b3565b865550610595565b601f19841661054486610325565b5f5b8281101561056b57848901518255600182019150602085019450602081019050610546565b868310156105885784890151610584601f891682610497565b8355505b6001600288020188555050505b505050505050565b6105a68161022b565b82525050565b5f6020820190506105bf5f83018461059d565b92915050565b61224c806105d25f395ff3fe608060405234801561000f575f5ffd5b5060043610610109575f3560e01c806370a08231116100a0578063a22cb4651161006f578063a22cb465146102a1578063b88d4fde146102bd578063c87b56dd146102d9578063e985e9c514610309578063f2fde38b1461033957610109565b806370a082311461022b578063715018a61461025b5780638da5cb5b1461026557806395d89b411461028357610109565b8063095ea7b3116100dc578063095ea7b3146101a757806323b872dd146101c357806342842e0e146101df5780636352211e146101fb57610109565b806301ffc9a71461010d57806306fdde031461013d5780630712249f1461015b578063081812fc14610177575b5f5ffd5b61012760048036038101906101229190611718565b610355565b604051610134919061175d565b60405180910390f35b610145610436565b60405161015291906117e6565b60405180910390f35b6101756004803603810190610170919061198c565b6104c5565b005b610191600480360381019061018c9190611a19565b610514565b60405161019e9190611a53565b60405180910390f35b6101c160048036038101906101bc9190611a6c565b61052f565b005b6101dd60048036038101906101d89190611aaa565b610545565b005b6101f960048036038101906101f49190611aaa565b610644565b005b61021560048036038101906102109190611a19565b610663565b6040516102229190611a53565b60405180910390f35b61024560048036038101906102409190611afa565b610674565b6040516102529190611b34565b60405180910390f35b61026361072a565b005b61026d61073d565b60405161027a9190611a53565b60405180910390f35b61028b610765565b60405161029891906117e6565b60405180910390f35b6102bb60048036038101906102b69190611b77565b6107f5565b005b6102d760048036038101906102d29190611c53565b61080b565b005b6102f360048036038101906102ee9190611a19565b610830565b60405161030091906117e6565b60405180910390f35b610323600480360381019061031e9190611cd3565b610947565b604051610330919061175d565b60405180910390f35b610353600480360381019061034e9190611afa565b6109d5565b005b5f7f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916148061041f57507f5b5e139f000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916145b8061042f575061042e82610a59565b5b9050919050565b60605f805461044490611d3e565b80601f016020809104026020016040519081016040528092919081815260200182805461047090611d3e565b80156104bb5780601f10610492576101008083540402835291602001916104bb565b820191905f5260205f20905b81548152906001019060200180831161049e57829003601f168201915b5050505050905090565b6104cd610ac2565b5f60075f8154809291906104e090611d9b565b9190505590506104f08382610b49565b8160085f8381526020019081526020015f20908161050e9190611f82565b50505050565b5f61051e82610b66565b5061052882610bec565b9050919050565b610541828261053c610c25565b610c2c565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036105b5575f6040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016105ac9190611a53565b60405180910390fd5b5f6105c883836105c3610c25565b610c3e565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161461063e578382826040517f64283d7b00000000000000000000000000000000000000000000000000000000815260040161063593929190612051565b60405180910390fd5b50505050565b61065e83838360405180602001604052805f81525061080b565b505050565b5f61066d82610b66565b9050919050565b5f5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036106e5575f6040517f89c62b640000000000000000000000000000000000000000000000000000000081526004016106dc9190611a53565b60405180910390fd5b60035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b610732610ac2565b61073b5f610e49565b565b5f60065f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b60606001805461077490611d3e565b80601f01602080910402602001604051908101604052809291908181526020018280546107a090611d3e565b80156107eb5780601f106107c2576101008083540402835291602001916107eb565b820191905f5260205f20905b8154815290600101906020018083116107ce57829003601f168201915b5050505050905090565b610807610800610c25565b8383610f0c565b5050565b610816848484610545565b61082a610821610c25565b85858585611075565b50505050565b60605f73ffffffffffffffffffffffffffffffffffffffff1661085283611221565b73ffffffffffffffffffffffffffffffffffffffff16036108a8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161089f906120f6565b60405180910390fd5b60085f8381526020019081526020015f2080546108c490611d3e565b80601f01602080910402602001604051908101604052809291908181526020018280546108f090611d3e565b801561093b5780601f106109125761010080835404028352916020019161093b565b820191905f5260205f20905b81548152906001019060200180831161091e57829003601f168201915b50505050509050919050565b5f60055f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f9054906101000a900460ff16905092915050565b6109dd610ac2565b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610a4d575f6040517f1e4fbdf7000000000000000000000000000000000000000000000000000000008152600401610a449190611a53565b60405180910390fd5b610a5681610e49565b50565b5f7f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b610aca610c25565b73ffffffffffffffffffffffffffffffffffffffff16610ae861073d565b73ffffffffffffffffffffffffffffffffffffffff1614610b4757610b0b610c25565b6040517f118cdaa7000000000000000000000000000000000000000000000000000000008152600401610b3e9190611a53565b60405180910390fd5b565b610b62828260405180602001604052805f81525061125a565b5050565b5f5f610b7183611221565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610be357826040517f7e273289000000000000000000000000000000000000000000000000000000008152600401610bda9190611b34565b60405180910390fd5b80915050919050565b5f60045f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b5f33905090565b610c39838383600161127d565b505050565b5f5f610c4984611221565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614610c8a57610c8981848661143c565b5b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610d1557610cc95f855f5f61127d565b600160035f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825403925050819055505b5f73ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1614610d9457600160035f8773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8460025f8681526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b5f60065f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508160065f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610f7c57816040517f5b08ba18000000000000000000000000000000000000000000000000000000008152600401610f739190611a53565b60405180910390fd5b8060055f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f6101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3183604051611068919061175d565b60405180910390a3505050565b5f8373ffffffffffffffffffffffffffffffffffffffff163b111561121a578273ffffffffffffffffffffffffffffffffffffffff1663150b7a02868685856040518563ffffffff1660e01b81526004016110d39493929190612166565b6020604051808303815f875af192505050801561110e57506040513d601f19601f8201168201806040525081019061110b91906121c4565b60015b61118f573d805f811461113c576040519150601f19603f3d011682016040523d82523d5f602084013e611141565b606091505b505f81510361118757836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161117e9190611a53565b60405180910390fd5b805160208201fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161461121857836040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161120f9190611a53565b60405180910390fd5b505b5050505050565b5f60025f8381526020019081526020015f205f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b61126483836114ff565b61127861126f610c25565b5f858585611075565b505050565b80806112b557505f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b156113e7575f6112c484610b66565b90505f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415801561132e57508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b8015611341575061133f8184610947565b155b1561138357826040517fa9fbf51f00000000000000000000000000000000000000000000000000000000815260040161137a9190611a53565b60405180910390fd5b81156113e557838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b8360045f8581526020019081526020015f205f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b6114478383836115f2565b6114fa575f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036114bb57806040517f7e2732890000000000000000000000000000000000000000000000000000000081526004016114b29190611b34565b60405180910390fd5b81816040517f177e802f0000000000000000000000000000000000000000000000000000000081526004016114f19291906121ef565b60405180910390fd5b505050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361156f575f6040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016115669190611a53565b60405180910390fd5b5f61157b83835f610c3e565b90505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146115ed575f6040517f73c6ac6e0000000000000000000000000000000000000000000000000000000081526004016115e49190611a53565b60405180910390fd5b505050565b5f5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141580156116a957508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16148061166a57506116698484610947565b5b806116a857508273ffffffffffffffffffffffffffffffffffffffff1661169083610bec565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b5f604051905090565b5f5ffd5b5f5ffd5b5f7fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b6116f7816116c3565b8114611701575f5ffd5b50565b5f81359050611712816116ee565b92915050565b5f6020828403121561172d5761172c6116bb565b5b5f61173a84828501611704565b91505092915050565b5f8115159050919050565b61175781611743565b82525050565b5f6020820190506117705f83018461174e565b92915050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f6117b882611776565b6117c28185611780565b93506117d2818560208601611790565b6117db8161179e565b840191505092915050565b5f6020820190508181035f8301526117fe81846117ae565b905092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61182f82611806565b9050919050565b61183f81611825565b8114611849575f5ffd5b50565b5f8135905061185a81611836565b92915050565b5f5ffd5b5f5ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b61189e8261179e565b810181811067ffffffffffffffff821117156118bd576118bc611868565b5b80604052505050565b5f6118cf6116b2565b90506118db8282611895565b919050565b5f67ffffffffffffffff8211156118fa576118f9611868565b5b6119038261179e565b9050602081019050919050565b828183375f83830152505050565b5f61193061192b846118e0565b6118c6565b90508281526020810184848401111561194c5761194b611864565b5b611957848285611910565b509392505050565b5f82601f83011261197357611972611860565b5b813561198384826020860161191e565b91505092915050565b5f5f604083850312156119a2576119a16116bb565b5b5f6119af8582860161184c565b925050602083013567ffffffffffffffff8111156119d0576119cf6116bf565b5b6119dc8582860161195f565b9150509250929050565b5f819050919050565b6119f8816119e6565b8114611a02575f5ffd5b50565b5f81359050611a13816119ef565b92915050565b5f60208284031215611a2e57611a2d6116bb565b5b5f611a3b84828501611a05565b91505092915050565b611a4d81611825565b82525050565b5f602082019050611a665f830184611a44565b92915050565b5f5f60408385031215611a8257611a816116bb565b5b5f611a8f8582860161184c565b9250506020611aa085828601611a05565b9150509250929050565b5f5f5f60608486031215611ac157611ac06116bb565b5b5f611ace8682870161184c565b9350506020611adf8682870161184c565b9250506040611af086828701611a05565b9150509250925092565b5f60208284031215611b0f57611b0e6116bb565b5b5f611b1c8482850161184c565b91505092915050565b611b2e816119e6565b82525050565b5f602082019050611b475f830184611b25565b92915050565b611b5681611743565b8114611b60575f5ffd5b50565b5f81359050611b7181611b4d565b92915050565b5f5f60408385031215611b8d57611b8c6116bb565b5b5f611b9a8582860161184c565b9250506020611bab85828601611b63565b9150509250929050565b5f67ffffffffffffffff821115611bcf57611bce611868565b5b611bd88261179e565b9050602081019050919050565b5f611bf7611bf284611bb5565b6118c6565b905082815260208101848484011115611c1357611c12611864565b5b611c1e848285611910565b509392505050565b5f82601f830112611c3a57611c39611860565b5b8135611c4a848260208601611be5565b91505092915050565b5f5f5f5f60808587031215611c6b57611c6a6116bb565b5b5f611c788782880161184c565b9450506020611c898782880161184c565b9350506040611c9a87828801611a05565b925050606085013567ffffffffffffffff811115611cbb57611cba6116bf565b5b611cc787828801611c26565b91505092959194509250565b5f5f60408385031215611ce957611ce86116bb565b5b5f611cf68582860161184c565b9250506020611d078582860161184c565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680611d5557607f821691505b602082108103611d6857611d67611d11565b5b50919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f611da5826119e6565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611dd757611dd6611d6e565b5b600182019050919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302611e3e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82611e03565b611e488683611e03565b95508019841693508086168417925050509392505050565b5f819050919050565b5f611e83611e7e611e79846119e6565b611e60565b6119e6565b9050919050565b5f819050919050565b611e9c83611e69565b611eb0611ea882611e8a565b848454611e0f565b825550505050565b5f5f905090565b611ec7611eb8565b611ed2818484611e93565b505050565b5b81811015611ef557611eea5f82611ebf565b600181019050611ed8565b5050565b601f821115611f3a57611f0b81611de2565b611f1484611df4565b81016020851015611f23578190505b611f37611f2f85611df4565b830182611ed7565b50505b505050565b5f82821c905092915050565b5f611f5a5f1984600802611f3f565b1980831691505092915050565b5f611f728383611f4b565b9150826002028217905092915050565b611f8b82611776565b67ffffffffffffffff811115611fa457611fa3611868565b5b611fae8254611d3e565b611fb9828285611ef9565b5f60209050601f831160018114611fea575f8415611fd8578287015190505b611fe28582611f67565b865550612049565b601f198416611ff886611de2565b5f5b8281101561201f57848901518255600182019150602085019450602081019050611ffa565b8683101561203c5784890151612038601f891682611f4b565b8355505b6001600288020188555050505b505050505050565b5f6060820190506120645f830186611a44565b6120716020830185611b25565b61207e6040830184611a44565b949350505050565b7f4552433732313a2055524920717565727920666f72206e6f6e6578697374656e5f8201527f7420746f6b656e00000000000000000000000000000000000000000000000000602082015250565b5f6120e0602783611780565b91506120eb82612086565b604082019050919050565b5f6020820190508181035f83015261210d816120d4565b9050919050565b5f81519050919050565b5f82825260208201905092915050565b5f61213882612114565b612142818561211e565b9350612152818560208601611790565b61215b8161179e565b840191505092915050565b5f6080820190506121795f830187611a44565b6121866020830186611a44565b6121936040830185611b25565b81810360608301526121a5818461212e565b905095945050505050565b5f815190506121be816116ee565b92915050565b5f602082840312156121d9576121d86116bb565b5b5f6121e6848285016121b0565b91505092915050565b5f6040820190506122025f830185611a44565b61220f6020830184611b25565b939250505056fea26469706673582212201e10bb9eddb6b134d8980b53b8f345b050c3a6837e0ddfe86ea10ad011c5721e64736f6c634300081c0033";

      // Check if we're on the correct network (XDC Apothem = chainId 51)
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0x33") {
        // 0x33 = 51 in hex
        setError("Please switch to XDC Apothem Testnet in MetaMask");
        return;
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        contractABI,
        contractBytecode,
        signer
      );

      // Deploy contract with the connected wallet address as owner
      setSuccess(
        "Deploying contract... Please confirm the transaction in MetaMask"
      );
      const contract = await contractFactory.deploy(walletAddress);

      setSuccess("Contract deployment submitted. Waiting for confirmation...");

      // Wait for deployment
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      // Save deployment info to backend
      const deploymentInfo = {
        contractAddress: contractAddress,
        network: contractForm.networkName,
        transactionHash: contract.deploymentTransaction().hash,
        deployedAt: new Date().toISOString(),
        deployer: walletAddress,
        contractName: contractForm.contractName,
        owner: walletAddress,
      };

      // Call backend to save deployment info
      const saveResponse = await fetch(
        `${API_BASE_URL}/api/contracts/save-deployment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deploymentInfo),
        }
      );

      if (saveResponse.ok) {
        await fetchContracts(); // Refresh contracts list
        setSuccess(
          `Contract deployed successfully! Address: ${contractAddress}`
        );
        setShowCreateContract(false);
        setContractForm({
          contractName: "",
          networkName: "apothem",
        });
      } else {
        setSuccess(
          `Contract deployed at ${contractAddress}, but failed to save to database`
        );
      }
    } catch (error) {
      console.error("Contract deployment error:", error);
      if (error.code === 4001) {
        setError("Transaction rejected by user");
      } else if (error.code === -32602) {
        setError(
          "Invalid parameters. Please check your wallet and network settings."
        );
      } else {
        setError(
          "Failed to deploy contract: " + (error.reason || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const validateCsv = async (file) => {
    const formData = new FormData();
    formData.append("csvFile", file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/contracts/validate-csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      setCsvValidation(result);
      return result;
    } catch (error) {
      setCsvValidation({ error: "Failed to validate CSV file" });
      return { error: "Failed to validate CSV file" };
    }
  };

  const mintCertificates = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    setMintingProgress(null);

    // Find the selected contract to get its name
    const selectedContract = contracts.find(
      (contract) =>
        (contract.contractAddress || contract.address) ===
        mintForm.contractAddress
    );
    const contractName = selectedContract
      ? selectedContract.contractName || selectedContract.name
      : "";

    try {
      if (isRecipientMode) {
        // Single recipient minting
        if (
          !mintForm.recipientName.trim() ||
          !mintForm.recipientWallet.trim()
        ) {
          setError("Please fill in both recipient name and wallet address");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("eventName", mintForm.eventName);
        formData.append("certificateName", mintForm.certificateName);
        formData.append("contractAddress", mintForm.contractAddress);
        formData.append("contractName", contractName);
        formData.append("recipientName", mintForm.recipientName);
        formData.append("recipientWallet", mintForm.recipientWallet);
        formData.append("description", mintForm.description);
        formData.append("category", mintForm.category);
        formData.append("rarity", mintForm.rarity);
        formData.append("points", mintForm.points);
        formData.append("skills", mintForm.skills);
        formData.append("customAttributes", mintForm.customAttributes);

        if (mintForm.certificateImage) {
          formData.append("certificateImage", mintForm.certificateImage);
        }

        if (mintForm.imageUrl && mintForm.imageUrl.trim()) {
          formData.append("imageUrl", mintForm.imageUrl.trim());
        }

        // Step 1: Prepare certificate metadata
        setMintingProgress("Preparing certificate metadata...");
        const response = await fetch(
          `${API_BASE_URL}/api/contracts/prepare-single-certificate`,
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Failed to prepare certificate metadata"
          );
        }

        // Step 2: Get contract ABI
        setMintingProgress("Getting contract information...");
        const abiResponse = await fetch("/api/contracts/contract-abi");
        const abiResult = await abiResponse.json();

        if (!abiResponse.ok) {
          throw new Error("Failed to get contract ABI");
        }

        // Step 3: Mint certificate using MetaMask
        setMintingProgress("Connecting to MetaMask...");

        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }

        // Import ethers for frontend minting
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        // Verify user is connected to the correct account
        if (userAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new Error(
            `Please switch to account ${walletAddress} in MetaMask`
          );
        }

        setMintingProgress("Minting certificate on blockchain...");

        // Create contract instance
        const contract = new ethers.Contract(
          result.certificateData.contractAddress,
          abiResult.contractABI,
          signer
        );

        // Call mintCertificate function
        const tx = await contract.mintCertificate(
          result.certificateData.recipientAddress,
          result.certificateData.tokenURI
        );

        setMintingProgress("Waiting for transaction confirmation...");
        const receipt = await tx.wait();

        setSuccess(
          `Certificate minted successfully for ${mintForm.recipientName}! Transaction: ${receipt.hash}`
        );
        setShowMintCertificates(false);
        setMintForm({
          eventName: "",
          certificateName: "",
          contractAddress: "",
          participantList: null,
          recipientName: "",
          recipientWallet: "",
          description: "",
          category: "",
          rarity: "Common",
          skills: "",
          customAttributes: "",
          certificateImage: null,
          imageUrl: "",
          imageInputType: "file",
        });
      } else {
        // Bulk CSV minting using MetaMask
        if (!mintForm.participantList) {
          setError("Please upload a CSV file");
          setLoading(false);
          return;
        }

        // Check if MetaMask is available
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }

        // Check if wallet is connected
        if (!walletAddress) {
          throw new Error("Please connect your wallet first");
        }

        // Parse CSV file for participants
        const csvText = await mintForm.participantList.text();
        const Papa = (await import("papaparse")).default;

        const parseResult = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toLowerCase(),
        });

        if (parseResult.errors.length > 0) {
          throw new Error(
            "CSV parsing failed: " + parseResult.errors[0].message
          );
        }

        const participants = parseResult.data
          .map((row) => ({
            name: row.participant_name?.trim(),
            walletAddress: row.wallet_address?.trim(),
          }))
          .filter((p) => p.name && p.walletAddress);

        if (participants.length === 0) {
          throw new Error("No valid participants found in CSV");
        }

        setMintingProgress(
          `Found ${participants.length} participants. Starting minting process...`
        );

        // Import ethers for frontend minting
        const { ethers } = await import("ethers");

        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        // Verify user is connected to the correct account
        if (userAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new Error(
            `Please switch to account ${walletAddress} in MetaMask`
          );
        }

        // Get contract ABI
        const abiResponse = await fetch("/api/contracts/contract-abi");
        if (!abiResponse.ok) {
          throw new Error("Failed to get contract ABI");
        }
        const abiResult = await abiResponse.json();

        // Create contract instance
        const contract = new ethers.Contract(
          mintForm.contractAddress,
          abiResult.contractABI,
          signer
        );

        // Verify user is the contract owner
        setMintingProgress("Verifying contract ownership...");
        const contractOwner = await contract.owner();
        if (contractOwner.toLowerCase() !== userAddress.toLowerCase()) {
          throw new Error(
            `Only the contract owner (${contractOwner}) can mint certificates. Current wallet: ${userAddress}`
          );
        }

        // Process each participant
        const results = {
          successful: [],
          failed: [],
        };

        for (let i = 0; i < participants.length; i++) {
          const participant = participants[i];
          setMintingProgress(
            `Minting certificate ${i + 1}/${participants.length} for ${
              participant.name
            }...`
          );

          try {
            // Create metadata for this participant
            const metadata = {
              name: `${mintForm.certificateName}`,
              description: `Certificate for ${participant.name} for completing ${mintForm.eventName}`,
              image: null, // Will be handled by IPFS service later
              attributes: [
                {
                  trait_type: "Event",
                  value: mintForm.eventName,
                },
                {
                  trait_type: "Recipient",
                  value: participant.name,
                },
                {
                  trait_type: "Date Issued",
                  value: new Date().toISOString().split("T")[0],
                },
                {
                  trait_type: "Certificate Type",
                  value: mintForm.certificateName,
                },
                {
                  trait_type: "Category",
                  value: mintForm.category,
                },
                {
                  trait_type: "Rarity",
                  value: mintForm.rarity,
                },
                {
                  trait_type: "Points",
                  value: mintForm.points.toString(),
                },
                {
                  trait_type: "Skills",
                  value: mintForm.skills,
                },
              ],
            };

            // Create metadata URI (using data URI for now)
            const metadataString = JSON.stringify(metadata);
            const base64Metadata = btoa(metadataString);
            const tokenURI = `data:application/json;base64,${base64Metadata}`;

            // Mint certificate using MetaMask
            const tx = await contract.mintCertificate(
              participant.walletAddress,
              tokenURI
            );

            setMintingProgress(
              `Waiting for confirmation for ${participant.name}...`
            );
            const receipt = await tx.wait();

            results.successful.push({
              name: participant.name,
              walletAddress: participant.walletAddress,
              transactionHash: tx.hash,
              blockNumber: receipt.blockNumber,
            });

            console.log(
              `✅ Successfully minted certificate for ${participant.name}: ${tx.hash}`
            );
          } catch (error) {
            console.error(
              `❌ Failed to mint certificate for ${participant.name}:`,
              error
            );
            results.failed.push({
              name: participant.name,
              walletAddress: participant.walletAddress,
              error: error.message,
            });
          }

          // Small delay between transactions to avoid overwhelming the network
          if (i < participants.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // Show final results
        const successCount = results.successful.length;
        const failCount = results.failed.length;

        if (successCount > 0) {
          setSuccess(
            `Successfully minted ${successCount} certificate(s) using MetaMask! ${
              failCount > 0 ? `${failCount} failed.` : ""
            }`
          );
        } else {
          setError(
            `Failed to mint any certificates. ${failCount} failed attempts.`
          );
        }

        if (failCount > 0) {
          console.warn("Failed certificates:", results.failed);
        }

        setMintingProgress(null);
        setShowMintCertificates(false);
        setMintForm({
          eventName: "",
          certificateName: "",
          contractAddress: "",
          participantList: null,
          recipientName: "",
          recipientWallet: "",
          description: "",
          category: "",
          rarity: "Common",
          skills: "",
          customAttributes: "",
          certificateImage: null,
          imageUrl: "",
          imageInputType: "file",
        });
        setCsvValidation(null);
      }
    } catch (error) {
      setError("Failed to mint certificates: " + error.message);
      setMintingProgress(null);
    } finally {
      setLoading(false);
      setMintingProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden px-2 sm:px-4 md:px-8 py-6 sm:py-12">
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#2cf2f9]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f2cb2c]/10 rounded-full blur-3xl animate-pulse-slow" />

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 pb-4 sm:pb-6 border-b border-cyan-400/30 backdrop-blur-lg">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-[#2cf2f9] bg-clip-text text-transparent animate-glow">
          ISSUE CERTIFICATE
        </h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {walletAddress ? (
            <>
              <div className="text-right flex-1 sm:flex-none">
                <p className="text-sm sm:text-lg text-gray-400">
                  Connected Wallet
                </p>
                <p className="text-xs sm:text-sm text-[#2cf2f9] font-mono truncate">
                  {walletAddress.substring(0, 6)}...
                  {walletAddress.substring(walletAddress.length - 4)}
                </p>
              </div>
              <button
                onClick={disconnectWallet}
                className="rounded-lg bg-red-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold hover:scale-105 transition-transform flex-shrink-0"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="relative overflow-hidden rounded-xl bg-[#2cf2f9] px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_#2cf2f9] w-full sm:w-auto"
            >
              {isConnecting ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaWallet />
              )}
              <span className="ml-2">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#2cf2f9]/40 to-[#f2cb2c]/10 opacity-0 hover:opacity-100 blur-md transition-all"></div>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col items-center">
        {!walletAddress ? (
          <StarBorder className="w-full max-w-lg mx-auto">
            <div className="p-6 sm:p-8 md:p-12 flex flex-col items-center text-center">
              <FaWallet className="text-4xl sm:text-6xl text-[#2cf2f9] mb-4 sm:mb-6" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">
                Connect Your Wallet
              </h2>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                Please connect your MetaMask wallet to deploy contracts and mint
                certificates.
              </p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 rounded-lg bg-[#2cf2f9] px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-lg font-bold text-black hover:scale-105 transition-transform disabled:opacity-50 w-full sm:w-auto"
              >
                {isConnecting ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaWallet />
                )}
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </button>
            </div>
          </StarBorder>
        ) : (
          <div className="w-full">
            {/* Dashboard Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <StarBorder className="w-full">
                <div className="p-4 sm:p-6 text-center bg-black/60 backdrop-blur-md rounded-2xl border border-cyan-400/10 hover:border-[#2cf2f9] transition-all hover:shadow-[0_0_30px_#2cf2f9]/10 animate-fade-in-up">
                  <FaCertificate className="text-3xl sm:text-5xl text-[#2cf2f9] mx-auto mb-3 sm:mb-4 animate-float" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Total Contracts
                  </h3>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#2cf2f9] tracking-wider">
                    {dashboardStats.totalContracts}
                  </p>
                </div>
              </StarBorder>

              <StarBorder className="w-full">
                <div className="p-4 sm:p-6 text-center">
                  <FaChartBar className="text-3xl sm:text-4xl text-[#2cf2f9] mx-auto mb-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Total Certificates
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-[#2cf2f9]">
                    {dashboardStats.totalCertificates}
                  </p>
                </div>
              </StarBorder>

              <StarBorder className="w-full">
                <div className="p-4 sm:p-6 text-center">
                  <FaClock className="text-3xl sm:text-4xl text-[#2cf2f9] mx-auto mb-3" />
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Recent Activity
                  </h3>
                  <p className="text-2xl sm:text-3xl font-bold text-[#2cf2f9]">
                    {dashboardStats.recentActivity.length}
                  </p>
                </div>
              </StarBorder>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold relative transition-all text-sm sm:text-base ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-[#2cf2f9] to-[#2c9cf2] text-black shadow-[0_0_25px_#2cf2f9]"
                    : "bg-black/50 text-gray-300 border border-cyan-400/30 hover:text-white hover:shadow-[0_0_15px_#2cf2f9]"
                }`}
              >
                <FaEye className="inline mr-1 sm:mr-2" />
                Overview
              </button>

              <button
                onClick={() => setActiveTab("contracts")}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                  activeTab === "contracts"
                    ? "bg-gradient-to-r from-[#2cf2f9] to-[#2c9cf2] text-black shadow-[0_0_25px_#2cf2f9]"
                    : "bg-black/50 text-gray-300 border border-cyan-400/30 hover:text-white hover:shadow-[0_0_15px_#2cf2f9]"
                }`}
              >
                <FaCertificate className="inline mr-1 sm:mr-2" />
                Contracts
              </button>
              <button
                onClick={() => setActiveTab("mint")}
                className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                  activeTab === "mint"
                    ? "bg-gradient-to-r from-[#2cf2f9] to-[#2c9cf2] text-black shadow-[0_0_25px_#2cf2f9]"
                    : "bg-black/50 text-gray-300 border border-cyan-400/30 hover:text-white hover:shadow-[0_0_15px_#2cf2f9]"
                }`}
              >
                <FaPlus className="inline mr-1 sm:mr-2" />
                Mint Certificates
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <StarBorder className="w-full">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Recent Activity
                    </h3>
                    {dashboardStats.recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {dashboardStats.recentActivity.map(
                          (activity, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FaCertificate className="text-[#2cf2f9]" />
                                <div>
                                  <p className="text-white font-medium">
                                    {activity.name}
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    Contract deployed
                                  </p>
                                </div>
                              </div>
                              <div className="text-gray-400 text-sm">
                                {new Date(
                                  activity.timestamp
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-8">
                        No recent activity
                      </p>
                    )}
                  </div>
                </StarBorder>

                {/* Quick Actions */}
                <StarBorder className="w-full">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setActiveTab("contracts")}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                      >
                        <FaPlus className="text-[#2cf2f9] mb-2" />
                        <h4 className="text-white font-semibold">
                          Deploy New Contract
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Create a new certificate contract
                        </p>
                      </button>
                      <button
                        onClick={() => setActiveTab("mint")}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                      >
                        <FaCertificate className="text-[#2cf2f9] mb-2" />
                        <h4 className="text-white font-semibold">
                          Mint Certificates
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Issue new certificates
                        </p>
                      </button>
                    </div>
                  </div>
                </StarBorder>
              </div>
            )}

            {activeTab === "contracts" && (
              <StarBorder className="w-full">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-white">
                    Your Deployed Contracts
                  </h2>
                  {contracts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contracts.map((contract, index) => (
                        <div
                          key={contract.deploymentId || index}
                          className="bg-gray-800 p-4 rounded-lg border border-gray-600"
                        >
                          <h3 className="font-bold text-lg text-white">
                            {contract.contractName || contract.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-gray-400 text-sm font-mono">
                              {(
                                contract.contractAddress || contract.address
                              )?.substring(0, 10)}
                              ...
                            </p>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  contract.contractAddress || contract.address
                                )
                              }
                              className="text-[#2cf2f9] hover:text-cyan-400"
                              title="Copy address"
                            >
                              <FaCopy size={12} />
                            </button>
                            <a
                              href={`https://explorer.apothem.network/address/${
                                contract.contractAddress || contract.address
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2cf2f9] hover:text-cyan-400"
                              title="View on explorer"
                            >
                              <FaExternalLinkAlt size={12} />
                            </a>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            Network: {contract.network}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Deployed:{" "}
                            {contract.deployedAt
                              ? contract.deployedAt.toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-600">
                      <p className="text-gray-400 mb-4">
                        No contracts deployed yet
                      </p>
                      <button
                        onClick={() => setShowCreateContract(true)}
                        className="bg-[#2cf2f9] text-black px-6 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
                      >
                        Deploy Your First Contract
                      </button>
                    </div>
                  )}

                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowCreateContract(true)}
                      className="flex items-center gap-2 bg-[#2cf2f9] text-black px-6 py-3 rounded-lg font-bold hover:bg-cyan-400 transition-colors"
                    >
                      <FaPlus />
                      Deploy New Contract
                    </button>
                  </div>
                </div>
              </StarBorder>
            )}

            {activeTab === "mint" && (
              <StarBorder className="w-full">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-white">
                    Mint Certificates
                  </h2>
                  {contracts.length === 0 ? (
                    <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-600">
                      <p className="text-gray-400 mb-4">
                        You need to deploy a contract first before minting
                        certificates
                      </p>
                      <button
                        onClick={() => setActiveTab("contracts")}
                        className="bg-[#2cf2f9] text-black px-6 py-2 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
                      >
                        Deploy Contract First
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={() => setShowMintCertificates(true)}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors mx-auto"
                      >
                        <FaCertificate />
                        Start Minting Certificates
                      </button>
                    </div>
                  )}
                </div>
              </StarBorder>
            )}

            {/* Success/Error Messages */}
            {success && (
              <div className="flex items-center p-4 rounded-lg bg-green-600/80 backdrop-blur-sm mb-6 mt-6 animate-fade-in border border-green-500/50 shadow-lg shadow-green-500/20">
                <FaCheckCircle className="text-2xl mr-4 animate-pulse" />
                <div>
                  <p className="font-semibold text-white">{success}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center p-4 rounded-lg bg-red-600/80 backdrop-blur-sm mb-6 mt-6 animate-fade-in border border-red-500/50 shadow-lg shadow-red-500/20">
                <FaExclamationCircle className="text-2xl mr-4 animate-pulse" />
                <div>
                  <p className="font-semibold text-white">Error: {error}</p>
                </div>
              </div>
            )}

            {/* Minting Progress */}
            {mintingProgress && typeof mintingProgress === "string" && (
              <div className="mb-8 p-6 bg-blue-900/80 backdrop-blur-sm rounded-xl border border-blue-500/50 shadow-lg shadow-blue-500/20 animate-fade-in">
                <div className="flex items-center">
                  <div className="relative mr-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping"></div>
                  </div>
                  <p className="text-blue-100 font-medium animate-pulse">
                    {mintingProgress}
                  </p>
                </div>
                <div className="mt-3 bg-blue-800/50 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            {mintingProgress && Array.isArray(mintingProgress) && (
              <div className="mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-600/50 shadow-lg shadow-gray-600/20 animate-fade-in">
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-[#2cf2f9] to-blue-400 bg-clip-text text-transparent animate-gradient-x">
                  Minting Results
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {mintingProgress.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg flex items-center justify-between transition-all duration-300 hover:scale-105 animate-fade-up ${
                        result.success
                          ? "bg-green-900/80 text-green-100 border border-green-500/50 hover:shadow-lg hover:shadow-green-500/20"
                          : "bg-red-900/80 text-red-100 border border-red-500/50 hover:shadow-lg hover:shadow-red-500/20"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="font-medium">{result.participant}</span>
                      <span className="text-sm flex items-center gap-2">
                        {result.success ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span>✓ Token ID: {result.tokenId}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            <span>✗ {result.error}</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Contract Modal */}
        {showCreateContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-black p-8 rounded-lg max-w-md w-full border border-gray-600">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Deploy New Contract
                </h3>
                <button
                  onClick={() => setShowCreateContract(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={deployContract} className="space-y-6">
                <div
                  className="animate-slide-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <input
                    type="text"
                    name="contractName"
                    placeholder="Contract Name (e.g., My Certificate Contract)"
                    value={contractForm.contractName}
                    onChange={handleContractFormChange}
                    required
                    className="w-full bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                  />
                </div>
                <div
                  className="animate-slide-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <select
                    name="networkName"
                    value={contractForm.networkName}
                    onChange={handleContractFormChange}
                    className="w-full bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                  >
                    <option value="apothem">XDC Apothem Testnet</option>
                  </select>
                </div>

                <div
                  className="flex gap-4 animate-slide-up"
                  style={{ animationDelay: "300ms" }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCreateContract(false)}
                    className="flex-1 py-3 px-6 bg-gray-600/50 backdrop-blur-sm text-white rounded-lg hover:bg-gray-700 hover:scale-110 transition-all duration-500 hover:shadow-2xl transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-white text-black rounded-lg font-bold hover:bg-gray-200 hover:scale-110 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-2xl hover:shadow-white/30 transform"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin mx-auto" />
                    ) : (
                      "Deploy"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mint Certificates Modal */}
        {showMintCertificates && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gray-900 p-8 rounded-2xl max-w-4xl w-full border border-gray-600 max-h-[90vh] overflow-y-auto shadow-2xl animate-bounce-in hover:shadow-[0_0_40px_rgba(44,242,249,0.5)] transition-all duration-700 transform hover:scale-105">
              <div className="flex justify-between items-center mb-6 animate-slideDown">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#2cf2f9] via-blue-400 to-[#2cf2f9] bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-x">
                  Mint Certificates
                </h3>
                <button
                  onClick={() => {
                    setShowMintCertificates(false);
                    setCsvValidation(null);
                    setMintForm({
                      eventName: "",
                      certificateName: "",
                      contractAddress: "",
                      participantList: null,
                      recipientName: "",
                      recipientWallet: "",
                      description: "",
                      category: "",
                      rarity: "Common",
                      skills: "",
                      customAttributes: "",
                      certificateImage: null,
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-all transform hover:rotate-90 hover:scale-125 duration-300"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Recipient Mode Toggle */}
              <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-600/50 hover:border-[#2cf2f9]/30 transition-all duration-500 animate-fade-up">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white animate-fade-in">
                    Minting Mode
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsRecipientMode(!isRecipientMode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      isRecipientMode
                        ? "bg-[#2cf2f9] text-black shadow-lg shadow-[#2cf2f9]/30"
                        : "bg-gray-600 text-white hover:bg-gray-500"
                    }`}
                  >
                    {isRecipientMode ? "Single Recipient" : "Bulk CSV Upload"}
                  </button>
                </div>
                <p className="text-gray-400 text-sm animate-fade-in">
                  {isRecipientMode
                    ? "Mint a certificate for one specific recipient"
                    : "Upload a CSV file to mint certificates for multiple recipients"}
                </p>
              </div>

              <form onSubmit={mintCertificates} className="space-y-6">
                {/* Contract Selection */}
                <div
                  className="space-y-4 animate-slide-up"
                  style={{ animationDelay: "100ms" }}
                >
                  <select
                    name="contractAddress"
                    value={mintForm.contractAddress}
                    onChange={handleMintFormChange}
                    required
                    className="w-full bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl"
                  >
                    <option value="">Select Contract</option>
                    {contracts.map((contract) => (
                      <option
                        key={contract.deploymentId || contract.contractAddress}
                        value={contract.contractAddress || contract.address}
                      >
                        {contract.contractName || contract.name} (
                        {(
                          contract.contractAddress || contract.address
                        )?.substring(0, 10)}
                        ...)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Certificate Information */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up"
                  style={{ animationDelay: "200ms" }}
                >
                  <input
                    type="text"
                    name="eventName"
                    placeholder="Event Name (e.g., Blockchain Workshop 2024)"
                    value={mintForm.eventName}
                    onChange={handleMintFormChange}
                    required
                    className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                  />
                  <input
                    type="text"
                    name="certificateName"
                    placeholder="Certificate Name (e.g., Completion Certificate)"
                    value={mintForm.certificateName}
                    onChange={handleMintFormChange}
                    required
                    className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                  />
                </div>

                {/* Recipient Information (Single Mode Only) */}
                {isRecipientMode && (
                  <div
                    className="space-y-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-600/50 hover:border-[#2cf2f9]/30 transition-all duration-700 animate-slide-up hover:shadow-2xl hover:shadow-[#2cf2f9]/20"
                    style={{ animationDelay: "300ms" }}
                  >
                    <h4 className="text-lg font-semibold text-white mb-3 animate-fade-in">
                      Recipient Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="recipientName"
                        placeholder="Recipient Name"
                        value={mintForm.recipientName}
                        onChange={handleMintFormChange}
                        required={isRecipientMode}
                        className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                      />
                      <input
                        type="text"
                        name="recipientWallet"
                        placeholder="Recipient Wallet Address (0x...)"
                        value={mintForm.recipientWallet}
                        onChange={handleMintFormChange}
                        required={isRecipientMode}
                        className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                      />
                    </div>
                  </div>
                )}

                {/* CSV Upload (Bulk Mode Only) */}
                {!isRecipientMode && (
                  <div
                    className="space-y-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-600/50 hover:border-[#2cf2f9]/30 transition-all duration-700 animate-slide-up hover:shadow-2xl hover:shadow-[#2cf2f9]/20"
                    style={{ animationDelay: "300ms" }}
                  >
                    <h4 className="text-lg font-semibold text-white mb-3 animate-fade-in">
                      Participant CSV Upload
                    </h4>
                    <label className="block text-gray-400 text-sm mb-2 animate-fade-in">
                      CSV file with columns: participant_name, wallet_address
                    </label>
                    <input
                      type="file"
                      name="participantList"
                      accept=".csv"
                      onChange={(e) => {
                        handleMintFormChange(e);
                        if (e.target.files[0]) {
                          validateCsv(e.target.files[0]);
                        }
                      }}
                      required={!isRecipientMode}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b9c0] file:text-white hover:file:bg-[#2cf2f9] cursor-pointer transition-all duration-500 hover:scale-110 hover:shadow-2xl transform"
                    />

                    {/* CSV Validation Results */}
                    {csvValidation && (
                      <div
                        className={`p-4 rounded-lg mt-4 animate-fade-in ${
                          csvValidation.error
                            ? "bg-red-900/80 text-red-100 border border-red-500/50"
                            : "bg-green-900/80 text-green-100 border border-green-500/50"
                        }`}
                      >
                        {csvValidation.error ? (
                          <div>
                            <p className="font-semibold">
                              CSV Validation Failed:
                            </p>
                            <p>{csvValidation.error}</p>
                            {csvValidation.details && (
                              <ul className="mt-2 text-sm">
                                {csvValidation.details.map((detail, index) => (
                                  <li key={index}>• {detail}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold">✓ CSV Valid</p>
                            <p>
                              Found {csvValidation.participantCount}{" "}
                              participants
                            </p>
                            {csvValidation.preview && (
                              <div className="mt-2 text-sm">
                                <p>Preview:</p>
                                {csvValidation.preview
                                  .slice(0, 3)
                                  .map((participant, index) => (
                                    <p key={index}>
                                      • {participant.participant_name} -{" "}
                                      {participant.wallet_address}
                                    </p>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Certificate Metadata */}
                <div
                  className="space-y-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-600/50 hover:border-[#2cf2f9]/30 transition-all duration-700 animate-slide-up hover:shadow-2xl hover:shadow-[#2cf2f9]/20"
                  style={{ animationDelay: "400ms" }}
                >
                  <h4 className="text-lg font-semibold text-white mb-3 animate-fade-in">
                    Certificate Details
                  </h4>

                  {/* Description */}
                  <textarea
                    name="description"
                    placeholder="Certificate Description (optional)"
                    value={mintForm.description}
                    onChange={handleMintFormChange}
                    rows={3}
                    className="w-full bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform resize-vertical"
                  />

                  {/* Category and Rarity */}
                  <div className="mb-2 animate-fade-in">
                    <p className="text-sm text-gray-400">
                      Choose the rarity level. Points are assigned based on
                      rarity: Common (100), Uncommon (200), Rare (300), Epic
                      (400), Legendary (500).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="category"
                      placeholder="Category (e.g., Workshop, Course)"
                      value={mintForm.category}
                      onChange={handleMintFormChange}
                      className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                    />
                    <select
                      name="rarity"
                      value={mintForm.rarity}
                      onChange={handleMintFormChange}
                      className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                    >
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                    </select>
                    <div className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 flex items-center hover:border-[#2cf2f9]/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl transform">
                      <span className="text-gray-400">Points: </span>
                      <span className="ml-2 text-[#2cf2f9] animate-pulse">
                        Auto-calculated based on content
                      </span>
                    </div>
                  </div>

                  {/* Skills and Custom Attributes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="skills"
                      placeholder="Skills (comma separated)"
                      value={mintForm.skills}
                      onChange={handleMintFormChange}
                      className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                    />
                    <input
                      type="text"
                      name="customAttributes"
                      placeholder="Custom Attributes (JSON format)"
                      value={mintForm.customAttributes}
                      onChange={handleMintFormChange}
                      className="bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-500 hover:border-[#2cf2f9]/50 hover:bg-gray-700 hover:scale-105 hover:shadow-2xl transform"
                    />
                  </div>

                  {/* Certificate Image Options */}
                  <div className="animate-fade-in">
                    <label className="block text-gray-400 text-sm mb-2">
                      Certificate Image (optional)
                    </label>

                    {/* Toggle between file upload and URL input */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setMintForm((prev) => ({
                            ...prev,
                            imageInputType: "file",
                            imageUrl: "",
                            certificateImage: null,
                          }))
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-300 hover:scale-105 ${
                          !mintForm.imageInputType ||
                          mintForm.imageInputType === "file"
                            ? "bg-[#00b9c0] text-white shadow-lg shadow-[#00b9c0]/30"
                            : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMintForm((prev) => ({
                            ...prev,
                            imageInputType: "url",
                            certificateImage: null,
                            imageUrl: "",
                          }))
                        }
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-300 hover:scale-105 ${
                          mintForm.imageInputType === "url"
                            ? "bg-[#00b9c0] text-white shadow-lg shadow-[#00b9c0]/30"
                            : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {/* Conditional rendering based on selected option */}
                    {!mintForm.imageInputType ||
                    mintForm.imageInputType === "file" ? (
                      <input
                        type="file"
                        name="certificateImage"
                        accept="image/*"
                        onChange={handleMintFormChange}
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b9c0] file:text-white hover:file:bg-[#2cf2f9] cursor-pointer transition-all duration-300 hover:scale-105"
                      />
                    ) : (
                      <input
                        type="url"
                        name="imageUrl"
                        placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                        value={mintForm.imageUrl}
                        onChange={handleMintFormChange}
                        className="w-full bg-gray-700/50 backdrop-blur-sm p-4 rounded-xl border border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] focus:shadow-lg focus:shadow-[#2cf2f9]/20 transition-all duration-300 hover:border-[#2cf2f9]/50 hover:bg-gray-700"
                      />
                    )}

                    {/* Help text */}
                    <p className="text-xs text-gray-500 mt-1 animate-fade-in">
                      {!mintForm.imageInputType ||
                      mintForm.imageInputType === "file"
                        ? "Upload an image file from your computer"
                        : "Use a direct link to an online image (supports jpg, png, gif, etc.)"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex gap-4 animate-slide-up"
                  style={{ animationDelay: "500ms" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMintCertificates(false);
                      setCsvValidation(null);
                      setMintForm({
                        eventName: "",
                        certificateName: "",
                        contractAddress: "",
                        participantList: null,
                        recipientName: "",
                        recipientWallet: "",
                        description: "",
                        category: "",
                        rarity: "Common",
                        skills: "",
                        customAttributes: "",
                        certificateImage: null,
                        imageUrl: "",
                        imageInputType: "file",
                      });
                    }}
                    className="flex-1 py-3 px-6 bg-gray-600/50 backdrop-blur-sm text-white rounded-lg hover:bg-gray-700 hover:scale-110 transition-all duration-500 hover:shadow-2xl transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !mintForm.contractAddress ||
                      (!isRecipientMode &&
                        (!csvValidation || csvValidation.error)) ||
                      (isRecipientMode &&
                        (!mintForm.recipientName.trim() ||
                          !mintForm.recipientWallet.trim()))
                    }
                    className="flex-1 py-3 px-6 bg-white text-black rounded-lg font-bold hover:bg-gray-200 hover:scale-110 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:shadow-2xl hover:shadow-white/30 transform"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin mx-auto" />
                    ) : isRecipientMode ? (
                      "Mint Certificate"
                    ) : (
                      "Mint Certificates"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
