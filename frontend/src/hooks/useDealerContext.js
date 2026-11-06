import { dealerGroupForSelection } from "../utils/dealerReportGroups";
import { useCallback, useContext, useEffect, useState } from "react";
import { RoleContext } from "../context/RoleContext";
import {
  isAdminRole,
  isBackofficeRole,
  normalizeRole,
} from "../utils/roles";

export const useDealerContext = ({ defaultAll = false, allowGroups = false } = {}) => {
  const { user, role, isLoading } = useContext(RoleContext);
  const normalizedRole = normalizeRole(role);
  const isAdmin = isBackofficeRole(normalizedRole);
  const isSuperAdmin = isAdminRole(normalizedRole);

  const selectionKey = `portal.selectedDealer:${user?.id || user?.username || ""}:${normalizedRole}`;
  const readSelection = () => {
    try {
      const saved = sessionStorage.getItem(selectionKey);
      return saved === "__ALL__" || (allowGroups && dealerGroupForSelection(saved)) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(saved || "") ? saved : null;
    } catch { return null; }
  };
  const [dealerGuid, updateDealerGuid] = useState(() => isAdmin ? readSelection() : user?.user_id_1c || null);
  const setDealerGuid = useCallback((value) => {
    updateDealerGuid(previous => {
      const next = typeof value === "function" ? value(previous) : value;
      if (isAdmin && (next === "__ALL__" || (allowGroups && dealerGroupForSelection(next)) || /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(next || ""))) {
        try { sessionStorage.setItem(selectionKey, next); } catch { /* Storage may be unavailable. */ }
      }
      return next;
    });
  }, [isAdmin, selectionKey, allowGroups]);

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        updateDealerGuid(readSelection() || (defaultAll ? "__ALL__" : null)); 
      } else {
        updateDealerGuid(user?.user_id_1c || null);
      }
    }
  }, [isAdmin, selectionKey, isLoading, defaultAll, allowGroups]);

  return {
    isAdmin,
    isSuperAdmin,
    role: normalizedRole,
    dealerGuid,
    setDealerGuid,
    currentUser: user,
    isLoading,
  };
};
