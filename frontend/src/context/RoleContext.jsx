// import { createContext, useState, useEffect } from "react";

// export const RoleContext = createContext();

// export function RoleProvider({ children }) {
//   const [role, setRole] = useState(null);

//   useEffect(() => {
//     const savedRole = localStorage.getItem("role");
//     if (savedRole) setRole(savedRole);
//   }, []);

//   const updateRole = (newRole) => {
//     setRole(newRole);
//     if (newRole) localStorage.setItem("role", newRole);
//     else localStorage.removeItem("role");
//   };

//   return (
//     <RoleContext.Provider value={{ role, setRole: updateRole }}>
//       {children}
//     </RoleContext.Provider>
//   );
// }
import { createContext, useEffect, useState, useCallback } from "react";
import axiosInstance from "../api/axios";

export const RoleContext = createContext();

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

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsLoading(false);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        user,           
        isLoading,      
        reloadUser: loadUser,
        logout,
        setRole: updateRole 
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}
