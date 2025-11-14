import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext"; // 👈 контекст теми

export default function HeaderWithoutAuth() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 w-full bg-[#45403e] shadow-md text-white py-4 px-6 flex justify-between items-center z-50">
      {/* Ліва частина — логотип */}
      <div style={styles.left}>
        <Link to="/home">
          <img src="/header_logo.svg" alt="Логотип" style={styles.logo} />
        </Link>
      </div>

      {/* Права частина — перемикач теми + кнопка входу */}
      <div style={styles.right}>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Перемкнути тему"
          style={styles.themeButton}
        >
          <i
            className="material-icons"
            style={{
              color: theme === "light" ? "#f4ffaf" : "#ffc107",
              fontSize: "22px",
              fontStyle: "normal",
              verticalAlign: "middle",
            }}
          >
            {theme === "light" ? "brightness_3" : "wb_sunny"}
          </i>
        </button>

        <button style={styles.loginButton} onClick={() => navigate("/login")}>
          Вхід
        </button>
      </div>
    </header>
  );
}

const styles = {
  left: {
    display: "flex",
    alignItems: "center",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  logo: {
    height: "40px",
    marginRight: "15px",
  },
  loginButton: {
    fontSize: "1rem",
    padding: "7px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#5888afff",
    color: "",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.3s",
  },
  themeButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
  },
};
