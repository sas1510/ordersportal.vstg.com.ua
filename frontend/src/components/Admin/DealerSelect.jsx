import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";

export default function DealerSelect({ value, onChange }) {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDealers = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          "/dealer-portal-users/"
        );
        setDealers(res.data || []);
      } catch (e) {
        console.error("Dealer load error", e);
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, []);

  return (
    <label>
      Дилер:
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">— оберіть дилера —</option>

        {dealers.map((d) => (
          <option key={d.ContractorID} value={d.ContractorID}>
            {d.ContractorName}
          </option>
        ))}
      </select>
    </label>
  );
}
