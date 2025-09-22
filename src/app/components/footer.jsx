import React from "react";
import { FaInstagram, FaWhatsapp, FaFacebook } from "react-icons/fa";

function Footer() {
  return (
    <footer className="relative bg-gray-800 px-8 py-10 z-50">
      {/* Solid background overlay to block dot grid */}
      <div className="absolute inset-0 bg-black"></div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-52">
          {/* Left - About */}
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-teal-400 font-bold">CERTIMOS </span>
              is a blockchain-based platform for issuing and verifying
              certificates and badges as NFTs. It ensures tamper-proof,
              permanent, and verifiable credentials for participants, while
              providing organizers with a seamless certificate management
              system.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="#"
                className="text-gray-300 hover:text-teal-400 transition-colors"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-teal-400 transition-colors"
              >
                <FaWhatsapp size={20} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-teal-400 transition-colors"
              >
                <FaFacebook size={20} />
              </a>
            </div>
          </div>

          {/* Middle - Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Quick links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#about"
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                >
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Right - Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:xyz@gmail.com"
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                >
                  xyz@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+91678567567"
                  className="text-gray-300 hover:text-teal-400 transition-colors"
                >
                  +91 678567567
                </a>
              </li>
              <li>
                <span className="text-gray-300 hover:text-teal-400 cursor-pointer transition-colors">
                  Vellore, India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="border-t border-gray-600 mt-8 pt-4 text-center text-xs text-gray-400">
          © 2025 Certimos. All rights reserved
        </div>
      </div>
    </footer>
  );
}

export default Footer;
