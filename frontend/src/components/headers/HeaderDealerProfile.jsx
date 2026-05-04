import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 

// Приймаємо дані через props
export default function HeaderDealerProfile({ balance, currency, fullName }) {
  const { theme } = useTheme();
  
  const moneyIcon = "/assets/icons/money-icon.png";
  const profileIcon = "/assets/icons/profile-icon.png";

  const formatName = (name) => {
    if (!name || name === "Завантаження...") return name;
    let cleanName = name.split('(')[0].trim();
    const maxLength = 15; 
    return cleanName.length > maxLength ? cleanName.substring(0, maxLength).trim() + "..." : cleanName;
  };


  const formattedAmount = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance ?? 0);

  return (
    <div className={`profile-box ${theme}`}>
      <div className="profile-menu-container">
        <div className="profile-rectangle" />

        <div className="profile-name-text" title={fullName}>
          {formatName(fullName)}
        </div>
        <img className="profile-img-icon" alt="Profile" src={profileIcon} />

        <div className="profile-separator-line" />

        <div className="profile-balance-text">
          {formattedAmount}
          <span className="profile-currency-label">
             {currency || "грн"}
          </span>
        </div>
        <img className="profile-money-img-icon" alt="Money" src={moneyIcon} />
      </div>
    </div>
  );
}