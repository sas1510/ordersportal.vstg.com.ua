import { Outlet } from "react-router-dom";
import HeaderDealer from "../headers/HeaderDealer";
import Footer from "./Footer"; 

const DealerLayout = () => (
  <>
    <div className="min-h-screen flex flex-col">
    <HeaderDealer />
    <main style={styles.main}>
      <Outlet />
    </main>
     <Footer />
      </div>
  </>

);

const styles = {

   main: {
    flexGrow: 1,
    paddingTop: "60px",   // приблизно висота Header
    paddingBottom: "60px" // приблизно висота Footer
  },
};
export default DealerLayout;
