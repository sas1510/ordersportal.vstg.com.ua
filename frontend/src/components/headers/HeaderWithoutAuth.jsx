import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import "./HeaderAdmin.css"; // 👈 окремий файл

export default function HeaderWithoutAuth() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="auth-header">
      <div className="flex items-center">
        <Link to="/home">
          <img src="/header_logo.svg" alt="Логотип" className="height-logo" />
        </Link>
      </div>

      {/* ПРАВА ЧАСТИНА */}
      <div className="auth-header-right">
        <div className="auth-divider"></div>

        {/* 🔆 КНОПКА ТЕМИ */}
        <button className="auth-theme-btn" onClick={toggleTheme}>
          <i
            className="material-icons auth-theme-icon"
            style={{
              color: theme === "light" ? "#ffe066" : "#ffd54f",
            }}
          >
            {theme === "light" ? "brightness_3" : "wb_sunny"}
          </i>
        </button>

        <div className="auth-divider"></div>

        {/* 🔐 КНОПКА ВХОДУ — ІКОНОЮ */}
        <button
          className="auth-login-green"
          onClick={() => navigate("/login")}
          title="Увійти"
        >
          <i className="fa fa-sign-in-alt"></i>
        </button>
      </div>
    </header>
  );
}
