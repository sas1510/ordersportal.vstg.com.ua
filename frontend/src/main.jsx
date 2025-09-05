import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from "./App.jsx";
import { RoleProvider } from "./context/RoleContext";
import AuthProvider from "./context/AuthContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
