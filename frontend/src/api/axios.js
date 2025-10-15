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

const skipRefresh = ["/login", "/register", "/token/refresh", "/logout"];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // endpoint без query та без кінцевого слешу
    const url = new URL(originalRequest.url, API_URL);
    const endpoint = url.pathname.replace(/\/$/, ""); // '/api/login' -> '/api/login'

    // Якщо 401 і не повторно та endpoint не в skipRefresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh.some((p) => endpoint.endsWith(p)) // перевірка по кінцю
    ) {
      originalRequest._retry = true;
      try {
        const res = await axiosInstance.post("/token/refresh/", {}, { withCredentials: true });
        const { access, role } = res.data;
        setAccessToken(access);
        if (window.setRoleGlobal) window.setRoleGlobal(role);
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
