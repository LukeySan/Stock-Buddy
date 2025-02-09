import React from "react";
import { motion } from "framer-motion";

function FinanceBackground() {
  const symbols = ["$", "₿", "€", "£", "¥", "₹"];

  return (
    <div className="finance-background">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          className="finance-symbol"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
            y: [0, -100],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
}

export default FinanceBackground; 