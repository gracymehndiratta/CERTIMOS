"use client";

import { useState } from "react";
import DotGrid from "./ui/DotGrid";
import { motion } from "framer-motion";

export default function FeaturesPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const organizers = [
    {
      title: "Secure Sign-In",
      description:
        "Log in to the Organizer Portal using your Google account for secure, authorized access.",
    },
    {
      title: "Enter Event Details",
      description:
        "Fill out a simple form with the event name, date, and upload a template for the certificates.",
    },
    {
      title: "Upload Participant List",
      description:
        "Provide a CSV file containing participant names and their public wallet addresses.",
    },
    {
      title: "Issue Certificates",
      description:
        "With one click, our system mints and delivers secure, verifiable NFT certificates to all participants.",
    },
  ];

  const participants = [
    {
      title: "Connect Your Wallet",
      description:
        "Simply connect your MetaMask or any other compatible crypto wallet. No sign-up is needed.",
    },
    {
      title: "View Your Dashboard",
      description:
        "Instantly access your personal dashboard where all your earned NFT certificates are displayed.",
    },
    {
      title: "Manage & Showcase",
      description:
        "Click on any certificate to view its details, verify its authenticity on the blockchain, and share it.",
    },
    {
      title: "True Ownership",
      description:
        "Your certificates are NFTs that you truly own. They stay in your wallet, forever verifiable and accessible.",
    },
  ];

  return (
    <section
      id="features"
      className="min-h-screen select-none bg-gray-950 text-white relative overflow-hidden"
    >
      {/* Animated DotGrid Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <DotGrid
          dotSize={5}
          gap={12}
          baseColor="#271E37"
          activeColor="#358289"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          className="w-full h-full"
        />
      </div>

      {/* Header */}
      <div className="relative z-50 text-center pt-20 pb-12">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#54D1DC] to-white mb-4">
          How CertiMos Works
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto px-4">
          A simple, secure, and transparent process for both issuers and
          recipients.
        </p>
      </div>

      {/* Two-Column Section */}
      <div className="relative z-50 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-6 pb-20">
        {/* Organizers */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-[#54D1DC]">
            For Organizers
          </h2>
          <ul className="space-y-4">
            {organizers.map((item, idx) => (
              <motion.li
                key={idx}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`p-4 rounded-lg transition-all ${
                  hoveredCard === idx ? "bg-white/10" : "bg-transparent"
                }`}
              >
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Participants */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-[#54D1DC]">
            For Participants
          </h2>
          <ul className="space-y-4">
            {participants.map((item, idx) => (
              <motion.li
                key={idx}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoveredCard(`p-${idx}`)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`p-4 rounded-lg transition-all ${
                  hoveredCard === `p-${idx}` ? "bg-white/10" : "bg-transparent"
                }`}
              >
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
