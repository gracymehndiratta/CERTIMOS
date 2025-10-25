"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleAdminAccess = () => {
    router.push("/AdminDashboard");
  };

  const handleConnectWallet = async () => {
    // Clear previous connection
    localStorage.removeItem("walletAddress");

    if (typeof window.ethereum !== "undefined") {
      try {
        setIsLoading(true);

        // Request accounts - this will show the MetaMask popup
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const walletAddress = accounts[0];
        // Wallet connected successfully

        // Check if we're on the correct network (XDC Apothem)
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const apothemChainId = "0x33"; // XDC Apothem Testnet

        if (chainId !== apothemChainId) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: apothemChainId }],
            });
          } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: apothemChainId,
                    chainName: "XDC Apothem Network",
                    nativeCurrency: {
                      name: "XDC",
                      symbol: "XDC",
                      decimals: 18,
                    },
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

        localStorage.setItem("walletAddress", walletAddress);

        // Redirect to dashboard
        router.push("/participant-dashboard");
      } catch (err) {
        // console.error(err);
        if (err.code === 4001) {
          alert("Connection rejected by user");
        } else if (err.code === 4902) {
          alert("Please add XDC Apothem Network to your MetaMask");
        } else {
          alert(
            "Wallet connection failed: " + (err.message || "Unknown error")
          );
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      alert(
        "MetaMask is not installed! Please install it from https://metamask.io/"
      );
    }
  };

  return (
    <section
      id="home"
      className="min-h-screen flex flex-col items-center justify-center px-2 sm:px-4 py-12 sm:py-20 relative select-none"
    >
      {/* Grid Background - Full screen */}

      {/* Content overlay */}
      <div className="max-w-7xl w-full flex flex-col lg:flex-row items-start justify-start z-50 ">
        <div className="flex-1 max-w-2xl text-left">
          <h1 className="px-4 sm:px-6 py-4 sm:py-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            CERTIMOS.
          </h1>

          <p className="px-4 sm:px-6 py-4 sm:py-6 opacity-55 text-lg sm:text-xl md:text-2xl lg:text-3xl mt-2 sm:mt-4 mb-6 sm:mb-8 text-white">
            Tamper-proof, permanent, and verifiable credentials
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start px-4 sm:px-6">
            <button
              onClick={handleAdminAccess}
              disabled={isLoading}
              className="relative rounded-lg bg-white text-black px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl lg:text-2xl font-bold hover:scale-105 transition-transform w-full sm:w-auto"
            >
              ISSUE CERTIFICATES
            </button>

            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className="relative rounded-lg bg-black text-white px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl lg:text-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Connecting...
                </div>
              ) : (
                "VIEW CERTIFICATES"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
