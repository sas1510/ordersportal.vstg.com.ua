// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import axiosInstance, { setLogoutHandler } from "../api/axios";
import { RoleContext } from "./RoleContext";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setRole } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);

  // Логін
  const login = async (username, password) => {
    const res = await axiosInstance.post("/login/", { username, password });
    const { access, role, user } = res.data;

    setAccessToken(access);
    setRole(role);
    setIsAuthenticated(true);

    return user;
  };

  // Логаут
  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/logout/");
    } catch (err) {
      console.error(err);
    }
    setAccessToken(null);
    setRole(null);
    setIsAuthenticated(false);
  }, [setRole]);

  // Перевірка сесії при старті – лише якщо є refresh cookie
  useEffect(() => {
  const initAuth = async () => {
    // Публічні маршрути
    const publicRoutes = ["/invite/", "/register/", "/login/"];
    const path = window.location.pathname;

    const isPublic = publicRoutes.some(route => path.startsWith(route));
    if (isPublic) {
      setLoading(false); // не робимо refresh, просто вважаємо користувача неавторизованим
      return;
    }

    try {
      const res = await axiosInstance.post("/token/refresh/");
      const { access, role } = res.data;

      setAccessToken(access);
      setRole(role);
      setIsAuthenticated(true);
    } catch (err) {
      console.log("No valid refresh token or user not logged in");
    } finally {
      setLoading(false);
    }
  };
  initAuth();
}, [setRole]);


  // Регіструємо глобальний logout handler для axios interceptor
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  // Поки перевіряємо сесію, можна показати лоадер
  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ isAuthenticated, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
