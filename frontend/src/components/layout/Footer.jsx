// Footer.jsx

import React from "react";
import { useTheme } from "../../context/ThemeContext"; 
import { useMediaQuery } from "react-responsive";

export default function Footer() {
  // Отримуємо поточну тему
  const { theme } = useTheme(); 
  
  // Вибираємо стилі залежно від теми
  const currentStyles = theme === 'dark' ? styles.footerDark : styles.footer;

  return (
    // Застосовуємо динамічні стилі
    <footer style={currentStyles}>
      <p>© 2015 - {new Date().getFullYear()} Вікна Стиль. Усі права захищені.</p>
    </footer>
  );
}

// Визначаємо обидва набори стилів
const styles = {
  // --- 1. СВІТЛА ТЕМА (початковий стиль) ---
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
  
  // --- 2. ТЕМНА ТЕМА (новий стиль) ---
  footerDark: {
    width: "100%",
    height: "40px",
    padding: "8px",
    textAlign: "center",
    // 👈 ЗМІНЕННО: Використовуємо базовий колір хедера
    backgroundColor: "#282828", 
    color: "#cccccc", // Світлий текст
    fontSize: "0.9rem",
    position: "fixed",
    bottom: 0,
    left: 0,
    zIndex: 10000,
  },
};