import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import AppWrapper from "./components/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
