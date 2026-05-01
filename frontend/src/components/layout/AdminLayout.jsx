import { Outlet } from "react-router-dom";
import HeaderAdmin from "../headers/HeaderAdmin";
import Footer from "./Footer";

const AdminLayout = () => (
  <div style={styles.layout}>
    {/* Обгортка хедера з високим z-index та фіксацією */}
    <div 
      ref={(el) => {
        if (el) el.style.setProperty('z-index', '10000', 'important');
      }}
      style={styles.headerWrapper}
    >
      <div style={{ pointerEvents: "auto" }}>
        <HeaderAdmin />
      </div>
    </div>

    {/* Основний контент */}
    <main style={styles.main}>
      <Outlet />
    </main>

    {/* <Footer /> */}
  </div>
);

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

export default AdminLayout;