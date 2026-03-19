// ManagersCombinedSync.jsx
import React, { useState } from "react";
import axiosInstance from "../api/axios";

export default function ManagersCombinedSync() {
  const [organization, setOrganization] = useState("");
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingRegional, setLoadingRegional] = useState(false);
  const [resultManagers, setResultManagers] = useState(null);
  const [resultRegional, setResultRegional] = useState(null);
  const [error, setError] = useState(null);

  const handleSyncManagers = async () => {
    if (!organization) {
      setError("Введіть код організації");
      return;
    }
    setLoadingManagers(true);
    setError(null);
    setResultManagers(null);

    try {
      const response = await axiosInstance.post(
        `/ManagersSync/sync-managers?organization=${organization}`
      );
      setResultManagers(response.data);
    } catch (err) {
      setError(err.response?.data || "Помилка синхронізації менеджерів");
    } finally {
      setLoadingManagers(false);
    }
  };

  const handleSyncRegional = async () => {
    if (!organization) {
      setError("Введіть код організації");
      return;
    }
    setLoadingRegional(true);
    setError(null);
    setResultRegional(null);

    try {
      const response = await axiosInstance.post(
        `/ManagersSync/sync-regional-managers?organization=${organization}`
      );
      setResultRegional(response.data);
    } catch (err) {
      setError(err.response?.data || "Помилка синхронізації регіональних менеджерів");
    } finally {
      setLoadingRegional(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>Синхронізація менеджерів</h2>
      <input
        type="text"
        placeholder="Код організації"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={handleSyncManagers}
          disabled={loadingManagers}
          style={{ flex: 1, padding: "8px 16px" }}
        >
          {loadingManagers ? "Синхронізація..." : "Менеджери"}
        </button>
        <button
          onClick={handleSyncRegional}
          disabled={loadingRegional}
          style={{ flex: 1, padding: "8px 16px" }}
        >
          {loadingRegional ? "Синхронізація..." : "Регіональні менеджери"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      {resultManagers && (
        <div style={{ marginTop: "10px" }}>
          <p><strong>{resultManagers.message}</strong></p>
        </div>
      )}

      {resultRegional && (
        <div style={{ marginTop: "10px" }}>
          <p><strong>{resultRegional.message}</strong></p>
        </div>
      )}
    </div>
  );
}
