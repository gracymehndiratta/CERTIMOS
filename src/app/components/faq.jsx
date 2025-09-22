"use client";

import React, { useState } from "react";

export default function Faq() {
  const [flippedIndex, setFlippedIndex] = useState(null);

  const toggleFlip = (index) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  const faqData = [
    {
      question: "What problem does Certimos solve?",
      answer:
        "Certificates today are often vulnerable to fraud, difficult to verify, and can get lost in emails or PDFs. ",
    },
    {
      question:
        "What makes Certimos different from traditional PDFs or central databases?",
      answer:
        " Certimos uses blockchain to guarantee long-term authenticity, transparency, and accessibility.",
    },
    {
      question: "How do participants receive and view their certificates?",
      answer:
        "Event organizers upload participant lists,users can view and share all their credentials through the Certimos dashboard.",
    },
    {
      question: "Do I need to understand blockchain to use Certimos?",
      answer:
        "Not at all. Participants just log in, connect their wallet, and access their certificates in a simple React-based dashboard.",
    },
    {
      question: "Is my personal data safe on Certimos?",
      answer:
        "Yes. Sensitive personal data is not stored directly on-chain.",
    },
    {
      question: "How scalable is the system for large events or universities?",
      answer:
        "Certimos is built to handle thousands of certificates at once, making it suitable for large-scale academic programs, training sessions.",
    },
  ];

  return (
    <section
      className="faq-section py-20 bg-black text-white select-none"
      id="faq"
    >
      <h2 className="text-5xl font-bold text-center mb-16 text-[#358289]">
        Frequently Asked Questions
      </h2>

      <div className="faq-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-6 max-w-6xl mx-auto">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="faq-flip-card perspective cursor-pointer"
            onMouseEnter={() => toggleFlip(index)}
            onMouseLeave={() => toggleFlip(index)}
          >
            <div
              className={`faq-flip-inner relative w-full min-h-[300px] transition-transform duration-500 transform-style-preserve-3d ${
                flippedIndex === index ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="faq-front absolute w-full h-full backface-hidden flex items-center justify-center p-8 bg-[#358289] rounded-2xl text-center text-white font-semibold text-xl">
                {item.question}
              </div>

              {/* Back */}
              <div className="faq-back absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center p-8 bg-white/10 rounded-2xl text-center text-white text-base leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>

    
      <style jsx>{`
        .perspective {
          perspective: 1000px;
        }
        .faq-flip-inner {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  );
}
