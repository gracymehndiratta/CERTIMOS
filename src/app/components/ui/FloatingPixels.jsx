import React from 'react';
import { motion } from 'framer-motion';

const FloatingPixels = ({ count = 300, color = "#2cf2f9" }) => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute" // The rounded-full class has been removed
          style={{
            width: Math.random() * 15 + 5,
            height: Math.random() * 15 + 5,
            backgroundColor: color,
            top: `${Math.random() * 100}vh`,
            left: `${Math.random() * 100}vw`,
          }}
          initial={{ y: 0, opacity: 0.5 }}
          animate={{
            y: -200, // Move upwards
            x: Math.random() > 0.5 ? 100 : -100,
            opacity: 0,
            scale: 0.5,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

export default FloatingPixels;