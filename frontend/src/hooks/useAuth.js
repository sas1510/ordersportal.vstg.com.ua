// // src/hooks/useAuth.js
// import { useContext } from "react";
// import { RoleContext } from "../context/RoleContext";

// export const useAuth = () => {
//   return useContext(RoleContext);
// };
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};