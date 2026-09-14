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
        const latestBuildTime = data.buildTime ? String(data.buildTime) : "";
        const currentVersion = localStorage.getItem("app_version");
        const currentBuildTime = localStorage.getItem("app_build_time");
        const hasNewBuild = Boolean(
          currentVersion &&
          (
            currentVersion !== latestVersion ||
            (latestBuildTime && currentBuildTime && latestBuildTime !== currentBuildTime)
          )
        );

        if (hasNewBuild) {
          if (process.env.NODE_ENV === "development") {
            console.log(`Нова версія (${latestVersion}) доступна. Оновлюємо...`);
          }
          localStorage.setItem("app_version", latestVersion);
          if (latestBuildTime) {
            localStorage.setItem("app_build_time", latestBuildTime);
          }

          window.location.reload();
        } else {
          localStorage.setItem("app_version", latestVersion);
          if (latestBuildTime) {
            localStorage.setItem("app_build_time", latestBuildTime);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Не вдалося перевірити версію:", error);
        }
      }
    };


    checkVersion();

 
    const interval = setInterval(checkVersion, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
};
