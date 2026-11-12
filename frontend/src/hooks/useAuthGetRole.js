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

export const useAuthGetRole = ({ afterSales = false } = {}) => {
  const context = useContext(RoleContext);
  const normalizedRole = normalizeRole(context?.role);

  const readOnly = normalizedRole === "internal_dealer" && context?.user?.internal_dealer_can_edit !== true;
  const canManageAfterSales = Boolean(normalizedRole) && (!readOnly || normalizedRole === "internal_dealer");
  return {
    ...context,
    role: normalizedRole,
    isReadOnly: afterSales ? !canManageAfterSales : readOnly,
    canManageAfterSales,
    isGeneralReadOnly: readOnly,
    isAdmin: isAdminRole(normalizedRole),
    isBackoffice: isBackofficeRole(normalizedRole),
    isDealer: isDealerRole(normalizedRole),
    isManager: isManagerRole(normalizedRole),
  };
};
