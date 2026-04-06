import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
// У main.jsx змініть старий імпорт на новий:
import { RoleProvider } from "./context/RoleProvider";
import '../public/assets/css/mobile-responsive.css';
// Змінюємо шлях на новий файл AuthProvider
import AuthProvider from "./context/AuthProvider";
import { NotificationProvider } from "./components/notification/Notifications.jsx";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";


// import './styles/datatables.css';

// import "datatables.net-dt/css/jquery.dataTables.css";

import { ThemeProvider } from "./context/ThemeProvider";

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
  </React.StrictMode>,
);
