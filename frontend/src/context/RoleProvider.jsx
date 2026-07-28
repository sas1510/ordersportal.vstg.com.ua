import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import { useLocation } from "react-router-dom";

import axiosInstance from "../api/axios";
import { RoleContext } from "./RoleContext";
import { normalizeRole } from "../utils/roles";

export function RoleProvider({ children }) {
  const location = useLocation();

  const publicPaths = ["/", "/home", "/login"];

  const isInvite =
    location.pathname.startsWith("/invite/");

  const isPublicRoute =
    publicPaths.includes(location.pathname) ||
    isInvite;

  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateRole = (newRole) => {
    const normalizedRole = normalizeRole(newRole);
    setRole(normalizedRole);

    if (normalizedRole) {
      localStorage.setItem("role", normalizedRole);
    } else {
      localStorage.removeItem("role");
    }
  };

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("access");

      // нема токена -> нема сенсу викликати /me/
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await axiosInstance.get(
        "/user/me/"
      );

      setUser(res.data);
      updateRole(res.data.role);
    } catch {
      setUser(null);
      updateRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginSuccess = (userData, userRole) => {
    setUser(userData);
    updateRole(userRole);

    setIsLoading(false);

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );
  };

  useEffect(() => {

    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    loadUser();
  }, [loadUser, isPublicRoute]);

  const logout = () => {
    setUser(null);
    updateRole(null);

    setIsLoading(false);
    localStorage.removeItem("user");
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        user,
        isLoading,
        reloadUser: loadUser,
        loginSuccess,
        logout,
        setRole: updateRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}
