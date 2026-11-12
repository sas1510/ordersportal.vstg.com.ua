import { FaCheck, FaCheckCircle, FaHourglassHalf, FaClock, FaCoins, FaCogs, FaBox, FaTruck, FaTimesCircle, FaCalculator, FaInfoCircle } from "react-icons/fa";
import { calculationSummaryDates } from "../../utils/calculationStatusDates";
const icons = { "Підтверджений": FaCheck, "Очікуємо підтвердження": FaHourglassHalf, "Очікуємо оплату": FaCoins, "Оплачено": FaCheckCircle, "У виробництві": FaCogs, "Готовий": FaBox, "Відвантажений": FaTruck, "Відмова": FaTimesCircle, "Для прорахунку": FaCalculator, "В обробці": FaClock };
export default function CalculationStatusLabel({ status, count, orders, label }) {
  const Icon = icons[status] || FaInfoCircle;
  const dates = calculationSummaryDates(orders, status);
  return <span className="calculation-status-label">
    <span className="calculation-status-label__title"><Icon aria-hidden="true" className={Icon === FaCheck ? "order-confirmed-check" : undefined} /><span>{label}{count != null && ` (${count})`}</span></span>
    {dates && <small className="calculation-status-label__dates" title={`${dates.label}: ${dates.range}. Дати є для ${dates.available} із ${dates.total} замовлень.`}>
      {dates.label}: {dates.range}
      {dates.available < dates.total && <span>Дати для {dates.available} із {dates.total}</span>}
    </small>}
  </span>;
}
