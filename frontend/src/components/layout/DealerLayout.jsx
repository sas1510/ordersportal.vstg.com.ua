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
    // Прибираємо minHeight: "100vh", щоб не роздувати область
    height: "100%", 
    width: "100%",
    overflowY: "auto", // Скрол з'явиться тільки тут, якщо контенту багато
    boxSizing: "border-box",
    
    // Тут падінг НЕ потрібен, якщо ви вже поставили його в .portal-body
    paddingTop: "0px", 
  },
};

export default DealerLayout;
