// src/hooks/useAuth.js
import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";

export const useAuthGetRole = () => {
  return useContext(RoleContext);
};