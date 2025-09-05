import React, { useState } from "react";
import axiosInstance from "../api/axios";

export default function SyncManagersPage() {
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [message, setMessage] = useState("");

  const handleSyncManagers = async () => {
    setLoadingManagers(true);
    setMessage("");

    try {
      const res = await axiosInstance.post("DealersManager/UpdateDealerManagers");
      console.log(res.data);
      setMessage("ManagerId успішно оновлено!");
    } catch (err) {
      console.error(err);
      setMessage("Сталася помилка під час оновлення ManagerId.");
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleSyncRegionalManagers = async () => {
    setLoadingRegional(true);
    setMessage("");

    try {
      const res = await axiosInstance.post("DealersRegionalManager/UpdateDealerRegionalManagers");
      console.log(res.data);
      setMessage("RegionalManagerId успішно оновлено!");
    } catch (err) {
      console.error(err);
      setMessage("Сталася помилка під час оновлення RegionalManagerId.");
    } finally {
      setLoadingRegional(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Синхронізація менеджерів</h2>

      <button
        onClick={handleSyncManagers}
        disabled={loadingManagers}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mb-4"
      >
        {loadingManagers ? "Оновлення ManagerId..." : "Оновити ManagerId"}
      </button>

      <button
        onClick={handleSyncRegionalManagers}
        disabled={loadingRegional}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
      >
        {loadingRegional ? "Оновлення RegionalManagerId..." : "Оновити RegionalManagerId"}
      </button>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
