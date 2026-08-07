import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 
import { AppIcon } from "../Icons/AppIcon";

// Приймаємо дані через props
export default function HeaderDealerProfile({ balance, debtAmount, currency, fullName }) {
  const { theme } = useTheme();
  
  const formatName = (name) => {
    if (!name || name === "Завантаження...") return name;
    let cleanName = name.split('(')[0].trim();
    const maxLength = 13; 
    return cleanName.length > maxLength ? cleanName.substring(0, maxLength).trim() + "..." : cleanName;
  };


  const formattedAmount = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance ?? 0);

  const formattedDebtAmount = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(debtAmount ?? 0);

  return (
    <div className={`profile-box ${theme}`}>
      <div className="profile-menu-container">
        <div className="profile-rectangle" />

        <div 
  className="profile-name-text truncate max-w-[150px] hover:max-w-none hover:white-space-normal hover:overflow-visible transition-all" 
  title={fullName}
>
  {formatName(fullName)}
</div>
        {/* <img className="profile-img-icon" alt="Profile" src={profileIcon} /> */}
        <AppIcon name="ProfileUserHeader" className="profile-img-icon"/>

        <div className="profile-separator-line" />

        <div className="profile-balance-text">
          <span className="profile-wallet-amount">
            {formattedAmount}
            <span className="profile-currency-label">
              {currency || "грн"}
            </span>
          </span>
          <span className="profile-debt-amount">
            {formattedDebtAmount}  
            <span className="profile-currency-label">
              {currency || "грн"}
            </span>
          </span>
        </div>

        <AppIcon name="money" className="profile-money-img-icon" />
      </div>
    </div>
  );
}