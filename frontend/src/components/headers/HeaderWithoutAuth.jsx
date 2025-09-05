import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


export default function HeaderWithoutAuth() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full bg-[#003d66] shadow-md text-white py-4 px-6 flex justify-between items-center z-50">
        <div style={styles.left}>
        <Link to={"/home"}>
            <img src="/header_logo.svg" alt="Логотип" style={styles.logo} />
        </Link>
        </div>
      <button style={styles.loginButton} onClick={() => navigate("/login")}>
        Вхід
      </button>
    </header>
  );
}

const styles = {
  left: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "40px",
    marginRight: "15px",
    // filter: "brightness(0) invert(1)", // якщо логотип темний — зробить його білим (опціонально)
  },
  title: {
    fontSize: "1.8rem",
    color: "#ffffff",  // білий текст
    fontWeight: "700",
    letterSpacing: "1px",
  },
  loginButton: {
    fontSize: "1rem",
    padding: "7px 20px",
    // fontSize: "1rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#00509e",  // світліший синій для кнопки
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.3s",
  },
};

