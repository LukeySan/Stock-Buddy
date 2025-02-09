import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/WelcomePage.css";
import GraphAnimation from "./GraphAnimation";
import FinanceBackground from "./FinanceBackground";

function WelcomePage() {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate("/calculator");
    }, 2000); // Wait for animation to complete before navigating
  };

  return (
    <>
      <GraphAnimation isAnimating={isAnimating} />
      <motion.div
        className="welcome-container"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FinanceBackground />
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Welcome</h1>
          <p>Integrate our API for comprehensive analytics.</p>
          <motion.button
            className="connect-button"
            onClick={handleClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isAnimating}
          >
            Let's get started
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}

export default WelcomePage;