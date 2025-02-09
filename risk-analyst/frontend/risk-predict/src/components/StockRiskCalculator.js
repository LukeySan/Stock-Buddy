// src/components/StockRiskCalculator.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../styles/StockRiskCalculator.css";
import Fuse from "fuse.js";
import api, { fetchCSRFToken } from "./api";
import FinanceBackground from "./FinanceBackground";
import "../styles/FinanceBackground.css";

const contentVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  exit: { opacity: 0, scale: 0.8 },
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
  const [portfolio, setPortfolio] = useState({});
  const [portfolioResult, setPortfolioResult] = useState(null);
  const [portfolioExplanation, setPortfolioExplanation] = useState(null);
  const [portfolioSearchTerm, setPortfolioSearchTerm] = useState("");
  const [portfolioStockSymbol, setPortfolioStockSymbol] = useState("");
  const [portfolioPrincipleFund, setPortfolioPrincipleFund] = useState("");
  const [portfolioSelectedCompany, setPortfolioSelectedCompany] =
    useState(null);
  const [mainSearchResults, setMainSearchResults] = useState([]);
  const [portfolioSearchResults, setPortfolioSearchResults] = useState([]);
  const navigate = useNavigate();

  const handleAddToPortfolio = () => {
    if (!stockSymbol || !principleFund) {
      alert("Please select a stock and enter principle fund");
      return;
    }

    setPortfolio((prev) => ({
      ...prev,
      [stockSymbol]: parseFloat(principleFund),
    }));

    // Clear inputs after adding
    setStockSymbol("");
    setPrincipleFund("");
    setSearchTerm("");
    setSelectedCompany(null);
  };
  const handleAnalyzePortfolio = async () => {
    if (Object.keys(portfolio).length < 2) {
      alert("Please add at least 2 stocks to analyze portfolio");
      return;
    }

    try {
      const response = await api.post(
        "/api/calculate-portfolio-analysis/",
        portfolio
      );
      setPortfolioResult(response.data);

      const explanationResponse = await api.post(
        "/api/get-portfolio-analysis/",
        response.data
      );
      setPortfolioExplanation(explanationResponse.data.explanation);
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
    }
  };

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
    if (searchTerm.length >= 1 && companies.length > 0) {
      const fuse = new Fuse(companies, {
        keys: ["Security", "Symbol"],
        threshold: 0.0,
        distance: 0,
        minMatchCharLength: 1,
        includeScore: true,
        useExtendedSearch: true,
      });

      const searchResults = fuse.search(searchTerm);
      setMainSearchResults(
        searchResults.map((result) => result.item).slice(0, 8)
      );
    } else {
      setMainSearchResults([]);
    }
  }, [searchTerm, companies]);

  useEffect(() => {
    if (portfolioSearchTerm.length >= 1 && companies.length > 0) {
      const fuse = new Fuse(companies, {
        keys: ["Security", "Symbol"],
        threshold: 0.0,
        distance: 0,
        minMatchCharLength: 1,
        includeScore: true,
        useExtendedSearch: true,
      });

      const searchResults = fuse.search(portfolioSearchTerm);
      setPortfolioSearchResults(
        searchResults.map((result) => result.item).slice(0, 8)
      );
    } else {
      setPortfolioSearchResults([]);
    }
  }, [portfolioSearchTerm, companies]);

  useEffect(() => {
    if (result) {
      //handleGenerateExplanation();
    }
  }, [result]);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setStockSymbol(company.Symbol);
    setSearchTerm(company.Symbol);
    // Don't blur or clear results here - let the onBlur handler do it
  };

  /*const handleGenerateExplanation = async () => {
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
  };*/

  const handleCalculateRisk = async () => {
    try {
      const response = await api.post("/api/calculate-risk/", {
        symbol: stockSymbol,
        principle_fund: parseFloat(principleFund),
      });
      setResult(response.data);
      const explanationResponse = await api.post("/api/get-explanation/", {
        stock_symbol: stockSymbol,
        company_name: selectedCompany,
        principle_fund: parseFloat(principleFund),
        risk: response.data.risk,
        max_return_dollar: response.data.max_return_dollar,
        max_loss_dollar: response.data.max_loss_dollar,
        "5% worst-case scenario": response.data["5% worst-case scenario"],
      });
      setExplanation(explanationResponse.data.explanation);
    } catch (error) {
      console.error("Error calculating risk:", error);
    }
  };

  return (
    <div className="calculator-container">
      <div className="top-bar">
        <motion.div
          className="top-bar-title"
          onClick={() => navigate("/")}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Risk Analyst
        </motion.div>
      </div>
      <FinanceBackground />
      <motion.div
        className="calculator-content"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 1,
          ease: [0.43, 0.13, 0.23, 0.96], // Custom easing for a nice pop effect
        }}
      >
        <h1>Stock Risk Calculator</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search company or symbol"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => {
              setTimeout(() => setMainSearchResults([]), 200);
            }}
          />
          {mainSearchResults.length > 0 && (
            <ul className="search-results">
              {mainSearchResults.map((company) => (
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
        <button onClick={handleCalculateRisk}>Calculate Risk</button>

        {result && (
          <div className="results">
            <h2>Results:</h2>
            <p>Risk: {result.risk}%</p>
            <p>Max Return: ${result.max_return_dollar}</p>
            <p>Max Loss: ${result.max_loss_dollar}</p>
            <p>Value at Risk: {result["5% worst-case scenario"]}%</p>

            {explanation && (
              <div className="explanation">
                <h4>AI Analysis:</h4>
                <p>{explanation}</p>
              </div>
            )}
          </div>
        )}

        <div className="portfolio-section">
          <h2>Portfolio Analysis</h2>

          <div className="search-container">
            <input
              type="text"
              placeholder="Search company or symbol for portfolio"
              value={portfolioSearchTerm}
              onChange={(e) => setPortfolioSearchTerm(e.target.value)}
              onBlur={() => {
                setTimeout(() => setPortfolioSearchResults([]), 200);
              }}
            />
            {portfolioSearchResults.length > 0 && (
              <ul className="search-results">
                {portfolioSearchResults.map((company) => (
                  <li
                    key={company.Symbol}
                    onClick={() => {
                      setPortfolioSelectedCompany(company);
                      setPortfolioStockSymbol(company.Symbol);
                      setPortfolioSearchTerm(company.Symbol);
                    }}
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
            value={portfolioPrincipleFund}
            onChange={(e) => setPortfolioPrincipleFund(e.target.value)}
            placeholder="Enter principle fund for portfolio"
          />

          <button
            onClick={() => {
              if (!portfolioStockSymbol || !portfolioPrincipleFund) {
                alert(
                  "Please select a stock and enter principle fund for portfolio"
                );
                return;
              }
              setPortfolio((prev) => ({
                ...prev,
                [portfolioStockSymbol]: parseFloat(portfolioPrincipleFund),
              }));
              setPortfolioStockSymbol("");
              setPortfolioPrincipleFund("");
              setPortfolioSearchTerm("");
              setPortfolioSelectedCompany(null);
            }}
          >
            Add to Portfolio
          </button>

          {Object.keys(portfolio).length > 0 && (
            <div className="portfolio-status">
              <h3>Current Portfolio:</h3>
              {Object.entries(portfolio).map(([symbol, amount]) => (
                <p key={symbol}>
                  {symbol}: ${amount}
                </p>
              ))}
              {Object.keys(portfolio).length >= 2 && (
                <button onClick={handleAnalyzePortfolio}>
                  Analyze Portfolio
                </button>
              )}
            </div>
          )}

          {portfolioResult && (
            <div className="portfolio-results">
              <h3>Portfolio Analysis Results:</h3>
              <p>
                Portfolio Risk:{" "}
                {(
                  portfolioResult.portfolio_risk[
                    "Total Portfolio Volatility (Risk)"
                  ] * 100
                ).toFixed(2)}
                %
              </p>
              <p>
                5% Worst Case Value: $
                {portfolioResult.portfolio_risk[
                  "5% Worst Case Scenario (Monte Carlo)"
                ].toFixed(2)}
              </p>
              <p>
                Total Investment: ${portfolioResult.total_investment.toFixed(2)}
              </p>
              <h4>Portfolio Weights:</h4>
              {Object.entries(portfolioResult.weights).map(
                ([symbol, weight]) => (
                  <p key={symbol}>
                    {symbol}: {(weight * 100).toFixed(2)}%
                  </p>
                )
              )}
              {portfolioExplanation && (
                <div className="portfolio-explanation">
                  <h4>AI Analysis:</h4>
                  <p>{portfolioExplanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default StockRiskCalculator;
