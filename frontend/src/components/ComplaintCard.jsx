import { useState } from "react";
import {
  AiOutlineCalendar,
  AiOutlineShoppingCart,
  AiOutlineFileText,
  AiOutlineUser,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import ComplaintDetails from "./ComplaintDetails";

export default function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);

  const formattedDateTime = complaint.ComplaintDate
    ? new Date(complaint.ComplaintDate).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const statusColors = {
    "В обробці": "#FFD700",
    "Виконано": "#4CAF50",
    "Відхилено": "#F44336",
    "На перевірці": "#2196F3",
    "Очікує": "#FF9800",
  };

  const statusColor = statusColors[complaint.StatusName] || "#B0BEC5";

  return (
    <div
        className="complaint-card"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          cursor: "pointer",
          fontSize: "1.35rem",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          backgroundColor: "#fff",
          marginBottom: "20px",
          transition: "transform 0.2s, box-shadow 0.2s, background-color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.015)";
          e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.18)";
          e.currentTarget.style.backgroundColor = "#f9f9f9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)";
          e.currentTarget.style.backgroundColor = "#fff";
        }}
      >

      <div
        className="complaint-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "15px",
        }}
      >
        <span
          className="complaint-number"
          style={{ fontWeight: "700", fontSize: "1.4rem" }}
        >
          #{complaint.WebNumber}
        </span>
        <span
          className="status-badge"
          style={{
            padding: "5px 14px",
            borderRadius: "14px",
            fontWeight: "600",
            color: "#fff",
            backgroundColor: statusColor,
            fontSize: "1rem",
          }}
        >
          {complaint.StatusName || "В обробці"}
        </span>
      </div>

      <div
        className="complaint-row"
        style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}
      >
        <div
          className="complaint-item"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <AiOutlineShoppingCart size={24} color="#6c63ff" />
          <span>{complaint.OrderNumber}</span>
        </div>
        <div
          className="complaint-item"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <AiOutlineCalendar size={24} color="#ff6f61" />
          <span>{formattedDateTime}</span>
        </div>
        <div
          className="complaint-item"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <AiOutlineFileText size={24} color="#00b894" />
          <span>{complaint.DescriptionComplaint}</span>
        </div>
        <div
          className="complaint-item"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <AiOutlineUser size={24} color="#fd79a8" />
          <span>{complaint.FullName}</span>
        </div>
        <div
          className="complaint-item"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <AiOutlineInfoCircle size={24} color="#0984e3" />
          <span>{complaint.SolutionName}</span>
        </div>
      </div>

      {open && <ComplaintDetails complaint={complaint} />}
    </div>
  );
}
