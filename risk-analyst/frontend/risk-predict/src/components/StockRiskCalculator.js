// src/components/StockRiskCalculator.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/StockRiskCalculator.css";
import Fuse from "fuse.js";
import api, { fetchCSRFToken } from "./api";
import FinanceBackground from './FinanceBackground';
import '../styles/FinanceBackground.css';

const contentVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.43, 0.13, 0.23, 0.96]
    }
  },
  exit: { opacity: 0, scale: 0.8 }
};

function StockRiskCalculator() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [stockSymbol, setStockSymbol] = useState("");
  const [principleFund, setPrincipleFund] = useState("");
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch CSRF token when component mounts
    fetchCSRFToken();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("/sp500_companies.json");
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2 && companies.length > 0) {
      const fuse = new Fuse(companies, {
        keys: ["Security", "Symbol"],
        threshold: 0.3,
        distance: 100,
        minMatchCharLength: 2,
        includeScore: true,
      });

      const searchResults = fuse.search(searchTerm);
      setResults(searchResults.map(result => result.item).slice(0, 8));
    } else {
      setResults([]);
    }
  }, [searchTerm, companies]);

  useEffect(() => {
    if (result) {
      handleGenerateExplanation();
    }
  }, [result]);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setStockSymbol(company.Symbol);
    setSearchTerm(company.Symbol);
    setResults([]);
  };

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleGenerateExplanation = async () => {
    try {
      const response = await api.post("/api/get-explanation/", {
        stock_symbol: stockSymbol,
        principle_fund: parseFloat(principleFund),
        risk: result.risk,
        max_return_dollar: result.max_return_dollar,
        max_loss_dollar: result.max_loss_dollar,
        "5% worst-case scenario": result["5% worst-case scenario"],
      });

      setExplanation(response.data.explanation);
    } catch (error) {
      console.error("Error generating explanation:", error);
    }
  };

  const handleCalculateRisk = async () => {
    try {
      const response = await api.post("/api/calculate-risk/", {
        symbol: stockSymbol,
        principle_fund: parseFloat(principleFund),
      });

      setResult(response.data);
    } catch (error) {
      console.error("Error calculating risk:", error);
    }
  };

  return (
    <div className="calculator-container">
      <FinanceBackground />
      <motion.button
        onClick={() => navigate("/")}
        className="back-button"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 50, delay: 0.1 }}
      >
        &#x276E;
      </motion.button>
      <motion.div
        className="calculator-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ 
          duration: 1,
          ease: [0.43, 0.13, 0.23, 0.96] // Custom easing for a nice pop effect
        }}
      >
        <h1>Stock Risk Calculator</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search company or symbol"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="search-results">
              {results.map((company) => (
                <li
                  key={company.Symbol}
                  onClick={() => handleSelectCompany(company)}
                >
                  <span className="company-name">{company.Security}</span>
                  <span className="company-symbol">({company.Symbol})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          value={principleFund}
          onChange={(e) => setPrincipleFund(e.target.value)}
          placeholder="Enter principle fund"
        />
        <button onClick={handleCalculateRisk}>
          Calculate Risk
        </button>

        {result && (
          <div className="results">
            <h2>Results:</h2>
            <p>Risk: {result.risk}%</p>
            <p>Max Return: ${result.max_return_dollar}</p>
            <p>Max Loss: ${result.max_loss_dollar}</p>
            <p>Value at Risk: {result["5% worst-case scenario"]}%</p>
            <p>Explanation: {explanation}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default StockRiskCalculator;
