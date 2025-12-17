import { useState, useEffect } from "react";
import { getCurrentUser, isAdmin } from "../utils/auth";

export const useDealerContext = () => {
  const user = getCurrentUser();
  const admin = isAdmin();

  const [dealerGuid, setDealerGuid] = useState(
    admin ? null : user.user_id_1c
  );

  return {
    isAdmin: admin,
    dealerGuid,
    setDealerGuid,
    currentUser: user,
  };
};
