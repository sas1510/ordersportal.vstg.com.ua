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
    // height замість minHeight фіксує область
    height: "100dvh", 
    width: "100%",
    position: "relative",
    overflow: "hidden", // Забороняємо скрол всього лейауту
    boxSizing: "border-box", // В JS пишеться camelCase: boxSizing
  },
  // PublicLayout.js стилі
headerWrapper: {
  position: "fixed", // Краще fixed, щоб хедер не зникав при скролі
  top: 0,
  left: 0,
  width: "100%",
  zIndex: 100,
},
main: {
  display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,     // Важливо! Це каже флексу ігнорувати внутрішній розмір контенту
    width: "100%",
    overflow: "hidden", // Main сам НЕ скролиться
    boxSizing: "border-box",   // Гарантує, що flex-item може стискатися
},
};

export default DealerLayout;
