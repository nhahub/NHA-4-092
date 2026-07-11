import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./services/AuthContext";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/ui.css";
import "./styles/dashboard.css";

const savedTheme = localStorage.getItem("rb_theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
