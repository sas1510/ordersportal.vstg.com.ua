import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from "./App.jsx";
import { RoleProvider } from "./context/RoleContext";
import AuthProvider from "./context/AuthContext";
import { NotificationProvider } from './components/notification/Notifications.jsx';
// import './styles/datatables.css';

// import "datatables.net-dt/css/jquery.dataTables.css";



ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <AuthProvider>
          <NotificationProvider>
              <App />
          </NotificationProvider>
        </AuthProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
