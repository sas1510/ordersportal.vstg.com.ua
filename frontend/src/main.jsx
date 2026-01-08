import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from "./App.jsx";
import { RoleProvider } from "./context/RoleContext";
import AuthProvider from "./context/AuthContext";
import { NotificationProvider } from './components/notification/Notifications.jsx';
import "@fortawesome/fontawesome-free/css/all.min.css";
import 'leaflet/dist/leaflet.css';

// import './styles/datatables.css';

// import "datatables.net-dt/css/jquery.dataTables.css";

import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <AuthProvider>
          <NotificationProvider>
              <ThemeProvider>
              <App />
              </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
