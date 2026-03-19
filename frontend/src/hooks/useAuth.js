// src/hooks/useAuth.js
import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";

export const useAuth = () => {
  return useContext(RoleContext);
};
