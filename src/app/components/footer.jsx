import React from "react";
import { FaInstagram, FaWhatsapp, FaFacebook } from "react-icons/fa";
import DotGrid from "./ui/DotGrid";

function Footer() {
  return (
    <footer className="bg-black text-gray-300 px-8 py-10">
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
        {/* Dark overlay to make cards pop */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/40"></div>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 z-50 md:grid-cols-3 gap-52">
        {/* Left - About */}
        <div>
          <p className="text-sm z-50 leading-relaxed">
            <span className="text-teal-400 font-semibold">CERTIMOS</span>
             is a blockchain-based platform for issuing and verifying
            certificates and badges as NFTs. It ensures tamper-proof, permanent,
            and verifiable credentials for participants, while providing
            organizers with a seamless certificate management system.
          </p>
          <div className="z-50 flex space-x-4 mt-4">
            <a href="#" className="hover:text-teal-400 z-50">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="hover:text-teal-400 z-50">
              <FaWhatsapp size={20} />
            </a>
            <a href="#" className="hover:text-teal-400 z-50">
              <FaFacebook size={20} />
            </a>
          </div>
        </div>

        {/* Middle - Quick Links */}
        <div>
          <h4 className="text-white z-50 font-semibold mb-3">Quick links</h4>
          <ul className="space-y-2 z-50 text-sm">
            <li>
              <a href="#about" className="hover:text-teal-400 z-50">
                About
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-teal-400 z-50">
                Features
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-teal-400 z-50">
                FAQs
              </a>
            </li>
          </ul>
        </div>

        {/* Right - Contact */}
        <div>
          <h4 className="text-white z-50 font-semibold mb-3">Contact Us</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:xyz@gmail.com" className="hover:text-teal-400">
                xyz@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+91678567567" className="hover:text-teal-400">
                +91 678567567
              </a>
            </li>
            <li>
              <span className="hover:text-teal-400 cursor-pointer">
                Vellore, India
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs text-gray-500">
        © 2025 Neighborly. All rights reserved
      </div>
    </footer>
  );
}

export default Footer;
