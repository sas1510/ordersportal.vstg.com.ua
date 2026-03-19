export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user.role === "admin";
};
