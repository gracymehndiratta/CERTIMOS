"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

// Individual animated item
const AnimatedItem = ({ id, text, imgSrc, isReversed }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  const textVariants = {
    hidden: {
      opacity: 0,
      x: isReversed ? 150 : -150,
      skewX: isReversed ? -10 : 10,
    },
    visible: {
      opacity: 1,
      x: 0,
      skewX: 0,
      transition: { duration: 1.5, ease: "easeOut" },
    },
  };

  // Glow color based on id
  let glowColorClass = "";
  if (id === "transparency") glowColorClass = "bg-purple-500";
  else if (id === "accountability") glowColorClass = "bg-sky-400";
  else if (id === "inclusivity") glowColorClass = "bg-white";

  return (
    <div
      ref={ref}
      id={id}
      className={`min-h-[100vh] relative p-8 flex items-center justify-center overflow-hidden`}
    >
      <div
        className={`w-full max-w-6xl flex items-center justify-between ${
          isReversed ? "flex-row-reverse" : ""
        }`}
      >
        {/* Image with parallax */}
        <motion.div style={{ y: imageY }} className="flex-1 p-4 z-10">
          <div className="relative animate-float">
            <Image src={imgSrc} alt={text} width={500} height={500} />
            <div
              className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 rounded-full blur-3xl opacity-60 ${glowColorClass}`}
            ></div>
          </div>
        </motion.div>

        {/* Text with fade-in */}
        <motion.div
          style={{ y: textY }}
          className="flex-1 p-4 text-center z-20"
        >
          <motion.h3
            className="text-5xl font-extrabold drop-shadow-lg text-[#54D1DC]"
            variants={textVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            {text}
          </motion.h3>
        </motion.div>
      </div>
    </div>
  );
};

// Main About page
export default function AboutPage() {
  return (
    <section className="bg-gray-950 text-white relative">
      {/* Sticky heading */}
      <div className="sticky top-0 bg-gray-950 text-white pt-20 pb-16 z-30">
        <h3 className="text-6xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#54D1DC] to-white">
          Why Choose Us?
        </h3>
      </div>

      {/* Animated items */}
      <div className="relative z-10">
        <AnimatedItem
          id="future"
          text="Future-Proof"
          imgSrc="/transparency.svg"
          isReversed={false}
        />
        <AnimatedItem
          id="accessibility"
          text="Global Accessibility"
          imgSrc="/accountability.svg"
          isReversed={true}
        />
        <AnimatedItem
          id="Blockchain"
          text="Blockchain-Powered Certificates"
          imgSrc="/inclusivity.svg"
          isReversed={false}
        />
      </div>
    </section>
  );
}
