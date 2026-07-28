import { isAdminRole, isBackofficeRole, normalizeRole } from "./roles";

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return isAdminRole(normalizeRole(user.role));
};

export const isBackoffice = () => {
  const user = getCurrentUser();
  return isBackofficeRole(normalizeRole(user.role));
};
