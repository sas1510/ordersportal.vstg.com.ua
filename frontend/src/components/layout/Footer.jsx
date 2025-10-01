import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p>© 2015 - {new Date().getFullYear()} Вікна Стиль. Усі права захищені.</p>
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
    position: "fixed", // фіксуємо футер
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
};

