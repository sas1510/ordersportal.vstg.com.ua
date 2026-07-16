// import axios from "axios";

// const API_URL = (import.meta.env.VITE_API_URL || "") + "/api";

// let logoutHandler = null;

// export function setLogoutHandler(handler) {
//   logoutHandler = handler;
// }

// export function setAccessToken(token) {
//   if (token) localStorage.setItem("access", token);
//   else localStorage.removeItem("access");
// }

// export function getAccessToken() {
//   return localStorage.getItem("access");
// }

// const axiosInstance = axios.create({
//   baseURL: API_URL,
//   withCredentials: true,
// });

// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = getAccessToken();
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const skipRefresh = ["/login", "/register", "/token/refresh", "/logout"];

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // endpoint без query та без кінцевого слешу
//     const url = new URL(originalRequest.url, API_URL);
//     const endpoint = url.pathname.replace(/\/$/, ""); // '/api/login' -> '/api/login'

//     // Якщо 401 і не повторно та endpoint не в skipRefresh
//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !skipRefresh.some((p) => endpoint.endsWith(p)) // перевірка по кінцю
//     ) {
//       originalRequest._retry = true;
//       try {
//         const res = await axiosInstance.post("/token/refresh/", {}, { withCredentials: true });
//         const { access, role } = res.data;
//         setAccessToken(access);
//         if (window.setRoleGlobal) window.setRoleGlobal(role);
//         originalRequest.headers["Authorization"] = `Bearer ${access}`;
//         return axiosInstance(originalRequest);
//       } catch (err) {
//         if (logoutHandler) logoutHandler();
//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;

import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "") + "/api";
const MAINTENANCE_NOTIFICATION_COOLDOWN_MS = 10000;

let logoutHandler = null;
let lastMaintenanceNotificationAt = 0;

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

export const refreshAccessToken = async () => {
  try {
    const res = await axiosInstance.post(
      "/token/refresh/",
      {},
      { _retry: true },
    );
    const { access } = res.data;
    setAccessToken(access);
    return access;
  } catch (err) {
    if (logoutHandler) logoutHandler();
    throw err;
  }
};

export function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", user.role || "");
  // localStorage.setItem("contractor_guid", user.contractor_guid || "");
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
  (error) => Promise.reject(error),
);

const skipRefresh = ["/login", "/register", "/token/refresh", "/logout"];

function handleMaintenanceResponse(error) {
  const status = error?.response?.status;
  const payload = error?.response?.data || {};
  const rawError = String(payload.error || "").toLowerCase();

  if (status !== 503 || rawError !== "database_recovery") {
    return;
  }

  const now = Date.now();
  if (now - lastMaintenanceNotificationAt < MAINTENANCE_NOTIFICATION_COOLDOWN_MS) {
    return;
  }

  lastMaintenanceNotificationAt = now;

  const message =
    payload.detail || "Наразі наша база оновлюється, зачекайте декілька хвилин.";

  if (typeof window !== "undefined" && typeof window.__portalAddNotification === "function") {
    window.__portalAddNotification(message, "warning", 8000);
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    handleMaintenanceResponse(error);

    const originalRequest = error.config || {};

    const endpoint = originalRequest.url
      ? new URL(originalRequest.url, API_URL).pathname.replace(/\/$/, "")
      : "";

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !skipRefresh.some((p) => endpoint.endsWith(p))
    ) {
      originalRequest._retry = true;

      try {
        // 1) Refresh token
        const res = await axiosInstance.post(
          "/token/refresh/",
          {},
          { withCredentials: true },
        );

        const { access } = res.data;
        setAccessToken(access);

        
        const userRes = await axiosInstance.get("/user/me/");
        setUser(userRes.data);

        // 3) Повторюємо оригінальний запит
        originalRequest.headers["Authorization"] = `Bearer ${access}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        if (logoutHandler) logoutHandler();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
