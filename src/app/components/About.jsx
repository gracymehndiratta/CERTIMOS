"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useAnimation } from "framer-motion";
import DotGrid from "./ui/DotGrid";

export default function AboutPage() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center select-none">
      {/* Full-page Dot Grid */}
      <div className="fixed top-0 left-0 w-full h-full z-10">
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

      {/* Sticky heading */}
      <div className="sticky top-0 bg-transparent text-white pt-20 pb-16 z-10">
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#54D1DC] to-white animate-pulse">
          Why Choose Us?
        </h3>
      </div>

      {/* Animated items */}
      <div className="relative z-20 flex flex-col gap-20 px-4 md:px-16 max-w-6xl mx-auto">
        <AnimatedItem
          id="future"
          text="Future-Proof"
          description="Our blockchain-based certificates ensure your credentials remain verifiable forever."
          imgSrc="/transparency.svg"
          isReversed={false}
        />
        <AnimatedItem
          id="accessibility"
          text="Global Accessibility"
          description="Access and share your certificates from anywhere in the world using a simple dashboard."
          imgSrc="/accountability.svg"
          isReversed={true}
        />
        <AnimatedItem
          id="blockchain"
          text="Blockchain-Powered Certificates"
          description="Tamper-proof, transparent, and secure certificates stored on-chain for trust and credibility."
          imgSrc="/inclusivity.svg"
          isReversed={false}
        />
      </div>
    </section>
  );
}

// Animated Item component
function AnimatedItem({ text, description, imgSrc, isReversed }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  if (isInView) {
    controls.start({ opacity: 1, x: 0 });
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isReversed ? 100 : -100 }}
      animate={controls}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
        isReversed ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className="flex-1 relative w-full md:w-1/2">
        <Image
          src={imgSrc}
          alt={text}
          width={500}
          height={500}
          className="w-full h-auto object-contain animate-float"
        />
      </div>
      <div className="flex-1 md:w-1/2 text-center md:text-left">
        <h4 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
          {text}
        </h4>
        <p className="text-gray-300 text-lg md:text-xl">{description}</p>
      </div>
      
    </motion.div>
  );
}
