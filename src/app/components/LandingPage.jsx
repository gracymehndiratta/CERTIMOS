"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import DotGrid from "./ui/DotGrid"; // Updated import

export default function LandingPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const walletAddress = accounts[0];
        console.log("Connected wallet:", walletAddress);

   
        localStorage.setItem("walletAddress", walletAddress);

        // Redirect to dashboard
        router.push("/participant-dashboard"); // change this route as needed
      } catch (err) {
        console.error(err);
        alert("Wallet connection failed");
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
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative select-none"
    >
      {/* Grid Background - Full screen */}
  

      {/* Content overlay */}
      <div className="max-w-7xl w-full flex flex-col lg:flex-row items-start justify-start relative z-40">
        <div className="flex-1 max-w-2xl text-left">
          <h1 className=" px-6 py-6 text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            CERTIMOS.
          </h1>
        
          <p className=" px-6 py-6 opacity-55 text-xl md:text-2xl lg:text-3xl mt-4 mb-8 text-white">
            Tamper-proof, permanent, and verifiable credentials
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-start">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-white text-black px-6 py-4 z-20 text-2xl font-bold hover:scale-105 transition-transform"
            >
              ISSUE CERTIFICATES
            </button>

            <button
              onClick={handleConnectWallet}
              className="rounded-lg bg-black text-white px-8 py-4 border-white text-2xl font-bold hover:scale-105 transition-transform"
            >
              VIEW CERTIFICATES
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}