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




export default DealerLayout;
