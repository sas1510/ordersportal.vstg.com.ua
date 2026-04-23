import { Outlet } from "react-router-dom";
import HeaderDealer from "../headers/HeaderDealer";
import Footer from "./Footer";




const DealerLayout = () => (
  <div style={styles.layout}>
    {/* Змінюємо absolute на fixed */}
    <div 
  ref={(el) => {
    if (el) el.style.setProperty('z-index', '10000', 'important');
  }}
  style={styles.headerWrapper}
>
  <div style={{ pointerEvents: "auto" }}>
    <HeaderDealer />
  </div>
</div>

    <main style={styles.main}>
      <Outlet />
    </main>
  </div>
);

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
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
    minHeight: "100%",
    width: "100%",
    // Якщо ви хочете, щоб контент сторінки НЕ заходив ПІД хедер 
    // (наприклад, на сторінці Оплат), додайте внутрішній відступ:
    // paddingTop: "132px", 
  },
};

export default DealerLayout;
