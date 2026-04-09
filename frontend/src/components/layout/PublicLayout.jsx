import React from "react";
import HeaderWithoutAuth from "../headers/HeaderWithoutAuth";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div style={styles.layout}>
      {/* 1. Хедер кладемо в обгортку з фіксованою позицією */}
      <div style={styles.headerWrapper}>
        <HeaderWithoutAuth />
      </div>

      {/* 2. Main просто займає весь екран */}
      <main style={styles.main}>
        <Outlet />
      </main>

      {/* <Footer /> */}
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative", // Важливо для абсолютного позиціонування всередині
  },
  headerWrapper: {
    position: "absolute", // Хедер "літає" над контентом
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 100, // Щоб бути поверх усього
  },
  main: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh", // Займає рівно весь екран без дірок
    width: "100%",
  },
};