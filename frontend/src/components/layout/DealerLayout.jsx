import { Outlet } from "react-router-dom";
import HeaderDealer from "../headers/HeaderDealer";
import Footer from "./Footer";

const DealerLayout = () => (
  <div className="min-h-screen flex flex-col">
    {/* Хедер залишається на місці, але ми міняємо логіку main */}
    <HeaderDealer />
    
    <main style={styles.main}>
      <Outlet />
    </main>
    
    <Footer />
  </div>
);

const styles = {
  main: {
    flexGrow: 1,
    /* Щоб контент заходив ПІД хедер:
      1. Прибираємо всі paddingTop.
      2. Додаємо від'ємний margin-top, який дорівнює висоті хедера + його відступу зверху.
      Висота вашого хедера: 32px (відступ) + 30px (смуга) + 70px (панель) = 132px.
    */
    marginTop: "-132px", 
    position: "relative",
    zIndex: 1, // контент сторінки
  },
};

export default DealerLayout;