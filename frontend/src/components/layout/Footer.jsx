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
    backgroundColor: "#003d66",
    // backgroundColor: "rgba(255, 255, 255, 0.85)",
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: "0.9rem",
    
    // position: "absolute",
    // bottom: 0,
  },
};
