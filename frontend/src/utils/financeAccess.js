import { getCurrentUser } from "./auth";
import { isDealerRole } from "./roles";

export const hasFinanceAccess = (user = getCurrentUser()) =>
  !isDealerRole(user?.role) || user?.permit_finance_info === true;
