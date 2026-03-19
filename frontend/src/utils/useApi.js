import { useEffect, useRef } from "react";
import axiosInstance from "../api/axios";
import { requestManager } from "../utils/requestManager";

export function useApi() {
  const activeController = useRef(null);

  const send = (method, url, data = null, config = {}) => {
    // Скасувати старий запит, якщо ще в процесі
    if (activeController.current) {
      requestManager.cancel(activeController.current);
    }

    // Новий AbortController
    const controller = requestManager.createController();
    activeController.current = controller;

    const finalConfig = {
      method,
      url,
      data,
      signal: controller.signal,
      ...config,
    };

    return axiosInstance(finalConfig)
      .finally(() => {
        requestManager.cancel(controller);
        if (activeController.current === controller) {
          activeController.current = null;
        }
      });
  };

  // Авто-скасування при unmount
  useEffect(() => {
    return () => {
      if (activeController.current) {
        requestManager.cancel(activeController.current);
      }
    };
  }, []);

  return {
    get: (url, config) => send("GET", url, null, config),
    post: (url, body, config) => send("POST", url, body, config),
    put: (url, body, config) => send("PUT", url, body, config),
    patch: (url, body, config) => send("PATCH", url, body, config),
    del: (url, config) => send("DELETE", url, null, config),
    cancel: () => {
      if (activeController.current) {
        requestManager.cancel(activeController.current);
      }
    },
  };
}
