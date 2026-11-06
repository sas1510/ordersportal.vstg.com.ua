import { useTheme } from "../../hooks/useTheme";
import "./HeaderDealerProfile.css"; 
import { AppIcon } from "../Icons/AppIcon";

// Приймаємо дані через props
export default function HeaderDealerProfile({ balance, debtAmount, currency, currencyBalances = [], fullName, showFinanceInfo = true, onOpenComparison }) {
  const { theme } = useTheme();
  
  const formatName = (name) => {
    if (!name || name === "Завантаження...") return name;
    let cleanName = name.split('(')[0].trim();
    const maxLength = 13; 
    return cleanName.length > maxLength ? cleanName.substring(0, maxLength).trim() + "..." : cleanName;
  };


  const formatAmount = (amount) => new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
  const balances = currencyBalances.length
    ? currencyBalances
    : [{ my_wallet: balance, debt_sum: debtAmount, currency: currency || "грн" }];

  return (
    <div className={`profile-box ${theme}`}>
      <div className="profile-menu-container">
        <div className="profile-rectangle" />

        <div className="profile-identity">
          <AppIcon name="ProfileUserHeader" className="profile-img-icon" />
          <span className="profile-name-text" title={fullName} onDoubleClick={onOpenComparison}>
            {formatName(fullName)}
          </span>
        </div>

        <div className="profile-separator-line" />

        {showFinanceInfo && (
          <>
            {currencyBalances.length > 1 ? (
              <div className="profile-balance-text profile-balance-text--currencies">
                {balances.map((row) => <div className="profile-currency-row" key={row.currency}>
                  <span className="profile-wallet-amount" title={"Аванс " + formatAmount(row.my_wallet) + " " + row.currency}>
                    {formatAmount(row.my_wallet)} <span className="profile-currency-label">{row.currency}</span>
                  </span>
                  <span className="profile-debt-amount" title={"Загальний борг: " + formatAmount(row.debt_sum) + " " + row.currency + ". Включає замовлення без передоплати, у роботі та після реалізації."}>
                    {formatAmount(row.debt_sum)} <span className="profile-currency-label">{row.currency}</span>
                  </span>
                </div>)}
              </div>
            ) : (
            <div className="profile-balance-text">
              <span className="profile-wallet-amount" title={balances.map((row) => formatAmount(row.my_wallet) + " " + row.currency).join(" / ")}>
                {balances.map((row, index) => <span className="profile-currency-balance" key={row.currency || index}>
                  {index > 0 ? " / " : ""}{formatAmount(row.my_wallet)}
                  <span className="profile-currency-label">{row.currency}</span>
                </span>)}
              </span>
              <span className="profile-debt-amount" title={balances.map((row) => formatAmount(row.debt_sum) + " " + row.currency).join(" / ")}>
                {balances.map((row, index) => <span className="profile-currency-balance" key={row.currency || index}>
                  {index > 0 ? " / " : ""}{formatAmount(row.debt_sum)}
                  <span className="profile-currency-label">{row.currency}</span>
                </span>)}
              </span>
            </div>

            )}

            <AppIcon name="money" className="profile-money-img-icon" />
          </>
        )}
      </div>
    </div>
  );
}
