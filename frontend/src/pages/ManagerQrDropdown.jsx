import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axios"; // або ваш шлях до axios
import { QRCodeCanvas } from "qrcode.react";
import './ManagerQR.css';


const ManagerQrDropdown = ({ managerName, managerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Використовуємо ManagerID для стартового параметра
  const tgLink = `https://t.me/ViknaStyleNotificationsBot?start=${managerId}`;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      <span
        onClick={() => setIsOpen(!isOpen)}
        className="manager-name-trigger"
        style={{ 
          color: "var(--info-color, #0088cc)", 
          cursor: "pointer", 
          textDecoration: "underline", 
          fontWeight: "bold" 
        }}
      >
        {managerName}
      </span>

      {isOpen && (
        <div className="tg-popover-card" style={{
          position: "absolute", 
          top: "100%", 
          left: "0", 
          zIndex: 1000, 
          backgroundColor: "var(--drawer-bg, #fff)", // Адаптивний фон
          padding: "15px", 
          borderRadius: "8px", 
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          marginTop: "10px", 
          minWidth: "210px", 
          textAlign: "center", 
          border: "1px solid var(--drawer-border, #eee)" // Адаптивна рамка
        }}>
          {/* Хвостик (Arrow) */}
          <div className="tg-popover-arrow"></div>

          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", color: "var(--drawer-text-main, #333)" }}>
            <FaTelegramPlane style={{ color: "#0088cc", marginRight: "5px" }} />
            Підключити бота
          </h4>
          
          {/* Контейнер для QR завжди світлий для сканування */}
          <div style={{ background: "#fff", padding: "10px", borderRadius: "4px", display: "inline-block" }}>
            <QRCodeCanvas value={tgLink} size={150} level="H" bgColor="#ffffff" fgColor="#000000" />
          </div>
          
          <p style={{ fontSize: "11px", color: "var(--drawer-text-muted, #666)", marginTop: "8px" }}>
            Відскануйте для сповіщень
          </p>
          
          <a href={tgLink} target="_blank" rel="noreferrer" className="tg-direct-link" style={{
            display: "block", 
            marginTop: "10px", 
            fontSize: "12px", 
            color: "#fff",
            backgroundColor: "#0088cc", 
            padding: "8px", 
            borderRadius: "4px", 
            textDecoration: "none",
            fontWeight: "bold"
          }}>Відкрити чат</a>
        </div>
      )}
    </div>
  );
};




// --- ОСНОВНА СТОРІНКА ЗВІТУ ---
export default function PortalManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axiosInstance.get("/portal-managers/")
      .then(res => {
        setManagers(res.data.managers || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Помилка завантаження даних");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="portal-body">Завантаження...</div>;
  if (error) return <div className="portal-body text-danger">{error}</div>;

  return (
    <div className="portal-body">
      <div className="panel shadow-sm mt-10">
        <div className="header-container invite-border-bottom invite-pb-10 mb-10">
          <h2 className="uppercase text-info font-size-18 text-bold">
            <i className="fa-solid fa-users-gear mr-10"></i>
            Менеджери порталу та навантаження
          </h2>
        </div>

        <table className="portal-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", backgroundColor: "#f4f7f9" }}>
              <th style={{ padding: "12px" }}>ПІБ Менеджера (QR)</th>
              <th style={{ padding: "12px" }}>Логін 1С</th>
              {/* <th style={{ padding: "12px" }}>Кількість дилерів</th> */}
              {/* <th style={{ padding: "12px" }}>Список дилерів</th> */}
            </tr>
          </thead>
          <tbody>
            {managers.map((mgr) => (
              <tr key={mgr.ManagerID} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}>
                  <ManagerQrDropdown managerName={mgr.FullManagerName} managerId={mgr.ManagerID} />
                </td>
                <td style={{ padding: "12px" }}>{mgr.ManagerLogin}</td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {/* <span className="badge badge-info">{mgr.DealersCount}</span> */}
                </td>
                {/* <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>
                  {mgr.AssignedDealers}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}





