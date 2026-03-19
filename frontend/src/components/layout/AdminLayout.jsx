import { Outlet } from "react-router-dom";
import HeaderAdmin from "../headers/HeaderAdmin";
import Footer from "./Footer";

const AdminLayout = () => (
  <div className="min-h-screen flex flex-col">
    <HeaderAdmin />
    {/* p-4 - відступ збоку виглядає прикольно */}
    <main style={styles.main}>
      <Outlet />
    </main>
    <Footer />
  </div>
);

const styles = {

   main: {
    flexGrow: 1,
    height: "calc(100% - 60px)", // висота вікна мінус висота header і footer
    position: "relative",
  },
};

export default AdminLayout;
