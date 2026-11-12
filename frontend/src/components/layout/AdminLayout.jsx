import RouteContent from "../ui/RouteContent";
import HeaderAdmin from "../headers/HeaderAdmin";
import { useContext } from "react";
import { RoleContext } from "../../context/RoleContext";
import { exitDealerPreview } from "../../api/axios";
import PullToRefresh from "./PullToRefresh";

const AdminLayout = () => {
  const { user } = useContext(RoleContext);
  return (
  <div className="portal-layout-full-width" style={styles.layout}>
    {/* Обгортка хедера з високим z-index та фіксацією */}
    <div 
      ref={(el) => {
        if (el) el.style.setProperty('z-index', '10000', 'important');
      }}
      style={styles.headerWrapper}
    >
      {user?.staff_preview && (
        <div className="flex h-[22px] items-center justify-between gap-2 bg-amber-100 px-2 text-xs text-amber-950">
          <span className="truncate">Перегляд від імені {user.full_name || user.username} · Лише читання</span>
          <button type="button" className="shrink-0 underline" onClick={exitDealerPreview}>Вийти</button>
        </div>
      )}
      <div style={{ pointerEvents: "auto" }}>
        <HeaderAdmin />
      </div>
    </div>

    {/* Основний контент */}
    <PullToRefresh style={user?.staff_preview ? { ...styles.main, marginTop: 22 } : styles.main}>
      <RouteContent />
    </PullToRefresh>

    {/* <Footer /> */}
  </div>
  );
};

const styles = {
   layout: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    paddingTop: "env(safe-area-inset-top, 0px)", 
  },
  headerWrapper: {
    position: "absolute", 
    top: "env(safe-area-inset-top, 0px)",
    left: 0,
    width: "100%",
    zIndex: 100, 
    // paddingTop: "env(safe-area-inset-top, 0px)",
    // paddingBottom: "env(safe-area-inset-bottom, 0px)",
  },
  main: {
    flexGrow: 1,
    // display: "flex",
    // flexDirection: "column",
    height: "100%", 
    width: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    // paddingTop: "calc(48px + env(safe-area-inset-top, 0px))", // Враховуємо висоту хедера + безпечну зону
  },
};

export default AdminLayout;
