// src/hooks/useAuth.js
import { useContext } from "react";
import { RoleContext } from "../context/RoleContext";
import {
  isAdminRole,
  isBackofficeRole,
  isDealerRole,
  isManagerRole,
  normalizeRole,
} from "../utils/roles";

export const useAuthGetRole = () => {
  const context = useContext(RoleContext);
  const normalizedRole = normalizeRole(context?.role);

  return {
    ...context,
    role: normalizedRole,
    isReadOnly: normalizedRole === "internal_dealer" && context?.user?.internal_dealer_can_edit !== true,
    isAdmin: isAdminRole(normalizedRole),
    isBackoffice: isBackofficeRole(normalizedRole),
    isDealer: isDealerRole(normalizedRole),
    isManager: isManagerRole(normalizedRole),
  };
};
