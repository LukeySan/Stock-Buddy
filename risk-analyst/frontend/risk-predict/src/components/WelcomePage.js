import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/WelcomePage.css";

function WelcomePage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/calculator");
  };

  return (
    <div className="welcome-container">
      <motion.div
        className="animated-square"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div>
        <h1>Welcome</h1>
        <p>Integrate our API for comprehensive analytics.</p>
        <motion.button
          className="connect-button"
          onClick={handleClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Let's get started
        </motion.button>
      </div>
    </div>
  );
}

export default WelcomePage;
