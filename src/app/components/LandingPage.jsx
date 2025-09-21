"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import DotGrid from "./ui/DotGrid"; // Updated import

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Method 1: Using Google Identity Services (recommended)
      if (typeof window !== "undefined" && window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.prompt();
      } else {
        // Fallback: Direct OAuth URL redirect
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = encodeURIComponent(
          window.location.origin + "/auth/callback"
        );
        const scope = encodeURIComponent("openid email profile");

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;

        window.location.href = googleAuthUrl;
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      // Decode the JWT token to get user info
      const userInfo = JSON.parse(atob(response.credential.split(".")[1]));

      console.log("Google user info:", userInfo);

      // Store user info (in a real app, send this to your backend)
      const userData = {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        sub: userInfo.sub,
      };

      // Store in localStorage or send to your backend
      // localStorage.setItem("googleUser", JSON.stringify(userData));

      // Redirect to admin dashboard
      router.push("/admin-dashboard");
    } catch (error) {
      console.error("Error processing Google response:", error);
      alert("Authentication failed. Please try again.");
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
              onClick={() => router.push("/AdminDashboard")}
              disabled={isLoading}
              className="rounded-lg bg-white text-black px-6 py-4 z-20 text-2xl font-bold hover:scale-105 transition-transform"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                "ISSUE CERTIFICATES"
              )}
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