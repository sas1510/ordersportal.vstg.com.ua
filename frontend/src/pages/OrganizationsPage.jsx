import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axios";

export default function OrganizationsPage() {
  const [customName, setCustomName] = useState("");
  const [selectedCode1C, setSelectedCode1C] = useState("");
  const [all1COrganizations, setAll1COrganizations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [res1C, resDB] = await Promise.all([
          axiosInstance.get("/organizations/all"), // з 1С
          axiosInstance.get("/organizations/db"),  // з нашої бази
        ]);
        setAll1COrganizations(res1C.data);
        setOrganizations(resDB.data);
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні організацій");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addOrganization = async () => {
    if (!customName || !selectedCode1C) {
      alert("Введіть назву і виберіть код 1С.");
      return;
    }

    try {
      const res = await axiosInstance.post("/organizations", {
        name: customName,
        code1C: selectedCode1C,
      });
      setOrganizations([...organizations, res.data]);
      setCustomName("");
      setSelectedCode1C("");
      alert("Організацію додано!");
    } catch (err) {
      console.error(err);
      alert("Помилка при додаванні організації");
    }
  };

  const deleteOrganization = async (id, name) => {
    if (!window.confirm(`❗ Ви впевнені, що хочете видалити організацію "${name}"? Це дію неможливо скасувати!`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/organizations/${id}`);
      setOrganizations(organizations.filter((o) => o.id !== id));
      alert(`Організація "${name}" успішно видалена.`);
    } catch (err) {
      console.error(err);
      alert("Помилка при видаленні організації");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-600 text-lg py-20">{error}</p>;
  }

  return (
    <div className="p-6 max-w-screen-md mx-auto bg-gray-50 mt-8 rounded-md shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 text-[#004080] tracking-wide">
        Організації
      </h1>

      {/* 🔹 Поле ручної назви */}
      <input
        type="text"
        placeholder="Наша назва організації"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        className="w-full border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition mb-4"
      />

      {/* 🔹 Select з 1С */}
      <div className="mb-4">
        <select
          onChange={(e) => setSelectedCode1C(e.target.value)}
          value={selectedCode1C || ""}
          className="w-64 border border-gray-400 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">-- Виберіть організацію з 1С --</option>
          {all1COrganizations.map((org, idx) => (
            <option key={idx} value={org.code_1c}>
              {org.name} - {org.code_1c}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={addOrganization}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md transition"
      >
        Додати
      </button>

      <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-700">Існуючі організації</h2>
      <ul className="border border-gray-300 rounded-md divide-y divide-gray-200">
        {organizations.map((org) => (
          <li key={org.id} className="px-4 py-2 flex justify-between items-center">
            <div>
              <span className="font-medium">{org.name}</span>{" "}
              <span className="text-gray-500">({org.code_1c})</span>
            </div>
            <button
              onClick={() => deleteOrganization(org.id, org.name)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition"
            >
              ❌ Видалити
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
