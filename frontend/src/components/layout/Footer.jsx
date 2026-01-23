// Footer.jsx
import React from "react";
import { useTheme } from "../../context/ThemeContext"; 
import { useMediaQuery } from "react-responsive";

export default function Footer() {
  const { theme } = useTheme(); 
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Базовий стиль за темою
  const baseStyle = theme === 'dark' ? styles.footerDark : styles.footer;

  // Модифікація для мобілки
  const mobileOverride = isMobile ? {
    height: "20px",      // Менша висота
    padding: "3px",      // Менші відступи
    fontSize: "0.7rem", // Дрібніший шрифт
  } : {};

  const currentStyles = { ...baseStyle, ...mobileOverride };

  return (
    <footer style={currentStyles}>
      <p style={{ margin: 0 }}>
        © 2015 - {new Date().getFullYear()} Вікна Стиль. Усі права захищені.
      </p>
    </footer>
  );
}


const styles = {

  footer: {
    width: "100%",
    height: "40px",
    padding: "8px",
    textAlign: "center",
    backgroundColor: "#45403e", 
    color: "rgba(255, 255, 255, 0.85)", 
    fontSize: "0.9rem",
    position: "fixed",
    bottom: 0,
    left: 0,
    zIndex: 10000,
  },
  

  footerDark: {
    width: "100%",
    height: "40px",
    padding: "8px",
    textAlign: "center",

    backgroundColor: "#282828", 
    color: "#cccccc", 
    fontSize: "0.9rem",
    position: "fixed",
    bottom: 0,
    left: 0,
    zIndex: 10000,
  },
};