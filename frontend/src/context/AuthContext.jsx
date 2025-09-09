import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import axiosInstance, { setLogoutHandler, setAccessToken as setAxiosAccessToken } from "../api/axios";
import { RoleContext } from "./RoleContext";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(localStorage.getItem("access") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access"));
  const { setRole } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);

  // Головна функція для встановлення токена
  const setAccessToken = (token) => {
    setAccessTokenState(token);
    setAxiosAccessToken(token); // <- одразу встановлюємо в axios
    if (token) {
      localStorage.setItem("access", token);
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("access");
      setIsAuthenticated(false);
    }
  };

  // Логін
  const login = async (username, password) => {
    const res = await axiosInstance.post("/login/", { username, password }, { withCredentials: true });
    const { access, role: userRole } = res.data;
    setAccessToken(access); // <- токен одразу доступний для axios
    setRole(userRole);
    return res.data; // <- можна використати для редіректу або інших дій
  };

  // Логаут
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/logout/", {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
    setAccessToken(null);
    setRole(null);
  }, [setRole]);

  // Ініціалізація при старті
  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        try {
          const res = await axiosInstance.post("/token/refresh/", {}, { withCredentials: true });
          setAccessToken(res.data.access);
          setRole(res.data.role);
        } catch {
          console.log("No valid session");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [setRole]);

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
