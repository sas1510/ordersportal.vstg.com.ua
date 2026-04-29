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
    height: "100dvh",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    paddingTop: "env(safe-area-inset-top, 0px)", 
  },
  headerWrapper: {
    position: "absolute", 
    top: "env(safe-area-inset-top, 0px)",
    left: 0,
    width: "100%",
    zIndex: 100, 
    // paddingTop: "env(safe-area-inset-top, 0px)",
    // paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  main: {
    flexGrow: 1,
    // display: "flex",
    // flexDirection: "column",
    height: "100%", 
    width: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    // paddingTop: "calc(48px + env(safe-area-inset-top, 0px))", // Враховуємо висоту хедера + безпечну зону
  },
};
