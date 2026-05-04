import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 

export default function HeaderUserProfile() {
  const { theme } = useTheme();
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
      <div className="profile-menu-container" style={{ justifyContent: 'center', gap: '15px' }}>

        <div className="profile-name-text" style={{ position: 'static', marginRight: '0' }}>
          {fullName}
        </div>
        

        <img 
          className="profile-img-icon" 
          alt="Profile" 
          src={profileIcon} 
          style={{ position: 'static' }} 
        />
        
  
        <img 
          src="/assets/icons/PolygonOpenProfileSubmenu.png" 
          alt="arrow" 
          className="w-3 h-2 opacity-60" 
        />
      </div>
    </div>
  );
}