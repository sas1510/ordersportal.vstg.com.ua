import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://172.20.197.76") + "/api";

let logoutHandler = null;

export function setLogoutHandler(handler) {
  logoutHandler = handler;
}

export function setAccessToken(token) {
  if (token) localStorage.setItem("access", token);
  else localStorage.removeItem("access");
}

export function getAccessToken() {
  return localStorage.getItem("access");
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Refresh токена при 401 ---
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const skipRefresh = ["/login/", "/register/", "/token/refresh/", "/logout/"];
    const endpoint = originalRequest.url.replace(API_URL, "");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh.some((p) => endpoint.includes(p))
    ) {
      originalRequest._retry = true;
      try {
        const res = await axiosInstance.post("/token/refresh/", {}, { withCredentials: true });
        const { access, role } = res.data;
        setAccessToken(access);
        if (window.setRoleGlobal) window.setRoleGlobal(role); // можна прибрати якщо RoleProvider обгортає AuthProvider
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
