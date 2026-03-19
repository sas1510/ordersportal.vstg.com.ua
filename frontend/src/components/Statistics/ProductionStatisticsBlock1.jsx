import { useEffect, useState, useMemo } from "react";
import axiosInstance from "../../api/axios";
import { widgetRegistry } from "../../widgets/widgetRegistry";
import "./ProductionStatisticsBlock.css";

export default function ProductionStatisticsBlock({ selectedYear }) {
  const isAdmin = localStorage.getItem("role") === "admin";

  const [data, setData] = useState(null);
  const [dealerGuid, setDealerGuid] = useState("");
  const [loading, setLoading] = useState(true);

  // 💎 масив активних віджетів
  const [activeWidgets, setActiveWidgets] = useState([
    "efficiency",
    "volume",
    "colors",
    "systems",
    "heatmap",
    "furniture",
    "categories"
  ]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = { year: selectedYear };
        if (isAdmin && dealerGuid) {
          params.contractor_guid = dealerGuid;
        }

        const [resFull, resDealer] = await Promise.all([
          axiosInstance.get("/full-statistics/", { params }),
          axiosInstance.get("/order-statistics/", { params })
        ]);

        setData({
          full: resFull.data,
          dealer: resDealer.data
        });

      } catch (err) {
        console.error("Помилка при завантаженні:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear, dealerGuid, isAdmin]);

  // 📦 функція яка дає правильні дані конкретному віджету
  const resolveWidgetData = (widgetKey) => {
    if (!data) return null;

    switch (widgetKey) {
      case "efficiency":
      case "volume":
        return data.full?.charts?.monthly;

      case "colors":
        return data.dealer?.profile_color;

      case "systems":
        return data.dealer?.profile_system;

      case "heatmap":
        return data.dealer?.heatmap;

      case "furniture":
        return data.dealer?.hardware?.items;

      case "categories":
        return data.full?.tables?.tech_details;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <div>Завантаження...</div>
      </div>
    );
  }

  if (!data) return <div>Дані не завантажено</div>;

  return (
    <div className="dashboard-grid">
      {activeWidgets.map((widgetKey) => {
        const widgetConfig = widgetRegistry[widgetKey];
        if (!widgetConfig) return null;

        const Component = widgetConfig.component;
        const widgetData = resolveWidgetData(widgetKey);

        return (
          <div
            key={widgetKey}
            className={`widget-card ${widgetConfig.size}`}
          >
            <div className="widget-header">
              <h4>{widgetConfig.title}</h4>

              <button
                className="widget-remove-btn"
                onClick={() =>
                  setActiveWidgets(prev =>
                    prev.filter(w => w !== widgetKey)
                  )
                }
              >
                ✕
              </button>
            </div>

            <Component data={widgetData} />
          </div>
        );
      })}
    </div>
  );
}




