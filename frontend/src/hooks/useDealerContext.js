import { useContext, useEffect, useState } from "react";
import { RoleContext } from "../context/RoleContext";

export const useDealerContext = () => {
  const { user, role, isLoading } = useContext(RoleContext);

  const isAdmin = role === "admin";

  const [dealerGuid, setDealerGuid] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        setDealerGuid(null); // admin може обирати дилера
      } else {
        setDealerGuid(user?.user_id_1c || null);
      }
    }
  }, [isAdmin, user, isLoading]);

  return {
    isAdmin,
    dealerGuid,
    setDealerGuid,
    currentUser: user,
    isLoading,
  };
};
