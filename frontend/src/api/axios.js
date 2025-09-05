import axios from "axios";

// Базовий URL API
const API_URL = (import.meta.env.VITE_API_URL || 'http://172.20.197.76') + '/api';

// Створюємо інстанс axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // важливо для HttpOnly cookie
});

// Глобальна змінна для logout handler
let logoutHandler = null;
export function setLogoutHandler(handler) {
  logoutHandler = handler;
}

// Перехоплювач відповідей
axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // Ендпоінти, для яких не робимо refresh
    const skipRefreshEndpoints = [
      "/login/",
      "/register/",
      "/token/refresh/",
      "/logout/",
    ];

    const endpoint = originalRequest.url.replace(API_URL, "");

    // Перевіряємо, чи endpoint містить один із skip
    const shouldSkip = skipRefreshEndpoints.some(path => endpoint.includes(path));

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkip) {
      originalRequest._retry = true;

      try {
        const res = await axiosInstance.post("/token/refresh/");
        const { access, role } = res.data;
        if(role) setRole(role);
        
        originalRequest.headers["Authorization"] = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        if (logoutHandler) logoutHandler();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
