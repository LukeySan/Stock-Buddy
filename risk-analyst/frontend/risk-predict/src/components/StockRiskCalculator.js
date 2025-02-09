// src/components/StockRiskCalculator.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/StockRiskCalculator.css";
import Fuse from "fuse.js";
import api, { fetchCSRFToken } from "./api";

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
        const response = await axios.get("/api/sp500/names"); // Adjust the endpoint as needed
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fuse = new Fuse(companies, {
      keys: ["Security", "Symbol"], // Search in company names
      includeScore: true,
    });

    const results = fuse.search(searchTerm);
    setResults(results.map((result) => result.item)); // Extract matched items
  }, [searchTerm, companies]);

  useEffect(() => {
    if (result) {
      handleGenerateExplanation();
    }
  }, [result]);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setStockSymbol(company.Symbol); // Set the stock symbol based on the selected company
    setSearchTerm(company.Security); // Update the search term to the selected company name
    setResults([]); // Clear the results
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
        initial={{ x: "100vw" }}
        animate={{ x: 0 }}
        exit={{ x: "100vw" }}
        transition={{ type: "spring", stiffness: 50 }}
      >
        <h1>Stock Risk Calculator</h1>
        <input
          type="text"
          placeholder="Search company or symbol"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {results.length > 0 && (
          <ul>
            {results.map((company) => (
              <li
                key={company.Symbol}
                onClick={() => handleSelectCompany(company)}
              >
                {company.Security} ({company.Symbol})
              </li>
            ))}
          </ul>
        )}
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
