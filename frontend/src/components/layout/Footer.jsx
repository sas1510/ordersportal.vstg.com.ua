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
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#45403e",
    // backgroundColor: "rgba(255, 255, 255, 0.85)",
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: "0.9rem",
    zIndex: 100,
    // position: "absolute",
    // bottom: 0,
  },
};
