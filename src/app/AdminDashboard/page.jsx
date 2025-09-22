'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaUpload,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlus,
  FaCertificate,
  FaTimes
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

  // Contract creation form
  const [contractForm, setContractForm] = useState({
    contractName: "",
    networkName: "apothem",
  });

  

  // Certificate minting form
  const [mintForm, setMintForm] = useState({
    eventName: "",
    certificateName: "",
    contractAddress: "",
    participantList: null,
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

  // Load data on component mount
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/contracts/deployments');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.contracts)) {
        // contracts is ALWAYS an array with guaranteed structure
        const processedContracts = data.contracts.map(contract => ({
          address: contract.contractAddress,
          contractAddress: contract.contractAddress, // Keep both for compatibility
          name: contract.contractName,
          contractName: contract.contractName, // Keep both for compatibility
          network: contract.network,
          deployer: contract.deployer,
          owner: contract.owner,
          deployedAt: new Date(contract.deployedAt),
          transactionHash: contract.transactionHash,
          blockNumber: contract.blockNumber,
          deploymentId: contract.deploymentId
        }));
        setContracts(processedContracts);
      } else {
        console.error('Failed to fetch contracts:', data.error);
        setContracts([]); // Always ensure contracts is an array
        // Fallback to localStorage if API fails
        const savedContracts = localStorage.getItem('deployedContracts');
        if (savedContracts) {
          try {
            const parsed = JSON.parse(savedContracts);
            setContracts(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setContracts([]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]); // Always ensure contracts is an array
      // Fallback to localStorage if API fails
      const savedContracts = localStorage.getItem('deployedContracts');
      if (savedContracts) {
        try {
          const parsed = JSON.parse(savedContracts);
          setContracts(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setContracts([]);
        }
      }
    }
  };

  const handleContractFormChange = (e) => {
    const { name, value } = e.target;
    setContractForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMintFormChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setMintForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setMintForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const deployContract = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: contractForm.networkName,
          contractName: contractForm.contractName,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        await fetchContracts(); // Refresh contracts list
        
        setSuccess(`Contract deployed successfully! Address: ${result.deployment.contractAddress}`);
        setShowCreateContract(false);
        setContractForm({
          contractName: "",
          networkName: "apothem",
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to deploy contract: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateCsv = async (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('http://localhost:5000/api/contracts/validate-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setCsvValidation(result);
      return result;
    } catch (error) {
      setCsvValidation({ error: 'Failed to validate CSV file' });
      return { error: 'Failed to validate CSV file' };
    }
  };

  const mintCertificates = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    setMintingProgress(null);

    // Find the selected contract to get its name
    const selectedContract = contracts.find(contract => 
      (contract.contractAddress || contract.address) === mintForm.contractAddress
    );
    const contractName = selectedContract ? (selectedContract.contractName || selectedContract.name) : '';

    const formData = new FormData();
    formData.append("eventName", mintForm.eventName);
    formData.append("certificateName", mintForm.certificateName);
    formData.append("contractAddress", mintForm.contractAddress);
    formData.append("contractName", contractName);

    if (mintForm.participantList) {
      formData.append("csvFile", mintForm.participantList);
    }

    try {
      const response = await fetch("http://localhost:5000/api/contracts/auto-mint-with-ipfs", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok || response.status === 207) {
        setSuccess(result.message);
        if (result.results && Array.isArray(result.results.results)) {
          setMintingProgress(result.results.results);
        }
        setShowMintCertificates(false);
        setMintForm({
          eventName: "",
          certificateName: "",
          contractAddress: "",
          participantList: null,
        });
        setCsvValidation(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to mint certificates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-8 py-12">
      <header className="flex justify-between items-center mb-12 pb-6">
        <div className="flex items-center">
          <h1 className="text-4xl font-extrabold text-[#2cf2f9] animate-fade-in">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-lg text-gray-400">
            Welcome, Admin!
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg bg-red-600 px-6 py-3 text-lg font-bold hover:scale-105 transition-transform"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col items-center">
        <StarBorder className="w-full max-w-lg mx-auto">
          <div className="p-8 md:p-12 flex flex-col items-center">
            {/* Current Contracts Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-white">Deployed Contracts</h2>
              {contracts.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contracts.map((contract, index) => (
                    <div key={contract.deploymentId || index} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <h3 className="font-bold text-lg text-white">{contract.contractName || contract.name}</h3>
                      <p className="text-gray-400 text-sm font-mono">
                        {(contract.contractAddress || contract.address)?.substring(0, 10)}...
                      </p>
                      <p className="text-gray-500 text-xs">
                        Network: {contract.network}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Deployed: {contract.deployedAt ? contract.deployedAt.toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-600">
                  <p className="text-gray-400 mb-4">No contracts deployed yet</p>
                  <button
                    onClick={() => setShowCreateContract(true)}
                    className="bg-white text-black px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Deploy Your First Contract
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button
                onClick={() => setShowCreateContract(true)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                <FaPlus />
                Create New Contract
              </button>
              <button
                onClick={() => setShowMintCertificates(true)}
                disabled={contracts.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
                  contracts.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <FaCertificate />
                Mint Certificates
              </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="flex items-center p-4 rounded-lg bg-green-600 mb-6">
                <FaCheckCircle className="text-2xl mr-4" />
                <div>
                  <p className="font-semibold text-white">{success}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center p-4 rounded-lg bg-red-600 mb-6">
                <FaExclamationCircle className="text-2xl mr-4" />
                <div>
                  <p className="font-semibold text-white">Error: {error}</p>
                </div>
              </div>
            )}

            {/* Minting Progress */}
            {mintingProgress && Array.isArray(mintingProgress) && (
              <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-600">
                <h3 className="text-xl font-bold mb-4 text-[#2cf2f9]">Minting Results</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {mintingProgress.map((result, index) => (
                    <div key={index} className={`p-3 rounded flex items-center justify-between ${
                      result.success ? 'bg-green-900 text-green-100' : 'bg-red-900 text-red-100'
                    }`}>
                      <span>{result.participant}</span>
                      <span className="text-sm">
                        {result.success ? `✓ Token ID: ${result.tokenId}` : `✗ ${result.error}`}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
            )}
          </div>
        </StarBorder>

        {/* Create Contract Modal */}
        {showCreateContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-black p-8 rounded-lg max-w-md w-full border border-gray-600">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Deploy New Contract</h3>
                <button
                  onClick={() => setShowCreateContract(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={deployContract} className="space-y-6">
                <input
                  type="text"
                  name="contractName"
                  placeholder="Contract Name (e.g., My Certificate Contract)"
                  value={contractForm.contractName}
                  onChange={handleContractFormChange}
                  required
                  className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] transition-colors"
                />
                <select
                  name="network"
                  value={contractForm.network}
                  onChange={handleContractFormChange}
                  className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 focus:outline-none focus:border-[#2cf2f9] transition-colors"
                >
                  <option value="apothem">XDC Apothem Testnet</option>
                </select>
                
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateContract(false)}
                    className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Deploy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mint Certificates Modal */}
        {showMintCertificates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-8 rounded-lg max-w-2xl w-full border border-gray-600 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[#2cf2f9]">Mint Certificates</h3>
                <button
                  onClick={() => {
                    setShowMintCertificates(false);
                    setCsvValidation(null);
                    setMintForm({
                      eventName: "",
                      certificateName: "",
                      contractAddress: "",
                      participantList: null,
                    });
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={mintCertificates} className="space-y-6">
                {/* Certificate Details */}
                <div className="space-y-4">
                  <select
                    name="contractAddress"
                    value={mintForm.contractAddress}
                    onChange={handleMintFormChange}
                    required
                    className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 focus:outline-none focus:border-[#2cf2f9] transition-colors"
                  >
                    <option value="">Select Contract</option>
                    {contracts.map((contract) => (
                      <option key={contract.deploymentId || contract.contractAddress} value={contract.contractAddress || contract.address}>
                        {contract.contractName || contract.name} ({(contract.contractAddress || contract.address)?.substring(0, 10)}...)
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="certificateName"
                    placeholder="Certificate Name (e.g., Completion Certificate)"
                    value={mintForm.certificateName}
                    onChange={handleMintFormChange}
                    required
                    className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] transition-colors"
                  />
                  <input
                    type="text"
                    name="eventName"
                    placeholder="Event Name (e.g., Blockchain Workshop 2024)"
                    value={mintForm.eventName}
                    onChange={handleMintFormChange}
                    required
                    className="w-full bg-gray-700 p-4 rounded-xl border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:border-[#2cf2f9] transition-colors"
                  />
                </div>

                {/* CSV Upload */}
                <div className="space-y-4">
                  <label className="block text-gray-400">
                    Participant CSV File (participant_name, wallet_address):
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
                    required
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00b9c0] file:text-white hover:file:bg-[#2cf2f9] cursor-pointer transition-colors"
                  />
                </div>

                {/* CSV Validation Results */}
                {csvValidation && (
                  <div className={`p-4 rounded-lg ${csvValidation.error ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'}`}>
                    {csvValidation.error ? (
                      <div>
                        <p className="font-semibold">CSV Validation Failed:</p>
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
                        <p>Found {csvValidation.participantCount} participants</p>
                        {csvValidation.preview && (
                          <div className="mt-2 text-sm">
                            <p>Preview:</p>
                            {csvValidation.preview.slice(0, 3).map((participant, index) => (
                              <p key={index}>• {participant.participant_name} - {participant.wallet_address}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
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
                      });
                    }}
                    className="flex-1 py-3 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !csvValidation || !mintForm.contractAddress}
                    className="flex-1 py-3 px-6 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Mint Certificates'}
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
