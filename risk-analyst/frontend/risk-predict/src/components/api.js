// api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://stock-buddy.onrender.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add an interceptor to handle CSRF token
api.interceptors.request.use(
  async (config) => {
    if (!document.cookie.includes("csrftoken")) {
      // If no CSRF token exists, fetch it
      try {
        const response = await axios.get(
          `${config.baseURL}/api/get-csrf-token/`,
          {
            withCredentials: true,
          }
        );
        const csrfToken = response.data.csrfToken;
        config.headers["X-CSRFToken"] = csrfToken;
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    } else {
      // If CSRF token exists in cookies, use it
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// In api.js
export const getExplanation = async (data) => {
  try {
    const response = await api.post("/api/get-explanation/", data);
    return response.data.explanation;
  } catch (error) {
    console.error("Error getting explanation:", error);
    throw error;
  }
};

// Function to get CSRF token
export const fetchCSRFToken = async () => {
  try {
    const response = await api.get("/api/get-csrf-token/");
    return response.data.csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
  }
};

export default api;
