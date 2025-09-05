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
    paddingTop: "60px",   // приблизно висота Header
    paddingBottom: "60px" // приблизно висота Footer
  },
};

export default AdminLayout;
