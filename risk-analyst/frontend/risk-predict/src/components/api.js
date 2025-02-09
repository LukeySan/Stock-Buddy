// api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  withCredentials: true, // Important for CSRF
});

// Function to get CSRF token
export const fetchCSRFToken = async () => {
  try {
    const response = await api.get("/api/get-csrf-token/");
    api.defaults.headers.common["X-CSRFToken"] = response.data.csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
  }
};

export default api;
