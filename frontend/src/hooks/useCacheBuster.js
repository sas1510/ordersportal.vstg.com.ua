import { useEffect } from "react";

export const useCacheBuster = () => {
  useEffect(() => {
    const checkVersion = async () => {
      try {
       
        const response = await fetch(`/version.json?v=${Date.now()}`, {
          cache: "no-store", 
        });

        if (!response.ok) return;

        const data = await response.json();
        const latestVersion = data.version;
    
        const currentVersion = localStorage.getItem("app_version");

        if (currentVersion && currentVersion !== latestVersion) {
          console.log(`Нова версія (${latestVersion}) доступна. Оновлюємо...`);
          localStorage.setItem("app_version", latestVersion);

          window.location.reload();
        } else {
     
          localStorage.setItem("app_version", latestVersion);
        }
      } catch (error) {
        console.error("Не вдалося перевірити версію:", error);
      }
    };


    checkVersion();

 
    const interval = setInterval(checkVersion, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
