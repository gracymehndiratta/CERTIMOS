"use client";

import { useState } from "react";
import { featuresData } from "./data/featuresData"; // Your features data
import FlowingMenu from "./ui/FlowingMenu";

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Map featuresData to FlowingMenu format
  const flowingMenuItems = featuresData.map((f, idx) => ({
    link: f.link || "#",
    text: f.title,
    image: f.image || `https://picsum.photos/600/400?random=${idx + 1}`,
    originalFeature: f, // keep original for details
  }));

  return (
    <section
      id="features"
      className="min-h-screen select-none bg-black relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-[#54D1DC] rounded-full opacity-5 blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-10 w-40 h-40 bg-[#2cf2f9] rounded-full opacity-5 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#4ECDC4] rounded-full opacity-3 blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-20 pb-12">
        <h1 className="text-6xl md:text-6xlz-40 font-bold text-[#43cfdc] mb-4">
          Features
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto px-4">
          Experience the future with our comprehensive digital platform
        </p>
      </div>

      {/* Flowing Menu - Full Width Horizontal Strip */}
      <div className="relative w-[300vh] h-[60vh] mb-16 z-10">
        <FlowingMenu
          items={flowingMenuItems}
          onSelect={(item) => setSelectedFeature(item.originalFeature)}
        />
      </div>

      {/* Feature Details Section */}
      {selectedFeature && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
          <div
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 relative overflow-hidden animate-fade-in"
            style={{
              background: `linear-gradient(135deg, ${
                selectedFeature.color || "#4ECDC4"
              }10, rgba(255,255,255,0.05))`,
            }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 opacity-10 blur-3xl"
              style={{ backgroundColor: selectedFeature.color || "#4ECDC4" }}
            />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div
                  className="text-3xl mr-2"
                  style={{
                    filter: `drop-shadow(0 0 10px ${
                      selectedFeature.color || "#4ECDC4"
                    })`,
                  }}
                >
                  {selectedFeature.icon}
                </div>
                <h2 className="text-sm font-small text-black">
                  {selectedFeature.title}
                </h2>
              </div>

              <p className="text-xl text-gray-300 text-center mb-8 leading-relaxed">
                {selectedFeature.description}
              </p>

              {/* Feature details grid */}
              {selectedFeature.details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {selectedFeature.details.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div
                        className="w-2 h-2 rounded-full mr-3"
                        style={{
                          backgroundColor: selectedFeature.color || "#4ECDC4",
                        }}
                      />
                      <span className="text-white text-sm font-medium">
                        {detail}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
