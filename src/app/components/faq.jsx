"use client";

import React, { useState } from "react";
import DotGrid from "./ui/DotGrid";
import Link from "next/link";

export default function Faq() {
  const [flippedIndex, setFlippedIndex] = useState(null);

  const toggleFlip = (index) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  const faqData = [
    {
      question: "What problem does Certimos solve?",
      answer:
        "Certificates today are often vulnerable to fraud, difficult to verify, and can get lost in emails or PDFs.",
    },
    {
      question:
        "What makes Certimos different from traditional PDFs or central databases?",
      answer:
        "Certimos uses blockchain to guarantee long-term authenticity, transparency, and accessibility.",
    },
    {
      question: "How do participants receive and view their certificates?",
      answer:
        "Event organizers upload participant lists, and users can view and share all their credentials through the Certimos dashboard.",
    },
    {
      question: "Do I need to understand blockchain to use Certimos?",
      answer:
        "Not at all. Participants just log in, connect their wallet, and access their certificates in a simple React-based dashboard.",
    },
    {
      question: "Is my personal data safe on Certimos?",
      answer: "Yes. Sensitive personal data is not stored directly on-chain.",
    },
    {
      question: "How scalable is the system for large events or universities?",
      answer:
        "Certimos is built to handle thousands of certificates at once, making it suitable for large-scale academic programs or training sessions.",
    },
  ];

  return (
    <section className="faq-section relative select-none" id="faq">
      {/* Background DotGrid */}
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

      {/* Section Content */}
      <div className="relative z-50 px-4 py-16">
        <h2 className="faq-title  text-white text-3xl sm:text-4xl font-bold mb-10 text-center">
          Frequently Asked Questions
        </h2>

        <div className="faq-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="faq-flip-card perspective relative w-[320px] h-[220px] sm:w-[380px] sm:h-[260px] lg:w-[420px] lg:h-[280px] cursor-pointer"
              onMouseEnter={() => toggleFlip(index)}
              onMouseLeave={() => toggleFlip(index)}
            >
              <div
                className={`faq-flip-inner relative w-full h-full duration-500 transform ${
                  flippedIndex === index ? "rotate-y-180" : ""
                }`}
              >
                {/* Front */}
                <div className="faq-front absolute w-full h-full flex items-center justify-center text-center text-lg sm:text-xl font-semibold p-6 bg-[#54D1DC] text-black rounded-2xl shadow-lg backface-hidden">
                  {item.question}
                </div>

                {/* Back */}
                <div className="faq-back absolute w-full h-full flex items-center justify-center text-center text-base sm:text-lg p-6 bg-blue-200 text-gray-800 rounded-2xl shadow-lg rotate-y-180 backface-hidden">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
