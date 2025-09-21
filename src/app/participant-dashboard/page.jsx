"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Replace with your deployed ERC-721 contract on Apothem testnet
const CONTRACT_ADDRESS = "0xb5d038cbf72bdbc4e041d1eaaca15c04965dbb31";

// Extended ABI with more functions for debugging
const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  // ERC721 events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Helper function to resolve IPFS URLs
function resolveIPFS(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

export default function ParticipantDashboard() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (!window.ethereum) {
      setMetaMaskInstalled(false);
      return;
    }

    const storedWallet = localStorage.getItem("walletAddress");
    if (!storedWallet) {
      alert("No wallet connected!");
      return;
    }
    setWallet(storedWallet);
    fetchWalletData(storedWallet);
  }, [isClient]);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo((prev) => prev + "\n" + message);
  };

  const fetchWalletData = async (address) => {
    if (!window.ethereum) {
      setMetaMaskInstalled(false);
      return;
    }

    try {
      addDebugInfo("🔍 Starting wallet data fetch...");

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const apothemChainId = "0x33"; // Apothem Testnet

      if (chainId !== apothemChainId) {
        addDebugInfo("⚠️ Wrong network detected, switching to Apothem...");
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      addDebugInfo("✅ Provider and signer connected");

      // Fetch XDC balance
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
      addDebugInfo(`💰 XDC Balance: ${ethers.formatEther(bal)} XDC`);

      let contractAddress = CONTRACT_ADDRESS;
      if (CONTRACT_ADDRESS.startsWith("xdc")) {
        contractAddress = "0x" + CONTRACT_ADDRESS.slice(3);
      }

      if (!ethers.isAddress(contractAddress)) {
        throw new Error(`Invalid contract address: ${contractAddress}`);
      }

      addDebugInfo(`📄 Contract Address: ${contractAddress}`);

      // Check if contract exists
      const code = await provider.getCode(contractAddress);
      if (code === "0x") {
        throw new Error("Contract does not exist at this address");
      }
      addDebugInfo("✅ Contract exists on network");

      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );

      // Check contract interfaces
      try {
        // ERC721Enumerable interface ID: 0x780e9d63
        const supportsEnumerable = await contract.supportsInterface(
          "0x780e9d63"
        );
        addDebugInfo(`🔍 Supports ERC721Enumerable: ${supportsEnumerable}`);
      } catch (err) {
        addDebugInfo("⚠️ Cannot check interface support");
      }

      // Check NFT balance
      const nftBalance = await contract.balanceOf(address);
      const balanceNum = Number(nftBalance);
      addDebugInfo(`🎫 NFT Balance: ${balanceNum}`);

      if (balanceNum === 0) {
        addDebugInfo("ℹ️ No NFTs found in this wallet");
        setCertificates([]);
        setLoading(false);
        return;
      }

      const nftArray = [];

      // Try different methods to get tokens
      addDebugInfo("🔄 Attempting to fetch NFTs...");

      // Method 1: Try tokenOfOwnerByIndex (ERC721Enumerable)
      let method1Success = false;
      try {
        addDebugInfo("Method 1: Using tokenOfOwnerByIndex");
        for (let i = 0; i < balanceNum; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(address, i);
            const tokenURI = await contract.tokenURI(tokenId);
            const resolvedURI = resolveIPFS(tokenURI);

            addDebugInfo(`✅ Found token ${tokenId} at index ${i}`);

            try {
              const metadataResponse = await fetch(resolvedURI);
              const metadata = await metadataResponse.json();
              nftArray.push({ tokenId: tokenId.toString(), ...metadata });
            } catch (metaErr) {
              addDebugInfo(
                `⚠️ Metadata error for token ${tokenId}: ${metaErr.message}`
              );
              nftArray.push({
                tokenId: tokenId.toString(),
                name: `Certificate #${tokenId}`,
                description: "Metadata unavailable",
                image: "/placeholder-certificate.png",
              });
            }
          } catch (indexErr) {
            addDebugInfo(`❌ Error at index ${i}: ${indexErr.message}`);
            break;
          }
        }
        if (nftArray.length > 0) method1Success = true;
      } catch (enumErr) {
        addDebugInfo(`❌ Method 1 failed: ${enumErr.message}`);
      }

      // Method 2: Try using Transfer events with recent block range if Method 1 failed
      if (!method1Success) {
        try {
          addDebugInfo("Method 2: Using Transfer events (recent blocks only)");

          // Get current block number
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks to avoid timeout

          addDebugInfo(
            `Searching events from block ${fromBlock} to ${currentBlock}`
          );

          // Get Transfer events where 'to' is the user's address
          const transferFilter = contract.filters.Transfer(null, address);
          const toEvents = await contract.queryFilter(
            transferFilter,
            fromBlock,
            "latest"
          );

          // Get Transfer events where 'from' is the user's address (tokens sent away)
          const fromFilter = contract.filters.Transfer(address, null);
          const fromEvents = await contract.queryFilter(
            fromFilter,
            fromBlock,
            "latest"
          );

          addDebugInfo(
            `Found ${toEvents.length} incoming transfers, ${fromEvents.length} outgoing transfers`
          );

          // Build a map of tokens currently owned
          const tokenOwnership = {};

          // Add all received tokens
          for (const event of toEvents) {
            const tokenId = event.args.tokenId.toString();
            tokenOwnership[tokenId] = true;
          }

          // Remove all sent tokens
          for (const event of fromEvents) {
            const tokenId = event.args.tokenId.toString();
            delete tokenOwnership[tokenId];
          }

          const ownedTokenIds = Object.keys(tokenOwnership);
          addDebugInfo(
            `Potentially owned tokens from recent events: ${ownedTokenIds.join(
              ", "
            )}`
          );

          // Verify ownership and fetch metadata
          for (const tokenId of ownedTokenIds) {
            try {
              const currentOwner = await contract.ownerOf(tokenId);
              if (currentOwner.toLowerCase() === address.toLowerCase()) {
                addDebugInfo(`✅ Confirmed ownership of token ${tokenId}`);

                try {
                  const tokenURI = await contract.tokenURI(tokenId);
                  const resolvedURI = resolveIPFS(tokenURI);
                  const metadataResponse = await fetch(resolvedURI);
                  const metadata = await metadataResponse.json();
                  nftArray.push({ tokenId: tokenId.toString(), ...metadata });
                } catch (metaErr) {
                  addDebugInfo(
                    `⚠️ Metadata error for token ${tokenId}: ${metaErr.message}`
                  );
                  nftArray.push({
                    tokenId: tokenId.toString(),
                    name: `Certificate #${tokenId}`,
                    description: "Metadata unavailable",
                    image: "/placeholder-certificate.png",
                  });
                }
              }
            } catch (ownerErr) {
              addDebugInfo(
                `❌ Error checking ownership of token ${tokenId}: ${ownerErr.message}`
              );
            }
          }
        } catch (eventErr) {
          addDebugInfo(`❌ Method 2 failed: ${eventErr.message}`);
        }
      }

      // Method 3: Manual token ID scanning if other methods failed
      if (nftArray.length === 0) {
        try {
          addDebugInfo("Method 3: Manual token ID scanning");
          addDebugInfo(
            "⚠️ This is a fallback method - you should ask the contract deployer for the actual token IDs"
          );

          // Since we know balanceOf returns 3, try common token ID patterns
          const tokenIdPatterns = [
            // Sequential starting from 0
            ...Array.from(
              { length: Math.min(100, balanceNum * 10) },
              (_, i) => i
            ),
            // Sequential starting from 1
            ...Array.from(
              { length: Math.min(100, balanceNum * 10) },
              (_, i) => i + 1
            ),
            // Common timestamp-based patterns (if minted recently)
            ...Array.from({ length: 10 }, (_, i) => Date.now() - i * 86400000), // Last 10 days
          ];

          let foundCount = 0;
          for (const tokenId of tokenIdPatterns) {
            if (foundCount >= balanceNum) break; // Found enough tokens

            try {
              const owner = await contract.ownerOf(tokenId);
              if (owner.toLowerCase() === address.toLowerCase()) {
                addDebugInfo(`✅ Found owned token ${tokenId}`);
                foundCount++;

                try {
                  const tokenURI = await contract.tokenURI(tokenId);
                  const resolvedURI = resolveIPFS(tokenURI);
                  const metadataResponse = await fetch(resolvedURI);
                  const metadata = await metadataResponse.json();
                  nftArray.push({ tokenId: tokenId.toString(), ...metadata });
                } catch (metaErr) {
                  addDebugInfo(
                    `⚠️ Metadata error for token ${tokenId}: ${metaErr.message}`
                  );
                  nftArray.push({
                    tokenId: tokenId.toString(),
                    name: `Certificate #${tokenId}`,
                    description: "Metadata unavailable",
                    image: "/placeholder-certificate.png",
                  });
                }
              }
            } catch (ownerErr) {
              // Token doesn't exist or other error, continue scanning
              if (tokenId < 1000) {
                // Only log for reasonable token IDs
                // Don't log every failed attempt to avoid spam
              }
            }

            // Add small delay to avoid overwhelming the RPC
            if (tokenId % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          if (foundCount < balanceNum) {
            addDebugInfo(
              `⚠️ Only found ${foundCount} of ${balanceNum} expected tokens`
            );
            addDebugInfo(
              "💡 Consider asking the contract deployer for the actual token IDs"
            );
          }
        } catch (scanErr) {
          addDebugInfo(`❌ Method 3 failed: ${scanErr.message}`);
        }
      }

      // Method 4: Ask user for token IDs if all else fails
      if (nftArray.length === 0 && balanceNum > 0) {
        addDebugInfo("Method 4: Manual token ID entry required");
        addDebugInfo(
          "💡 Since automatic detection failed, you may need to manually enter token IDs"
        );

        // Show a message to the user
        const userTokenIds = prompt(
          `Your wallet has ${balanceNum} NFTs but we couldn't auto-detect them.\n` +
            `Please enter the token IDs separated by commas (e.g., "1,2,3"):\n` +
            `You can find these on the blockchain explorer or ask the contract deployer.`
        );

        if (userTokenIds) {
          const tokenIds = userTokenIds.split(",").map((id) => id.trim());
          addDebugInfo(`User provided token IDs: ${tokenIds.join(", ")}`);

          for (const tokenId of tokenIds) {
            try {
              const owner = await contract.ownerOf(tokenId);
              if (owner.toLowerCase() === address.toLowerCase()) {
                addDebugInfo(
                  `✅ Confirmed ownership of manually entered token ${tokenId}`
                );

                try {
                  const tokenURI = await contract.tokenURI(tokenId);
                  const resolvedURI = resolveIPFS(tokenURI);
                  const metadataResponse = await fetch(resolvedURI);
                  const metadata = await metadataResponse.json();
                  nftArray.push({ tokenId: tokenId.toString(), ...metadata });
                } catch (metaErr) {
                  nftArray.push({
                    tokenId: tokenId.toString(),
                    name: `Certificate #${tokenId}`,
                    description: "Metadata unavailable",
                    image: "/placeholder-certificate.png",
                  });
                }
              } else {
                addDebugInfo(`❌ You don't own token ${tokenId}`);
              }
            } catch (ownerErr) {
              addDebugInfo(
                `❌ Error checking token ${tokenId}: ${ownerErr.message}`
              );
            }
          }
        }
      }

      addDebugInfo(`🎉 Successfully loaded ${nftArray.length} certificates`);
      setCertificates(nftArray);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      addDebugInfo(`💥 Fatal error: ${err.message}`);
      alert("Error fetching NFTs or balance: " + err.message);
      setLoading(false);
    }
  };

  if (!metaMaskInstalled) return <div>MetaMask is not installed!</div>;
  if (!wallet) return <div>Loading wallet...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-8 py-12">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Your Dashboard</h1>
        <div className="text-xl">
          Wallet: {wallet} <br />
          Balance: {balance ? `${balance} XDC` : "Loading..."}
        </div>
      </header>

      {/* Debug Information Section */}
      {debugInfo && (
        <section className="mb-8">
          <details className="bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer text-yellow-400 font-semibold">
              🐛 Debug Information (Click to expand)
            </summary>
            <pre className="mt-4 text-xs text-gray-300 whitespace-pre-wrap bg-gray-900 p-4 rounded overflow-x-auto">
              {debugInfo}
            </pre>
          </details>
        </section>
      )}

      <section>
        <h2 className="text-3xl font-bold mb-6">Your Certificates</h2>
        {loading ? (
          <p>Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-200">
              No certificates found in this wallet.
            </p>
            <p className="text-yellow-300 text-sm mt-2">
              Check the debug information above to see what methods were
              attempted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div
                key={cert.tokenId}
                className="bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <img
                  src={
                    resolveIPFS(cert.image) || "/placeholder-certificate.png"
                  }
                  alt={cert.name}
                  className="w-full h-48 object-contain mb-4 rounded-lg"
                  onError={(e) => {
                    e.target.src = "/placeholder-certificate.png";
                  }}
                />
                <h3 className="text-xl font-bold mb-2">
                  {cert.name || `Certificate #${cert.tokenId}`}
                </h3>
                <p className="text-gray-300 mb-2">Token ID: {cert.tokenId}</p>
                {cert.description && (
                  <p className="text-gray-400 mb-2 text-sm">
                    {cert.description}
                  </p>
                )}
                {cert.transactionHash && (
                  <a
                    href={`https://explorer.apothem.network/tx/${cert.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#54D1DC] underline"
                  >
                    View on Apothem Explorer
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
