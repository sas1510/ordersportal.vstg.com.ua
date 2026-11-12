import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import { useLocation } from "react-router-dom";

import axiosInstance, { dealerPreviewToken, exitDealerPreview } from "../api/axios";
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

  useEffect(() => {
    const readOnly = role === "internal_dealer" && user?.internal_dealer_can_edit !== true;
    document.body.classList.toggle("internal-dealer-readonly", readOnly);
    document.body.classList.toggle("internal-dealer-after-sales", readOnly);
    return () => document.body.classList.remove("internal-dealer-readonly", "internal-dealer-after-sales", "rimini-after-sales");
  }, [role, user]);

  const updateRole = (newRole) => {
    const normalizedRole = normalizeRole(newRole);
    setRole(normalizedRole);

    if (dealerPreviewToken()) return;
    if (normalizedRole) {
      localStorage.setItem("role", normalizedRole);
    } else {
      localStorage.removeItem("role");
    }
  };

  const loadUser = useCallback(async () => {
    try {
      const token = dealerPreviewToken() || localStorage.getItem("access");

      // нема токена -> нема сенсу викликати /me/
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await axiosInstance.get(
        "/user/me/"
      );

      setUser(res.data);
      if (!dealerPreviewToken()) localStorage.setItem("user", JSON.stringify(res.data));
      updateRole(res.data.role);
    } catch {
      if (dealerPreviewToken()) exitDealerPreview();
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
