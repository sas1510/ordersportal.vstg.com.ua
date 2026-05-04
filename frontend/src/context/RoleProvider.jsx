import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";
import { RoleContext } from "./RoleContext";

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateRole = (newRole) => {
    setRole(newRole);
    if (newRole) localStorage.setItem("role", newRole);
    else localStorage.removeItem("role");
  };

  const loadUser = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/user/me/");
      setUser(res.data);
      setRole(res.data.role);
    } catch {
   
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginSuccess = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    setIsLoading(false);
    localStorage.setItem("role", userRole);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsLoading(false);
    localStorage.removeItem("role");
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