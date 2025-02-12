import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import WelcomePage from "./WelcomePage";
import StockRiskCalculator from "./StockRiskCalculator";
import "../styles/App.css";
import { useNavigate } from "react-router-dom";
import { HashRouter as Router } from "react-router-dom";

function App() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/calculator" element={<StockRiskCalculator />} />
    </Routes>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
