import React, { useState, useEffect } from "react";
import Fuse from "fuse.js";
import axios from "axios";

const CompanySearch = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Fetch S&P 500 companies
    const fetchCompanies = async () => {
      const response = await axios.get("URL_TO_YOUR_API_OR_FUNCTION"); // Replace with your API endpoint
      setCompanies(response.data);
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    // Set up Fuse.js for fuzzy searching
    const fuse = new Fuse(companies, {
      keys: ["Company", "Symbol"], // Search in both company names and symbols
      includeScore: true,
    });

    // Perform the search
    const results = fuse.search(searchTerm);
    setResults(results.map((result) => result.item)); // Extract the matched items
  }, [searchTerm, companies]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a company..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ul>
        {results.map((company) => (
          <li key={company.Symbol}>
            {company.Company} ({company.Symbol})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompanySearch;
