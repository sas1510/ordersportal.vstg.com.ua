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
    // Використовуємо dvh для динамічного підлаштування під мобільні браузери
    height: "100dvh", 
    width: "100%",
    position: "relative",
    overflow: "hidden", // Це важливо, щоб сам layout не скролився, скролився тільки main
  },
  headerWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 1000,
    pointerEvents: "none", 
  },
 main: {
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  width: "100%",
  // Прибираємо фіксовані висоти тут, щоб вони не сумувалися з падінгами
  minHeight: 0, 
  overflowY: "auto", 
  boxSizing: "border-box",
  // Якщо хочете падінг саме в CSS порталу, тут поставте 0
  paddingTop: "0px", 
},
};
export default DealerLayout;
