import RouteContent from "../ui/RouteContent";
import HeaderDealer from "../headers/HeaderDealer";
import { useContext } from "react";
import { RoleContext } from "../../context/RoleContext";
import { dealerPreviewToken, exitDealerPreview } from "../../api/axios";
import PullToRefresh from "./PullToRefresh";




const DealerLayout = () => {
  const { user } = useContext(RoleContext);
  const delegated = Boolean(dealerPreviewToken());
  return (
  <div className="portal-layout-full-width" style={styles.layout}>
    {/* Змінюємо absolute на fixed */}
    <div 
  ref={(el) => {
    if (el) el.style.setProperty('z-index', '10000', 'important');
  }}
  style={styles.headerWrapper}
>
  {delegated && (
    <div className="flex h-[22px] items-center justify-between gap-2 bg-amber-100 px-2 text-xs text-amber-950">
      <span className="truncate">{user?.staff_preview ? "Перегляд дилера · Лише читання" : "Ви дієте від імені дилера"} — {user?.full_name || user?.username}</span>
      <button type="button" className="shrink-0 underline" onClick={exitDealerPreview}>Вийти</button>
    </div>
  )}
  <div style={{ pointerEvents: "auto" }}>
    <HeaderDealer />
  </div>
</div>

    <PullToRefresh style={delegated ? { ...styles.main, marginTop: 22 } : styles.main}>
      <RouteContent />
    </PullToRefresh>
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




export default DealerLayout;
