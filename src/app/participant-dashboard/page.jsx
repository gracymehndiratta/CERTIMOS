"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Backend API Configuration - Try multiple possible ports
const POSSIBLE_BACKEND_URLS = [
  "http://localhost:5000",
  "http://localhost:3001", 
  "http://127.0.0.1:5000"
];

// Auto-detect working backend URL
let API_BASE_URL = "http://localhost:5000/api";
let HEALTH_URL = "http://localhost:5000/health";

// Helper function to resolve IPFS URLs
function resolveIPFS(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

// Helper function to fetch IPFS metadata with better error handling
async function fetchIPFSMetadata(tokenURI) {
  try {
    if (!tokenURI) return null;
    
    if (tokenURI.startsWith('http')) {
      const response = await fetch(tokenURI, { timeout: 10000 });
      if (!response.ok) {
        console.warn(`Failed to fetch metadata: ${response.status}`);
        return null;
      }
      return await response.json();
    } else if (tokenURI.startsWith('data:application/json')) {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    
    // Handle IPFS URLs
    const resolvedURL = resolveIPFS(tokenURI);
    console.log('Fetching metadata from:', resolvedURL);
    
    const response = await fetch(resolvedURL, { timeout: 10000 });
    if (!response.ok) {
      console.warn(`Failed to fetch metadata: ${response.status}`);
      return null;
    }
    
    const metadata = await response.json();
    console.log('Fetched metadata:', metadata);
    return metadata;
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

// API Service functions
const apiService = {
  // Auto-detect working backend URL
  async findWorkingBackend() {
    for (const baseUrl of POSSIBLE_BACKEND_URLS) {
      try {
        const response = await fetch(`${baseUrl}/health`, { 
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          API_BASE_URL = `${baseUrl}/api`;
          HEALTH_URL = `${baseUrl}/health`;
          return await response.json();
        }
      } catch (error) {
        console.log(`Backend not available at ${baseUrl}:`, error.message);
        continue;
      }
    }
    throw new Error('No backend server found. Please start your backend server.');
  },

  // Get all certificates for a wallet with metadata - SIMPLIFIED VERSION
  async getCertificates(walletAddress) {
    try {
      console.log(`🔍 Fetching certificates for wallet: ${walletAddress}`);
      
      // 1. Get basic certificate data (fast - 2-5 seconds)
      const response = await fetch(`${API_BASE_URL}/certificates/wallet/${walletAddress}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000 // Reduce from 30s to 15s
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch certificates: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.success && data.certificates) {
        // 2. Fetch metadata for certificates that have tokenURI (with limited concurrency)
        const certificatesWithMetadata = await Promise.all(
          data.certificates.map(async (cert, index) => {
            if (!cert.tokenURI) {
              return cert; // Return as-is if no tokenURI
            }

            try {
              // Add delay for IPFS requests to avoid rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100 * index));
              }
              
              const metadata = await fetchIPFSMetadata(cert.tokenURI);
              return {
                ...cert,
                metadata: metadata,
                name: metadata?.name || cert.name,
                description: metadata?.description || cert.description,
                image: metadata?.image || cert.image,
                attributes: metadata?.attributes || cert.attributes
              };
            } catch (error) {
              console.error(`Failed to fetch metadata for token ${cert.tokenId}:`, error);
              return cert; // Return original cert if metadata fails
            }
          })
        );
        
        return {
          ...data,
          certificates: certificatesWithMetadata
        };
      }
      
      return data;
    } catch (error) {
      console.error('Certificate fetch error:', error);
      throw error;
    }
  },

  // Get XDC balance for a wallet
  async getBalance(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/${walletAddress}/balance`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  },

  // Verify a certificate by token ID
  async verifyCertificate(tokenId) {
    const response = await fetch(`${API_BASE_URL}/verify/${tokenId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to verify certificate: ${response.statusText}`);
    }
    return response.json();
  },

  // Check backend health
  async checkHealth() {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.statusText}`);
    }
    return response.json();
  }
};

export default function ParticipantDashboard() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certificateCount, setCertificateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [contractAddress, setContractAddress] = useState(''); // Removed hardcoded address
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ⭐ NEW: State for valuation data
  const [totalPoints, setTotalPoints] = useState(0);
  const [valueBreakdown, setValueBreakdown] = useState(null);

  // 🎭 NEW: Styles for rarity levels
  const rarityStyles = {
    Legendary: 'bg-yellow-500 border-yellow-400 text-black',
    Epic: 'bg-purple-600 border-purple-500 text-white',
    Rare: 'bg-blue-600 border-blue-500 text-white',
    Uncommon: 'bg-green-600 border-green-500 text-white',
    Common: 'bg-gray-600 border-gray-500 text-white',
  };

  useEffect(() => {
    setIsClient(true);
    checkBackendHealth();
    // Removed hardcoded contract address - will be set dynamically
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!window.ethereum) {
      setMetaMaskInstalled(false);
      return;
    }

    const storedWallet = localStorage.getItem("walletAddress");
    if (!storedWallet) {
      setError("No wallet connected! Please connect your wallet from the home page first.");
      setLoading(false);
      return;
    }
    
    // Validate wallet address format
    if (!storedWallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid wallet address format. Please reconnect your wallet.");
      localStorage.removeItem("walletAddress");
      setLoading(false);
      return;
    }
    
    setWallet(storedWallet);
    fetchWalletData(storedWallet);
  }, [isClient]);

  const checkBackendHealth = async () => {
    try {
      const health = await apiService.findWorkingBackend();
      setBackendStatus(health);
      console.log('Backend found and working:', health);
    } catch (err) {
      console.error("No backend server found:", err.message);
      setBackendStatus({ status: "ERROR", message: err.message });
    }
  };

  const fetchWalletData = async (address) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Starting data fetch for wallet: ${address}`);

      // Ensure we're on the correct network
      await ensureCorrectNetwork();

      // Check backend connectivity first
      try {
        await apiService.checkHealth();
        console.log('✅ Backend is healthy');
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        setError('Backend service is not available. Please try again later.');
        setLoading(false);
        return;
      }

      // Fetch certificates and balance in parallel
      const [certificatesResponse, balanceResponse] = await Promise.allSettled([
        apiService.getCertificates(address),
        apiService.getBalance(address)
      ]);

      // Handle certificates response
      if (certificatesResponse.status === 'fulfilled') {
        const certsData = certificatesResponse.value;
        if (certsData.success) {
          const certs = certsData.certificates || [];
          console.log('✅ Certificates with metadata:', certs);
          setCertificates(certs);

          // ⭐ UPDATED: Set new valuation and breakdown data
          setCertificateCount(certsData.valueBreakdown?.totalCertificates || certsData.count || certs.length);
          setTotalPoints(certsData.totalPoints || 0);
          setValueBreakdown(certsData.valueBreakdown || null);

        } else {
          console.error('❌ Certificate API returned error:', certsData.error);
          throw new Error(certsData.error || 'Failed to fetch certificates');
        }
      } else {
        console.error('❌ Certificates fetch failed:', certificatesResponse.reason);
        setError(`Failed to load certificates: ${certificatesResponse.reason?.message || 'Unknown error'}`);
        setCertificates([]);
        setCertificateCount(0);
        setTotalPoints(0);
        setValueBreakdown(null);
      }

      // Handle balance response
      if (balanceResponse.status === 'fulfilled') {
        const balanceData = balanceResponse.value;
        if (balanceData.success) {
          setBalance(balanceData.balance.formatted);
          console.log('✅ Balance loaded:', balanceData.balance.formatted);
        } else {
          console.warn('⚠️ Balance API failed, trying direct fetch');
          await fetchDirectBalance(address);
        }
      } else {
        console.error('❌ Balance fetch failed:', balanceResponse.reason);
        await fetchDirectBalance(address);
      }

      setLoading(false);
      console.log('✅ Wallet data fetch completed successfully');
    } catch (err) {
      console.error("❌ Error fetching wallet data:", err);
      setError(`Failed to load dashboard data: ${err.message}`);
      setLoading(false);
    }
  };

  const ensureCorrectNetwork = async () => {
    if (!window.ethereum) return;

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const apothemChainId = "0x33"; // Apothem Testnet

    if (chainId !== apothemChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: apothemChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: apothemChainId,
                chainName: "XDC Apothem Network",
                nativeCurrency: { name: "XDC", symbol: "XDC", decimals: 18 },
                rpcUrls: ["https://erpc.apothem.network"],
                blockExplorerUrls: ["https://explorer.apothem.network/"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  };

  const fetchDirectBalance = async (address) => {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Failed to fetch direct balance:", err);
      setBalance("Unable to load");
    }
  };

  const handleCertificateClick = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const closeCertificateModal = () => {
    setSelectedCertificate(null);
  };

  const handleConnectWallet = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    // Clear all stored wallet data
    localStorage.removeItem("walletAddress");
    
    // Optionally try to disconnect from MetaMask (not all wallets support this)
    if (window.ethereum && window.ethereum.request) {
      try {
        // Some wallets support wallet_revokePermissions
        window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }]
        }).catch(() => {
          // Ignore errors if not supported
        });
      } catch (error) {
        // Ignore errors
      }
    }
    
    // Redirect to home page
    window.location.href = '/';
  };

  const refreshData = () => {
    if (wallet) {
      fetchWalletData(wallet);
    }
  };

  // Enhanced button handlers
  const handleViewContract = () => {
    const url = 'https://testnet.xdcscan.com/address/0x9b40c3c0656434fd89bC50671a29d1814EDA8079';
    console.log('Opening contract URL:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewTokenDetails = (tokenId) => {
    const url = `https://testnet.xdcscan.com/token/${contractAddress}/${tokenId}`;
    console.log('Opening token URL:', url);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareCertificate = (certificate) => {
    console.log('Opening share modal for certificate:', certificate.tokenId);
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
  };

  const shareToLinkedIn = (certificate) => {
    const certName = getCertificateName(certificate);
    const eventName = getEventName(certificate);
    
    const shareText = `🎓 I've earned a blockchain certificate: ${certName}${eventName ? ` from ${eventName}` : ''}!\n\nThis ${getCertificateRarity(certificate)} certificate is worth ${getCertificatePoints(certificate)} points and is verified on the XDC Network.\n\nToken ID: #${certificate.tokenId}\n\n#BlockchainEducation #Certificate #XDC #Achievement #NFT`;
    const shareUrl = `https://testnet.xdcscan.com/token/${contractAddress}/${certificate.tokenId}`;
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToTwitter = (certificate) => {
    const certName = getCertificateName(certificate);
    const eventName = getEventName(certificate);
    
    const shareText = `🎓 Just earned my ${getCertificateRarity(certificate)} blockchain certificate: ${certName}${eventName ? ` from ${eventName}` : ''}! Worth ${getCertificatePoints(certificate)} points. Verified on @XDCFoundation Network. Token #${certificate.tokenId} #BlockchainEducation #Certificate #XDC`;
    const shareUrl = `https://testnet.xdcscan.com/token/${contractAddress}/${certificate.tokenId}`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const shareToFacebook = (certificate) => {
    const shareUrl = `https://testnet.xdcscan.com/token/${contractAddress}/${certificate.tokenId}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const copyToClipboard = async (certificate) => {
    const certName = getCertificateName(certificate);
    const eventName = getEventName(certificate);
    const recipientName = getRecipientName(certificate);
    
    const shareText = `🎓 Blockchain Certificate Achievement

Certificate: ${certName}
${eventName ? `Event: ${eventName}` : ''}
${recipientName ? `Recipient: ${recipientName}` : ''}

Rarity: ${getCertificateRarity(certificate)}
Category: ${getCertificateCategory(certificate)}
Points: ${getCertificatePoints(certificate)}
Token ID: #${certificate.tokenId}

Verify on blockchain: https://testnet.xdcscan.com/token/${contractAddress}/${certificate.tokenId}

#BlockchainEducation #Certificate #XDC #Achievement`;

    try {
      await navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
      setShowShareModal(false);
    }
  };

  // Helper functions to extract certificate data
  const getCertificateImage = (cert) => {
    return cert.image || cert.metadata?.image || null;
  };

  const getCertificateName = (cert) => {
    return cert.name || cert.metadata?.name || `Certificate #${cert.tokenId}`;
  };

  const getCertificateDescription = (cert) => {
    return cert.description || cert.metadata?.description || '';
  };

  const getCertificateAttributes = (cert) => {
    return cert.attributes || cert.metadata?.attributes || [];
  };

  // ⭐ NEW: Helpers for valuation data
  const getCertificatePoints = (cert) => cert.points || 0;
  const getCertificateRarity = (cert) => cert.rarity || 'Common';
  const getCertificateCategory = (cert) => cert.category || 'General';


  const getEventName = (cert) => {
    return cert.event_name || cert.metadata?.event_name || 
           getCertificateAttributes(cert).find(attr => attr.trait_type === 'Event')?.value || '';
  };

  const getRecipientName = (cert) => {
    return cert.recipient_name || cert.metadata?.recipient_name || 
           getCertificateAttributes(cert).find(attr => attr.trait_type === 'Recipient')?.value || '';
  };

  const getDateIssued = (cert) => {
    return cert.date_issued || cert.metadata?.date_issued || 
           getCertificateAttributes(cert).find(attr => attr.trait_type === 'Date Issued')?.value || '';
  };

  const getCertificateLevel = (cert) => {
    return getCertificateAttributes(cert).find(attr => attr.trait_type === 'Level')?.value || '';
  };

  const getSkills = (cert) => {
    return getCertificateAttributes(cert)
      .filter(attr => attr.trait_type.startsWith('Skill'))
      .map(attr => attr.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Error states
  if (!metaMaskInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-2xl">
          <div className="text-6xl mb-4">🦊</div>
          <h1 className="text-2xl font-bold mb-4">MetaMask Required</h1>
          <p className="text-gray-300 mb-6">Please install MetaMask to access your dashboard.</p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-2xl">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-4">{error ? 'Connection Error' : 'No Wallet Connected'}</h1>
          <p className="text-gray-300 mb-6">
            {error || 'Please connect your wallet to access your dashboard.'}
          </p>
          <button
            onClick={handleConnectWallet}
            className="bg-[#54D1DC] hover:bg-[#3fb8c4] px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#54D1DC] to-blue-400 bg-clip-text text-transparent">
                Certificate Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Wallet: {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Backend Status */}
              {backendStatus && (
                <div className="hidden md:flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    backendStatus.status === 'OK' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className="text-sm text-gray-400">
                    {backendStatus.status === 'OK' ? 'Backend Online' : 'Backend Offline'}
                  </span>
                </div>
              )}
              
              {/* Share Success Notification */}
              {shareSuccess && (
                <div className="flex items-center gap-2 bg-green-600 px-3 py-1 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-white">Copied!</span>
                </div>
              )}
              
              {/* Balance Display */}
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <div className="text-sm text-gray-400">XDC Balance</div>
                <div className="text-lg font-bold text-[#54D1DC]">
                  {balance ? `${parseFloat(balance).toFixed(4)} XDC` : "Loading..."}
                </div>
              </div>

              {/* Certificate Count */}
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <div className="text-sm text-gray-400">Certificates</div>
                <div className="text-lg font-bold text-green-400">
                  {certificateCount}
                </div>
              </div>

              {/* ⭐ NEW: Total Points Display */}
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-lg font-bold text-yellow-400">
                  {loading ? '...' : `${totalPoints.toLocaleString()} PTS`}
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh Data"
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
                title="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-900/50 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="text-red-400">⚠️</div>
              <div>
                <div className="font-semibold text-red-300">Error</div>
                <div className="text-red-200">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* ⭐ NEW: Value Breakdown Section */}
        {!loading && valueBreakdown && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Average Points */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 text-sm font-medium mb-1">Average Value</h3>
                <p className="text-3xl font-bold text-yellow-400">{valueBreakdown.averagePoints.toFixed(0)} PTS</p>
                <p className="text-gray-500 text-xs">per certificate</p>
              </div>
              {/* Rarity Distribution */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-gray-400 text-sm font-medium mb-2">Rarity Distribution</h3>
                 <div className="space-y-2">
                   {Object.entries(valueBreakdown.rarityDistribution).map(([rarity, count]) => (
                     <div key={rarity} className="flex justify-between items-center text-sm">
                       <span className={`${rarityStyles[rarity]} px-2 py-0.5 rounded text-xs font-semibold border`}>{rarity}</span>
                       <span className="font-bold text-white">{count}</span>
                     </div>
                   ))}
                 </div>
              </div>
              {/* Category Distribution */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                 <h3 className="text-gray-400 text-sm font-medium mb-2">Category Distribution</h3>
                 <div className="space-y-2">
                   {Object.entries(valueBreakdown.categoryDistribution).map(([category, count]) => (
                     <div key={category} className="flex justify-between items-center text-sm">
                       <span className="text-gray-300">{category}</span>
                       <span className="font-bold text-white">{count}</span>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* Certificates Section */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Your Certificates</h2>
            {!loading && certificates.length > 0 && (
              <div className="text-gray-400">
                {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="bg-gray-700 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-700 h-4 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-700 h-4 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📜</div>
              <h3 className="text-xl font-semibold mb-2">No Certificates Found</h3>
              <p className="text-gray-400 mb-6">
                You don't have any certificates in this wallet yet.
              </p>
              <button
                onClick={refreshData}
                className="bg-[#54D1DC] hover:bg-[#3fb8c4] px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => (
                <div
                  key={cert.tokenId}
                  onClick={() => handleCertificateClick(cert)}
                  className="bg-gray-800 rounded-xl shadow-lg p-6 hover:bg-gray-750 transition-all cursor-pointer transform hover:scale-105 border border-gray-700 hover:border-[#54D1DC]/50 flex flex-col"
                >
                  <div className="relative mb-4">
                    <img
                      src={getCertificateImage(cert) || "/placeholder-certificate.png"}
                      alt={getCertificateName(cert)}
                      className="w-full h-48 object-cover rounded-lg bg-gray-700"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        // Set a data URL placeholder if file doesn't exist
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzVDMTEwLjQ5MyA3NSAxMTkgNjYuNDkzNCAxMTkgNTZDMTE5IDQ1LjUwNjYgMTEwLjQ5MyAzNyAxMDAgMzdDODkuNTA2NiAzNyA4MSA0NS41MDY2IDgxIDU2QzgxIDY2LjQ5MzQgODkuNTA2NiA3NSAxMDAgNzVaIiBmaWxsPSIjNkI3Mjg4Ii8+CjxwYXRoIGQ9Ik01MCA5OUM1MCA5NSA1My40IDg5IDYwIDg5SDEwMEgxNDBDMTQ2LjYgODkgMTUwIDk1IDE1MCA5OVYxMTNINTBWOTlaIiBmaWxsPSIjNkI3Mjg4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5Q0E0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkNlcnRpZmljYXRlPC90ZXh0Pgo8L3N2Zz4K';
                      }}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', e.target.src);
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-[#54D1DC] text-black px-2 py-1 rounded text-xs font-bold">
                      #{cert.tokenId}
                    </div>
                    {/* ⭐ UPDATED: Rarity Badge on Card */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold border ${rarityStyles[getCertificateRarity(cert)]}`}>
                      {getCertificateRarity(cert)}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {getCertificateName(cert)}
                    </h3>

                    {/* Event Name & Category */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {getEventName(cert) && (
                        <div>
                          <span className="text-xs text-gray-400 uppercase tracking-wide">Event</span>
                          <p className="text-[#54D1DC] font-semibold text-sm truncate">
                            {getEventName(cert)}
                          </p>
                        </div>
                      )}
                       {/* ⭐ NEW: Category on Card */}
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Category</span>
                        <p className="text-white font-medium text-sm">
                          {getCertificateCategory(cert)}
                        </p>
                      </div>
                    </div>

                    {/* Recipient & Date */}
                     <div className="grid grid-cols-2 gap-4 mb-3">
                      {getRecipientName(cert) && (
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Recipient</span>
                            <p className="text-white font-medium text-sm truncate">
                              {getRecipientName(cert)}
                            </p>
                          </div>
                      )}
                      {getDateIssued(cert) && (
                          <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Issued</span>
                            <p className="text-gray-300 text-sm">
                              {formatDate(getDateIssued(cert))}
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer with Points and action text */}
                  <div className="mt-auto pt-4 border-t border-gray-700 flex justify-between items-center">
                    {/* ⭐ NEW: Points on Card */}
                    <div className="font-bold text-yellow-400 text-lg">
                      {getCertificatePoints(cert).toLocaleString()} PTS
                    </div>
                    <span className="text-[#54D1DC] text-sm font-semibold">
                      View details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Enhanced Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {getCertificateName(selectedCertificate)}
                  </h3>
                  {getEventName(selectedCertificate) && (
                    <p className="text-[#54D1DC] text-lg font-semibold">
                      {getEventName(selectedCertificate)}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeCertificateModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Certificate Image */}
                <div>
                  <img
                    src={getCertificateImage(selectedCertificate) || "/placeholder-certificate.png"}
                    alt={getCertificateName(selectedCertificate)}
                    className="w-full h-80 object-cover rounded-lg bg-gray-700"
                    onError={(e) => {
                      console.log('Modal image failed to load:', e.target.src);
                      // Set a data URL placeholder
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMDAgNzVDMTEwLjQ5MyA3NSAxMTkgNjYuNDkzNCAxMTkgNTZDMTE5IDQ1LjUwNjYgMTEwLjQ5MyAzNyAxMDAgMzdDODkuNTA2NiAzNyA4MSA0NS41MDY2IDgxIDU2QzgxIDY2LjQ5MzQgODkuNTA2NiA3NSAxMDAgNzVaIiBmaWxsPSIjNkI3Mjg4Ii8+CjxwYXRoIGQ9Ik01MCA5OUM1MCA5NSA1My40IDg5IDYwIDg5SDEwMEgxNDBDMTQ2LjYgODkgMTUwIDk1IDE1MCA5OVYxMTNINTBWOTlaIiBmaWxsPSIjNkI3Mjg4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5Q0E0IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkNlcnRpZmljYXRlPC90ZXh0Pgo8L3N2Zz4K';
                    }}
                    onLoad={(e) => {
                      console.log('Modal image loaded successfully:', e.target.src);
                    }}
                  />
                </div>

                {/* Certificate Details */}
                <div className="space-y-4">
                  {/* Recipient Information */}
                  {getRecipientName(selectedCertificate) && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">
                        Certificate Holder
                      </h4>
                      <p className="text-xl font-bold text-white">
                        {getRecipientName(selectedCertificate)}
                      </p>
                    </div>
                  )}

                  {/* ⭐ UPDATED: Valuation Details in Modal */}
                   <div className="grid grid-cols-3 gap-4">
                      <div className="bg-yellow-600/20 border border-yellow-600 p-3 rounded-lg text-center">
                        <div className="text-xs text-yellow-300 uppercase tracking-wide">Points</div>
                        <p className="text-yellow-100 font-bold text-lg">{getCertificatePoints(selectedCertificate).toLocaleString()}</p>
                      </div>
                       <div className={`border p-3 rounded-lg text-center ${rarityStyles[getCertificateRarity(selectedCertificate)]}`}>
                        <div className="text-xs uppercase tracking-wide opacity-80">Rarity</div>
                        <p className="font-bold">{getCertificateRarity(selectedCertificate)}</p>
                      </div>
                      <div className="bg-gray-600/20 border border-gray-600 p-3 rounded-lg text-center">
                        <div className="text-xs text-gray-300 uppercase tracking-wide">Category</div>
                        <p className="text-gray-100 font-semibold">{getCertificateCategory(selectedCertificate)}</p>
                      </div>
                  </div>

                  {/* Date Issued */}
                  {getDateIssued(selectedCertificate) && (
                    <div className="bg-blue-600/20 border border-blue-600 p-3 rounded-lg">
                      <div className="text-xs text-blue-300 uppercase tracking-wide">Date Issued</div>
                      <p className="text-blue-100 font-semibold">
                        {formatDate(getDateIssued(selectedCertificate))}
                      </p>
                    </div>
                  )}

                  {/* Skills Section */}
                  {getSkills(selectedCertificate).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                        Skills Validated
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {getSkills(selectedCertificate).map((skill, index) => (
                          <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {getCertificateDescription(selectedCertificate) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">
                        Description
                      </h4>
                      <p className="text-gray-200 leading-relaxed">
                        {getCertificateDescription(selectedCertificate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-4">Technical Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Token ID</label>
                    <p className="text-white font-mono">#{selectedCertificate.tokenId}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Network</label>
                    <p className="text-white">XDC Apothem Testnet</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Owner Address</label>
                    <p className="text-white font-mono text-sm break-all">{selectedCertificate.owner}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Contract Address</label>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm break-all">
                        {contractAddress}
                      </p>
                      <button
                        onClick={() => navigator.clipboard?.writeText(contractAddress)}
                        className="text-[#54D1DC] hover:text-[#3fb8c4] text-xs"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                {selectedCertificate.tokenURI && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-400">Metadata URI</label>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm truncate">{selectedCertificate.tokenURI}</p>
                      <a 
                        href={resolveIPFS(selectedCertificate.tokenURI)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#54D1DC] hover:text-[#3fb8c4] text-sm"
                      >
                        View IPFS ↗
                      </a>
                    </div>
                  </div>
                )}

                {/* All Attributes */}
                {getCertificateAttributes(selectedCertificate).length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-400 mb-2 block">All Attributes</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getCertificateAttributes(selectedCertificate).map((attr, index) => (
                        <div key={index} className="bg-gray-700 p-2 rounded">
                          <div className="text-xs text-gray-400">{attr.trait_type}</div>
                          <div className="text-white text-sm">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div className="mt-4">
                  <label className="text-sm text-gray-400">Verification Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-green-400 font-semibold">Verified on Blockchain</p>
                  </div>
                </div>
              </div>
              
              {/* ✅ ACTION BUTTONS RESTORED HERE */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* View Contract Button */}
                  <button
                    onClick={handleViewContract}
                    className="flex-1 bg-[#54D1DC] hover:bg-[#3fb8c4] text-black px-4 py-3 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Contract on XDCScan
                  </button>
                  
                  {/* View Token Details Button */}
                  <button
                    onClick={() => handleViewTokenDetails(selectedCertificate.tokenId)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Token Details
                  </button>
                  
                  {/* Share Certificate Button */}
                  <button
                    onClick={() => handleShareCertificate(selectedCertificate)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share Certificate
                  </button>
                </div>

                {/* Quick Actions Row */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      const tokenUrl = `https://testnet.xdcscan.com/token/${contractAddress}/${selectedCertificate.tokenId}`;
                      navigator.clipboard?.writeText(tokenUrl);
                      setShareSuccess(true);
                      setTimeout(() => setShareSuccess(false), 2000);
                    }}
                    className="text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
                  >
                    Copy Token URL
                  </button>
                  
                  <button
                    onClick={() => {
                      const contractUrl = 'https://testnet.xdcscan.com/address/0x9b40c3c0656434fd89bC50671a29d1814EDA8079';
                      navigator.clipboard?.writeText(contractUrl);
                      setShareSuccess(true);
                      setTimeout(() => setShareSuccess(false), 2000);
                    }}
                    className="text-sm bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors"
                  >
                    Copy Contract URL
                  </button>
                  
                  {selectedCertificate.tokenURI && (
                    <button
                      onClick={() => {
                        const ipfsUrl = resolveIPFS(selectedCertificate.tokenURI);
                        window.open(ipfsUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-sm bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded transition-colors"
                    >
                      View on IPFS
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Share Certificate</h3>
              <button
                onClick={closeShareModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Certificate Preview */}
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <h4 className="text-white font-semibold">{getCertificateName(selectedCertificate)}</h4>
                {getEventName(selectedCertificate) && (
                  <p className="text-[#54D1DC] text-sm">{getEventName(selectedCertificate)}</p>
                )}
                 <div className="mt-2 flex justify-center items-center gap-4 text-xs">
                    <span className={`px-2 py-0.5 rounded font-semibold border ${rarityStyles[getCertificateRarity(selectedCertificate)]}`}>
                        {getCertificateRarity(selectedCertificate)}
                    </span>
                    <span className="text-yellow-400 font-bold">{getCertificatePoints(selectedCertificate)} PTS</span>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                <button
                  onClick={() => shareToLinkedIn(selectedCertificate)}
                  className="w-full bg-[#0077B5] hover:bg-[#005885] text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  Share on LinkedIn
                </button>

                <button
                  onClick={() => shareToTwitter(selectedCertificate)}
                  className="w-full bg-[#1DA1F2] hover:bg-[#0d8bd9] text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Share on Twitter
                </button>
                
                <button
                  onClick={() => copyToClipboard(selectedCertificate)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}