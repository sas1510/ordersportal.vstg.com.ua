import React from "react";
import { formatDateHuman } from '../../utils/formatters';

export default function ComplaintDetails({ complaint }) {
  const isEmpty = (val) => val === undefined || val === null || String(val).trim() === "";

  // --- Статус ---
  const getStatusStyle = (status) => {
    switch (status) {
      case "Новий":
      case "В роботі":
      case "У виробництві":
      case "Виробництво":
      case "Готовий (на складі)":
        return "text-info";
      case "Відмова":
        return "text-danger";
      case "Відвантажений":
      case "Вирішено":
      case "На складі":
        return "text-success";
      default:
        return "text-dark";
    }
  };

  // --- Дати ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  };

  const getDateStatus = (plannedStr, actualStr) => {
    const planned = parseDate(plannedStr);
    const actual = parseDate(actualStr);
    const today = new Date();

    if (!planned && !actual) return { icon: "text-danger", bg: "background-warning-light" };
    if (actual) return { icon: "text-success", bg: "background-success-light" };
    if (planned && planned < today) return { icon: "text-danger", bg: "background-warning-light" };
    return { icon: "text-warning", bg: "background-warning-light" };
  };

  return (
    <div className="complaint-item-details flex flex-col gap-3 w-full">
      <div className="timeline w-full">
        <ul className="timeline-list">

          {/* Рекламація */}
          <li>
            <div className={`icon ${isEmpty(complaint.ComplaintDate) ? "text-danger" : "text-success"}`}>
              <span className="icon-news font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Рекламація</div>
              <div className="badge-content background-success-light">
                {formatDateHuman(complaint.ComplaintDate) || "Немає дати"}
              </div>
            </div>
          </li>

          {/* Замовлення */}
          <li>
            <div className={`icon ${isEmpty(complaint.OrderNumber) ? "text-danger" : "text-success"}`}>
              <span className="icon-clipboard font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Замовлення</div>
              <div className={`badge-content ${isEmpty(complaint.OrderNumber) ? "background-danger-light" : "background-success-light"}`}>
                {complaint.OrderNumber || "Немає замовлення"}
              </div>
            </div>
          </li>

          {/* Статус */}
          <li>
            <div className={`icon ${isEmpty(complaint.StatusName) ? "text-danger" : getStatusStyle(complaint.StatusName)}`}>
              <span className="icon-clipboard font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Статус</div>
              <div className={`badge-content ${isEmpty(complaint.StatusName) ? "background-danger-light" : "background-success-light"}`}>
                {complaint.StatusName || "Не визначено"}
              </div>
            </div>
          </li>

          {/* Виробництво */}
          <li>
            {(() => {
              const status = getDateStatus(complaint.ДатаЗапуска, complaint.ДатаПередачиНаСклад);
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-cogs font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Виробництво</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHuman(complaint.ДатаЗапуска) || "Немає даних"}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>

          {/* Готовність / Відвантаження */}
          <li>
            {(() => {
              const status = getDateStatus(complaint.OrderDeliverDate, complaint.DataComplete);
              return (
                <>
                  <div className={`icon ${status.icon}`}>
                    <span className="icon-layers2 font-size-20"></span>
                  </div>
                  <div className="badge">
                    <div className="badge-title">Готовність/Відвантаження</div>
                    <div className={`badge-content ${status.bg}`}>
                      {formatDateHuman(complaint.DataComplete) || "Не готово"}
                    </div>
                  </div>
                </>
              );
            })()}
          </li>

          {/* Менеджер */}
          <li>
            <div className={`icon ${isEmpty(complaint.LastManagerName) ? "text-danger" : "text-info"}`}>
              <span className="icon-user font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Менеджер</div>
              <div className={`badge-content ${isEmpty(complaint.LastManagerName) ? "background-danger-light" : "background-success-light"}`}>
                {complaint.LastManagerName || "Немає менеджера"}
              </div>
            </div>
          </li>

          {/* Серії */}
          <li>
            <div className={`icon ${isEmpty(complaint.SeriesList) ? "text-danger" : "text-info"}`}>
              <span className="icon-list font-size-20"></span>
            </div>
            <div className="badge">
              <div className="badge-title">Серії</div>
              <div className={`badge-content ${isEmpty(complaint.SeriesList) ? "background-danger-light" : "background-success-light"}`}>
                {complaint.SeriesList || "Немає серій"}
              </div>
            </div>
          </li>

          {/* Фото */}
          {complaint.PhotoLinks && complaint.PhotoLinks.split(',').map((link, idx) => (
            <li key={idx}>
              <div className="icon text-info">
                <span className="icon-picture font-size-20"></span>
              </div>
              <div className="badge">
                <div className="badge-title">Фото {idx + 1}</div>
                <div className="badge-content background-success-light">
                  <a href={link} target="_blank" rel="noopener noreferrer">Переглянути</a>
                </div>
              </div>
            </li>
          ))}

        </ul>
      </div>
    </div>
  );
}
