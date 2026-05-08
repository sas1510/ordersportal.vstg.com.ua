import { useRef, useEffect } from "react";
import axiosInstance from "../api/axios";

export function useCancelableApi() {
  const controllerRef = useRef(null);

  const request = async (config) => {

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    
    controllerRef.current = new AbortController();

    try {
      return await axiosInstance({
        ...config,
        signal: controllerRef.current.signal,
      });
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        console.log("⛔ Запит скасовано:", config.url);
        return null;
      }
      throw err;
    }
  };

  useEffect(() => {
    return () => {
  
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return {
    get: (url, cfg = {}) => request({ url, method: "GET", ...cfg }),
    post: (url, data, cfg = {}) =>
      request({ url, method: "POST", data, ...cfg }),
    put: (url, data, cfg = {}) => request({ url, method: "PUT", data, ...cfg }),
    delete: (url, cfg = {}) => request({ url, method: "DELETE", ...cfg }),
  };
}
