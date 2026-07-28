const BACKOFFICE_ROLES = new Set([
  "admin",
  "manager",
  "region_manager",
  "regionalManager",
  "director",
]);

const DEALER_ROLES = new Set([
  "dealer",
  "customer",
]);

const MANAGER_ROLES = new Set([
  "manager",
  "region_manager",
  "regionalManager",
]);

export const normalizeRole = (role) => {
  const normalizedRole = String(role || "").trim();

  if (normalizedRole === "regionalManager") {
    return "region_manager";
  }

  return normalizedRole;
};

export const isBackofficeRole = (role) =>
  BACKOFFICE_ROLES.has(normalizeRole(role));

export const isDealerRole = (role) =>
  DEALER_ROLES.has(normalizeRole(role));

export const isAdminRole = (role) =>
  normalizeRole(role) === "admin";

export const isManagerRole = (role) =>
  MANAGER_ROLES.has(normalizeRole(role));
