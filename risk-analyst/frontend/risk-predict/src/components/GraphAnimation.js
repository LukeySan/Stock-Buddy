import React from "react";
import { motion } from "framer-motion";

const GraphAnimation = ({ isAnimating }) => {
  // Create points with an upward trend
  const points = Array.from({ length: 100 }, (_, i) => ({
    x: i * (window.innerWidth / 100),
    y: window.innerHeight - (
      // Base upward trend
      (i / 100) * (window.innerHeight * 0.6) +
      // Add some randomness for realism
      Math.sin(i * 0.1) * 50 +
      Math.random() * 30
    ),
  }));

  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.95)",
        display: isAnimating ? "flex" : "none",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isAnimating ? 1 : 0 }}
      exit={{ opacity: 0 }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        preserveAspectRatio="none"
      >
        <motion.path
          d={pathD}
          fill="none"
          stroke="#00c6ff"
          strokeWidth="4"
          variants={pathVariants}
          initial="hidden"
          animate={isAnimating ? "visible" : "hidden"}
          filter="drop-shadow(0 0 10px rgba(0, 198, 255, 0.5))"
        />
      </svg>
    </motion.div>
  );
};

export default GraphAnimation; 