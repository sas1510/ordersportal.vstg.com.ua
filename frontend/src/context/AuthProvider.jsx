import React, { useState, useEffect, useCallback, useContext } from "react";
import axiosInstance, {
  setLogoutHandler,
  setAccessToken as setAxiosAccessToken,
} from "../api/axios";
import { RoleContext } from "./RoleContext";
import { AuthContext } from "./AuthContext";

import PortalLoader from "../components/ui/PortalLoader";

export default function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(
    localStorage.getItem("access") || null,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("access"),
  );
  const { setRole } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);


  const setAccessToken = useCallback((token, roleValue = null) => {
    setAccessTokenState(token);
    setAxiosAccessToken(token);

    if (token) {
      localStorage.setItem("access", token);
      setIsAuthenticated(true);
      if (roleValue && setRole) setRole(roleValue);
    } else {
      localStorage.removeItem("access");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      if (setRole) setRole(null);
    }
  }, [setRole]); 


  const login = async (username, password) => {
    const res = await axiosInstance.post(
      "/login/",
      { username, password },
      { withCredentials: true },
    );
    const { access, role } = res.data;
    setAccessToken(access, role);
    return res.data;
  };


  const logout = useCallback(async () => {
    try {
      await axiosInstance.post("/logout/", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setAccessToken(null);
  }, [setAccessToken]);


  useEffect(() => {
    const initAuth = async () => {
      if (!accessToken) {
        try {
          const res = await axiosInstance.post(
            "/token/refresh/",
            {},
            { withCredentials: true },
          );
          setAccessToken(res.data.access, res.data.role);
        } catch {
          if (process.env.NODE_ENV === "development") {
            console.log("No valid session");
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [accessToken, setAccessToken]); 

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  if (loading) return <PortalLoader />;

  return (
    <AuthContext.Provider
      value={{ accessToken, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}