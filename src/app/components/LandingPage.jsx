"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Threads from "./ui/Threads";

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
      className="relative min-h-screen flex items-center px-12 py-20 overflow-hidden"
    >
      {/* Background animation */}
      <div className="absolute inset-0 width-100vw height-100vw">
        <Threads amplitude={2} distance={0} enableMouseInteraction={true} />
      </div>

      {/* Hero Section */}
      <div className="relative z-20 max-w-3xl right-10 text-left">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
          CERTIMOS.
        </h1>
        <h2 className="text-3xl px-6 font-bold text-[#358289] leading-tight">
          Life Verified.
        </h2>
        <p className="text-xl md:text-2xl lg:text-3xl mt-4 mb-8 text-white">
          Tamper-proof, permanent, and verifiable credentials
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-[#358289] px-8 py-4 text-2xl font-bold hover:scale-105 transition-transform"
          >
            ISSUE CERTIFICATES
          </button>

          <button
            onClick={handleConnectWallet}
            className="rounded-lg bg-[#54D1DC] px-8 py-4 text-2xl font-bold hover:scale-105 transition-transform"
          >
            VIEW CERTIFICATES
          </button>
        </div>
      </div>
    </section>
  );
}
