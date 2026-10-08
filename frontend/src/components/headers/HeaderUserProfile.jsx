import { useState, useEffect, useCallback } from "react";
import PdfAmountComparison from "./PdfAmountComparison";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import axiosInstance from "../../api/axios";
import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 
import { AppIcon } from "../Icons/AppIcon";

export default function HeaderUserProfile() {
  const { theme } = useTheme();
  const { role } = useAuthGetRole();
  const canCompare = ["admin", "manager", "region_manager"].includes(role);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const closeComparison = useCallback(() => setComparisonOpen(false), []);
  const [fullName, setFullName] = useState("Завантаження...");

  const profileIcon = "/assets/icons/profile-icon.png";

  useEffect(() => {
    async function fetchUserName() {
      try {
        const response = await axiosInstance.get("/user-name/");
        setFullName(response.data.full_name || "Адміністратор");
      } catch (error) {
        console.error("Помилка отримання імені користувача:", error);
        setFullName("Адміністратор");
      }
    }

    fetchUserName();
  }, []);

  return (
    <div className={`profile-box ${theme} admin-profile-box`}>
      <div className="profile-menu-container">
        <div className="profile-rectangle" />

        <div className="profile-name-text admin-profile-name-text" title={fullName} onDoubleClick={() => { if (canCompare) setComparisonOpen(true); }}>
          {fullName}
        </div>
{/* 
        <img
          className="profile-img-icon"
          alt="Profile"
          src={profileIcon}
        /> */}
        <AppIcon name="ProfileUserHeader" className="profile-img-icon  "/>

        <img
          src="/assets/icons/PolygonOpenProfileSubmenu.png"
          alt="arrow"
          className="admin-profile-arrow"
        />
      </div>
      {comparisonOpen && <PdfAmountComparison admin onClose={closeComparison} />}
    </div>
  );
}
