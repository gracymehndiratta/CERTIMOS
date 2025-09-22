"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
      <header className="fixed top-0 left-0 right-0 z-50 select-none">
        <div
          className={`transition-all duration-300 ${
            isScrolled ? "pt-2" : "pt-4"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            {/* Logo */}
            <div className="relative w-[160px] h-[60px]">
              <Image
                src="/logo.webp"
                alt="Logo"
                fill
                className="text-white object-contain"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-between px-9 lg:px-28 py-3 bg-[#3e4040cc] backdrop-blur-md rounded-full shadow-lg border border-white/10 gap-8">
              {navItems.map(({ label, path }) => (
                <a
                  key={label}
                  href={path}
                  className="text-lg lg:text-xl font-semibold text-white hover:text-[#54D1DC] transition-colors duration-200 relative group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#54D1DC] transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </nav>

            {/* Login Button - Desktop */}
            <div className="hidden md:block">
              <a
                href="/login"
                className="px-6 py-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 font-bold text-sm"
              >
                VERIFY CERTIFICATES
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 bg-[#3e4040cc] backdrop-blur-md rounded-full shadow-lg border border-white/10 text-white"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  isMobileMenuOpen ? "rotate-90" : ""
                }`}
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
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div className="absolute top-20 left-4 right-4 bg-[#2a2a2a] backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 py-6">
            <div className="flex flex-col space-y-4 px-6">
              {navItems.map(({ label, path }) => (
                <a
                  key={label}
                  href={path}
                  className="text-xl font-semibold text-white hover:text-[#54D1DC] transition-colors duration-200 py-2 border-b border-white/10 last:border-b-0"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}

              <a
                href="/login"
                className="block w-full text-center px-6 py-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 font-bold text-lg mt-4"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LOGIN
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
