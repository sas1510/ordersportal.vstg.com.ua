import { useState, useEffect } from "react";
import ComponentPalette from "./ComponentPalette";
import DropZone from "./DropZone";

// Імпорт всіх графіків
import ComplexityDonut from "../charts/ComplexityDonut";
import EfficiencyChart from "../charts/EfficiencyChart";
import VolumeChart from "../charts/VolumeChart";
import PrefixCategoryDisplay from "../charts/PrefixCategoryDisplay";
import FurnitureChart from "../charts/FurnitureChart";
import ProfileColorChart from "../charts/ProfileColorChart";
import ProfileSystemChart from "../charts/ProfileSystemChart";
import ColorSystemHeatmap from "../charts/ColorSystemHeatmap";
import ComplexityTreemap from "../charts/ComplexityTreeMap";

export default function BuilderPage({ dateRange, dataFetch }) {
  const [components, setComponents] = useState([]);

  // Передача даних у drop zone
  const [data, setData] = useState({});
  useEffect(() => {
    if (dataFetch) {
      setData(dataFetch);
    }
  }, [dataFetch]);

  return (
    <div className="builder-page">
      <ComponentPalette />
      <DropZone 
        components={components} 
        setComponents={setComponents} 
        data={data}
        Charts={{
          ComplexityDonut,
          EfficiencyChart,
          VolumeChart,
          PrefixCategoryDisplay,
          FurnitureChart,
          ProfileColorChart,
          ProfileSystemChart,
          ColorSystemHeatmap,
          ComplexityTreemap
        }}
      />
    </div>
  );
}