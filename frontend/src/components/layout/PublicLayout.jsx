import React from "react";
import HeaderWithoutAuth from "../headers/HeaderWithoutAuth";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <>
      <HeaderWithoutAuth />   {/* хедер тепер над layout */}
      
      <div style={styles.layout}>
        <main style={styles.main}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
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
    paddingBottom: "40px",
    overflow: "auto",
  },
};
