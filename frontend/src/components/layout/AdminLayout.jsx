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
    minHeight: "100vh",
    position: "relative",
  },
  headerWrapper: {
    position: "fixed", // Тепер хедер завжди прибитий до верху екрана
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1000, // Піднімаємо z-index, щоб перекрити все
    pointerEvents: "none", 
  },
  main: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    width: "100%",
    // Якщо ви хочете, щоб контент сторінки НЕ заходив ПІД хедер 
    // (наприклад, на сторінці Оплат), додайте внутрішній відступ:
    // paddingTop: "132px", 
  },
};

export default AdminLayout;