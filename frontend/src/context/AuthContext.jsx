import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import axiosInstance, { setLogoutHandler, setAccessToken as setAxiosAccessToken } from "../api/axios";
import { RoleContext } from "./RoleContext";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(localStorage.getItem("access") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access"));
  const { setRole } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);

  // --- Встановлення токена та ролі ---
  const setAccessToken = (token, roleValue = null) => {
    setAccessTokenState(token);
    setAxiosAccessToken(token);

    if (token) {
      localStorage.setItem("access", token);
      setIsAuthenticated(true);
      if (roleValue && setRole) setRole(roleValue);
    } else {
      localStorage.removeItem("access");
      setIsAuthenticated(false);
      if (setRole) setRole(null);
    }
  };

  // --- Логін ---
  const login = async (username, password) => {
    const res = await axiosInstance.post("/login/", { username, password }, { withCredentials: true });
    const { access, role } = res.data;
    setAccessToken(access, role);
    return res.data;
  };

  // --- Логаут ---
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/logout/", {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
    setAccessToken(null);
  }, []);

  // --- Ініціалізація при старті ---
  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        try {
          const res = await axiosInstance.post("/token/refresh/", {}, { withCredentials: true });
          setAccessToken(res.data.access, res.data.role);
        } catch {
          console.log("No valid session");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // --- Поставити глобальний logout для axios ---
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
