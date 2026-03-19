import { useEffect, useState, useMemo, useRef } from "react";
import axiosInstance from "../../api/axios";
import ComplexityDonut from "../charts/ComplexityDonut";
import FrequencyVolumeChart from "../charts/FrequencyVolumeChart";
import ProductionTimelineChart from "../charts/ProductionTimelineChart";
import MonthlyTrendChart from "../charts/MonthlyTrendChart";
import TopProductsChart from "../charts/TopProductsChart";
import DealerSelect from "../../pages/DealerSelect";
import './ProductionStatisticsBlock.css';

// Мапінг для групування сирих категорій у великі групи
const CATEGORY_MAPPING = {
  "Вікна безшовне зварювання": "Вікна",
  "Вікно": "Вікна",
  "Вікно вкл склопакет": "Вікна",
  "Розсувні системи SL76": "Вікна",
  "Двері безшовне зварювання": "Двері",
  "Міжкімнатні двері": "Двері",
  "Технічні двері ПВХ": "Двері",
  "Двері Lampre": "Двері",
  "Лиштва": "Додатки",
  "Москітні сітки": "Додатки",
  "Підвіконня": "Додатки",
  "Відливи": "Додатки",
  "Інше": "Додатки"
};

export default function ProductionStatisticsBlock({ selectedYear }) {
  const isAdmin = localStorage.getItem("role") === "admin";
  const drillDownRef = useRef(null);
  
  const [data, setData] = useState(null);
  const [dealerGuid, setDealerGuid] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Стан для Drill-Down
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = { year: selectedYear };
        if (isAdmin && dealerGuid) params.contractor_guid = dealerGuid;
        const res = await axiosInstance.get("/full-statistics/", { params });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    loadData();
  }, [selectedYear, dealerGuid]);

  // 1. Дані для головного Donut (Розподіл замовлень)
  const mainDonutData = useMemo(() => {
    if (!data?.charts?.distribution) return [];
    const groups = {};
    data.charts.distribution.labels.forEach((label, i) => {
      const groupName = CATEGORY_MAPPING[label] || "Інше";
      groups[groupName] = (groups[groupName] || 0) + data.charts.distribution.values[i];
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [data]);

  // 2. Дані для деталізації при кліку
  const categoryDetails = useMemo(() => {
    if (!selectedCategory || !data) return [];
    // Фільтруємо tech_details, де група відповідає вибраній в Donut
    return data.tables.tech_details
      .filter(item => (CATEGORY_MAPPING[item.ConstructionTypeName_UA] || "Інше") === selectedCategory)
      .map(item => ({
        name: `${item.ConstructionTypeName_UA} (${item.Складність_UA})`,
        value: item.TotalQuantity,
        orders: item.OrderNumbers,
        uniqueOrders: item.UniqueOrdersCount
      }))
      .sort((a, b) => b.value - a.value);
  }, [selectedCategory, data]);

  if (loading) return <div className="loading-spinner">Завантаження...</div>;

  return (
    <div className="production-stats-container">
      {/* KPI Картки */}
      <div className="kpi-grid mb-24">
        <div className="kpi-card">
          <span className="label">Річний оборот</span>
          <span className="value text-green">{Number(data.summary.total_sum).toLocaleString()} <small>грн</small></span>
        </div>
        <div className="kpi-card">
          <span className="label">Замовлень (KPI)</span>
          <span className="value">{data.summary.kpi_orders_count} / {data.summary.total_orders}</span>
        </div>
        <div className="kpi-card">
          <span className="label">Сер. час виготовлення</span>
          <span className="value">{Number(data.summary.avg_days).toFixed(1)} <small>дн.</small></span>
        </div>
        <div className="kpi-card border-red">
          <span className="label">Рекламації</span>
          <span className="value color-red">{Number(data.summary.complaint_rate).toFixed(1)}%</span>
        </div>
      </div>

      <div className="stats-main-grid">
        {/* Головний розподіл */}
        <div className="chart-wrapper-card">
          <h4>Розподіл портфеля (Клік на сектор для деталей)</h4>
          <ComplexityDonut 
            data={mainDonutData} 
            onSectorClick={(name) => {
                setSelectedCategory(name);
                setTimeout(() => drillDownRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }} 
          />
        </div>

        {/* Швидкість */}
        <div className="chart-wrapper-card">
          <h4>Аналіз затримок: Черга vs Цех</h4>
          <ProductionTimelineChart data={data.charts.speed} />
        </div>

        {/* Сезонність */}
        <div className="grid-span-2 chart-wrapper-card">
          <h4>Динаміка продажів по місяцях</h4>
          <MonthlyTrendChart data={data.charts.monthly} />
        </div>
      </div>

      {/* --- DRILL DOWN SECTION --- */}
      {selectedCategory && (
        <div className="drilldown-view animate-fade-in" ref={drillDownRef} style={{ marginTop: '40px', borderTop: '2px solid #ddd', paddingTop: '40px' }}>
          <div className="row jc-sb ai-center mb-24">
            <h3 className="section-title">Деталізація групи: <span className="color-primary">{selectedCategory}</span></h3>
            <button className="btn-secondary" onClick={() => setSelectedCategory(null)}>Закрити деталі ×</button>
          </div>

          <div className="row gap-24 wrap">
             <div className="flex-1 card-p20 bg-white shadow-sm rounded-12">
                <h5>Підкатегорії та складність (шт)</h5>
                <ComplexityDonut data={categoryDetails} isDetail={true} />
             </div>
             <div className="flex-1 card-p20 bg-white shadow-sm rounded-12">
                <h5>ТОП позицій за кількістю</h5>
                <TopProductsChart data={categoryDetails} onBarClick={(name) => console.log(name)} />
             </div>
          </div>

          {/* Список замовлень для вибраної групи */}
          <div className="mt-24 card-p20 bg-white shadow-sm rounded-12">
             <h5>Номери замовлень у групі {selectedCategory}</h5>
             <div className="orders-tag-cloud mt-16">
                {Array.from(new Set(categoryDetails.flatMap(d => d.orders.split(',')))).map((order, idx) => (
                  <span key={idx} className="order-tag">{order.trim()}</span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Скаттер в самому низу */}
      <div className="grid-span-2 chart-wrapper-card mt-24">
          <h4>Матриця ефективності: Замовлення vs Об'єм</h4>
          <FrequencyVolumeChart data={data.tables.tech_details} />
      </div>
    </div>
  );
}