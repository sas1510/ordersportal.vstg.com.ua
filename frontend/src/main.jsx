import "./styles/portalSharedStyles";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import ApplicationBoundary, { ApplicationReady } from "./components/ui/ApplicationBoundary";
// У main.jsx змініть старий імпорт на новий:
import { RoleProvider } from "./context/RoleProvider";
import '../public/assets/css/mobile-responsive.css';
// Змінюємо шлях на новий файл AuthProvider
import AuthProvider from "./context/AuthProvider";
import { NotificationProvider } from "./components/notification/Notifications.jsx";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "leaflet/dist/leaflet.css";
import "./hooks/i18n"; 


// import './styles/datatables.css';

// import "datatables.net-dt/css/jquery.dataTables.css";

import { ThemeProvider } from "./context/ThemeProvider";

// A tab opened before deployment can still request chunks from the old build.
window.addEventListener("vite:preloadError", (event) => {
  const key = `portal-chunk-retry:${window.location.pathname}`;
  try {
    const lastRetry = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - lastRetry < 60_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ApplicationBoundary>
      <ApplicationReady />
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
    </ApplicationBoundary>
  </React.StrictMode>,
);
