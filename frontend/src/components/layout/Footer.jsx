// Footer.jsx
import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { useMediaQuery } from "react-responsive";

export default function Footer() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery({ maxWidth: 768 });


  const baseStyle = theme === "dark" ? styles.footerDark : styles.footer;

 
  const mobileOverride = isMobile
    ? {
        height: "20px", 
        padding: "3px", 
        fontSize: "0.7rem", 
      }
    : {};

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
    zIndex: 9999,
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
    zIndex: 9999,
  },
};
