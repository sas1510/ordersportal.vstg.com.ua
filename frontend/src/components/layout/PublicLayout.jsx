import React from "react";
import HeaderWithoutAuth from "../headers/HeaderWithoutAuth"; // 🔁 Або перейменуй у HeaderWithoutAuth
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div style={styles.layout}>
      <HeaderWithoutAuth />
      <main style={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    position: "relative",
  },
  main: {
    flexGrow: 1,
    // paddingTop: "60px", // приблизно висота Header
    // paddingBottom: "40px",
    marginTop: "-132px", 
    overflow: "auto", // приблизно висота Footer
  },
};
