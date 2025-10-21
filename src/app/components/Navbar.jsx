"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "HOME", path: "#home" },
    { label: "WHY US?", path: "#about" },
    { label: "FEATURES", path: "#features" },
    { label: "FAQs", path: "#faq" },
  ];

  return (
    <>
      {/* Fixed Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#1e1e1ecc] backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center relative h-16">
          {/* Logo */}
          <div className="relative w-[140px] h-[50px] flex items-center group">
            <Image
              src="/logo.webp"
              alt="Logo"
              fill
              className="object-contain"
            />
            <p className="text-2xl font-extrabold ml-36 text-white tracking-wide group-hover:text-[#54D1DC] transition-colors duration-300">
              CERTIMOS
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center px-9 lg:px-28 py-2 bg-[#3e4040cc] backdrop-blur-md rounded-full shadow-lg border border-white/10 gap-8">
            {navItems.map(({ label, path }, i) => (
              <motion.a
                key={label}
                href={path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-lg lg:text-xl font-semibold text-white hover:text-[#54D1DC] transition-colors duration-300 relative group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#54D1DC] transition-all duration-300 group-hover:w-full"></span>
              </motion.a>
            ))}
          </nav>

          {/* Desktop Dashboard Buttons */}
          <div className="hidden md:flex ml-auto gap-3">
            <motion.a
              href="/participant-dashboard"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="px-4 py-2 bg-[#54D1DC] text-black rounded-full font-semibold hover:bg-[#4CC5D0] transition-all duration-200 text-sm"
            >
              User Dashboard
            </motion.a>
            <motion.a
              href="/AdminDashboard"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 text-sm"
            >
              Admin Dashboard
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden ml-auto p-3 bg-[#3e4040cc] backdrop-blur-md rounded-full shadow-lg border border-white/10 text-white transition hover:scale-105"
          >
            <motion.svg
              initial={false}
              animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.3 }}
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </motion.svg>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute top-20 left-4 right-4 bg-[#2a2a2a] backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 py-6"
            >
              <div className="flex flex-col space-y-4 px-6">
                {navItems.map(({ label, path }, i) => (
                  <motion.a
                    key={label}
                    href={path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-xl font-semibold text-white hover:text-[#54D1DC] transition-colors duration-200 py-2 border-b border-white/10 last:border-b-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {label}
                  </motion.a>
                ))}

                <div className="space-y-3 pt-4">
                  <motion.a
                    href="/participant-dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="block w-full text-center px-6 py-3 bg-[#54D1DC] text-black rounded-full shadow-lg hover:bg-[#4CC5D0] transition-all duration-200 font-bold text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    User Dashboard
                  </motion.a>
                  <motion.a
                    href="/AdminDashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="block w-full text-center px-6 py-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 font-bold text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
