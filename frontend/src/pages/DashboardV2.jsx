import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import { useAuthGetRole } from "../hooks/useAuthGetRole";
import { hasFinanceAccess } from "../utils/financeAccess";
import "./DashboardV2.css";

export default function DashboardV2() {
  const { user, isDealer, role } = useAuthGetRole();
  const scope = isDealer ? "Ваші замовлення" : role === "admin" ? "Усі доступні дилери" : "Ваші закріплені дилери";
  return <div className="dashboard-v2">
    <header className="dashboard-v2__intro">
      <div>
        <h1>{user?.full_name || user?.username || "Вітаємо"}</h1><p>{scope} — головне в одному місці.</p></div>
      <div className="dashboard-v2__actions">{hasFinanceAccess(user) && <Link to="/statistics" className="dashboard-v2__analytics">Перейти до аналітики <span aria-hidden="true">→</span></Link>}<Link to="/dashboard" className="dashboard-v2__back">Попередній вигляд <span aria-hidden="true">↗</span></Link></div>
    </header>
    <Dashboard variant="v2" />
  </div>;
}
