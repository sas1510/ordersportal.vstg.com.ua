import React, { useEffect, useState } from "react";
import Select from "react-select";
import axiosInstance from "../api/axios";

export default function ContractorsSelect({ value, onChange, role }) {
  const [contractors, setContractors] = useState([]);

  useEffect(() => {
    if (role === "dealer") return;
    if (role === "customer") return;

    const fetchContractors = async () => {
      try {
        let res;

        if (role === "Manager" || role === "RegionalManager") {
          res = await axiosInstance.get("/contractors/by-manager-soap");
        } else {
          res = await axiosInstance.get("/contractors/all");
        }

        // Перетворюємо дані у формат для react-select
        const options = res.data.map((c) => ({
          value: c.kod,
          label: c.name,
        }));

        setContractors(options);
      } catch (error) {
        console.error("Помилка завантаження контрагентів:", error);
      }
    };

    fetchContractors();
  }, [role]);

  if (role === "Dealer") return null;
  if (role === "customer") return null;

  // Знаходимо вибраний option
  const selectedOption = contractors.find(opt => opt.value === value) || null;

  return (
    <Select
      value={selectedOption}
      onChange={(option) => onChange(option ? option.value : "")}
      options={contractors}
      placeholder="Оберіть контрагента"
      isClearable
      isSearchable
    />
  );
}
