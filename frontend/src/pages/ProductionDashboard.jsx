import { useEffect, useState } from "react";
import { getProductionStatistics } from "../api/productionStats";

import TopProductsChart from "../components/charts/TopProductsChart";
import ComplexityDonut from "../components/charts/ComplexityDonut";
import FrequencyVolumeChart from "../components/charts/FrequencyVolumeChart";
import ContractorSelect from "../components/ContractorSelect";

export default function ProductionDashboard({ user }) {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(2025);
  const [contractorGuid, setContractorGuid] = useState("");

  useEffect(() => {
    const params = { year };

    if (user.role === "admin" && contractorGuid) {
      params.contractor_guid = contractorGuid;
    }

    getProductionStatistics(params).then(res => {
      setData(res.data.items);
    });
  }, [year, contractorGuid, user.role]);

  return (
    <div>
      <h2>Статистика виробництва</h2>

      <div style={{ display: "flex", gap: 16 }}>
        <input
          type="number"
          value={year}
          onChange={e => setYear(e.target.value)}
        />

        {user.role === "admin" && (
          <ContractorSelect
            contractors={user.contractors}
            value={contractorGuid}
            onChange={setContractorGuid}
          />
        )}
      </div>

      <TopProductsChart data={data} />
      <ComplexityDonut data={data} />
      <FrequencyVolumeChart data={data} />
    </div>
  );
}
