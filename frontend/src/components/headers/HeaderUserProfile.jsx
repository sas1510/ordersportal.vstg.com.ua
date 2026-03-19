import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import "./HeaderAdmin.css";

export default function HeaderUserProfile() {
  const [fullName, setFullName] = useState("Користувач Ім'я");

  useEffect(() => {
    async function fetchUserName() {
      try {
        const response = await axiosInstance.get("/user-name/");
        setFullName(response.data.full_name || "Користувач Ім'я");
      } catch (error) {
        console.error("Помилка отримання імені користувача:", error);
      }
    }

    fetchUserName();
  }, []);

  return (
    <li className="profile-item-column">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="icon icon-user font-size-20 text-info dealer-icon"></div>
        <div className="name no-wrap">{fullName}</div>
      </div>
    </li>
  );
}
