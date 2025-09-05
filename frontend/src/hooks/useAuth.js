// src/hooks/useAuth.js
export const useAuth = () => {
  const user = JSON.parse(localStorage.getItem('user')); // збережений user
  return { user };
};
