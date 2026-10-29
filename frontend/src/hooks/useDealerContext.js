import { useContext, useEffect, useState } from "react";
import { RoleContext } from "../context/RoleContext";
import {
  isAdminRole,
  isBackofficeRole,
  normalizeRole,
} from "../utils/roles";

export const useDealerContext = ({ defaultAll = false } = {}) => {
  const { user, role, isLoading } = useContext(RoleContext);
  const normalizedRole = normalizeRole(role);
  const isAdmin = isBackofficeRole(normalizedRole);
  const isSuperAdmin = isAdminRole(normalizedRole);

  const [dealerGuid, setDealerGuid] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        setDealerGuid(defaultAll ? "__ALL__" : null); 
      } else {
        setDealerGuid(user?.user_id_1c || null);
      }
    }
  }, [isAdmin, user, isLoading, defaultAll]);

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
