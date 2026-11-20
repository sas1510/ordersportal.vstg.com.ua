import { useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ServiceMenu({ links, mobile = false, variant = "admin", onNavigate }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = links.some(link => pathname === link.to || pathname.startsWith(`${link.to}/`));
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const content = <>
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}
      data-header-primary="true"
      className={mobile ? `w-full py-3 px-[15%] flex items-center justify-between text-xl font-bold ${active ? "bg-[#6B98BF] text-white" : "text-[#44403E]"}` : `h-full w-full flex items-center justify-center px-[2px] text-[clamp(14px,0.8vw,15px)] [color:#fff!important] [-webkit-text-fill-color:#fff!important] font-bold leading-tight transition-all text-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-none ${active ? "bg-[var(--header-accent)] text-[var(--header-active-text)] shadow-inner" : "bg-gradient-to-b from-white/5 to-black/5 text-[var(--header-text)] hover:bg-[var(--header-profile-bg)] hover:text-[var(--header-accent)]"}`}>
      {!mobile && variant === "dealer" && <Wrench aria-hidden="true" className="!w-[14px] !h-[14px] shrink-0 mr-[2px] text-[#B4D947]" />}
      <span className={mobile ? undefined : variant === "dealer" ? "[-webkit-text-stroke:0.3px_#B4D947] [paint-order:stroke_fill]" : "header-nav-underline"}>{t("nav.service", { defaultValue: "Сервіс" })}</span>
      <span aria-hidden="true" className="ml-[2px]">{open ? "▴" : "▾"}</span>
    </button>
    {open && <ul className={mobile ? "mx-[10%] rounded-lg bg-[#F9FFE6]/50" : "absolute top-full left-0 min-w-[200px] bg-white shadow-xl py-2 z-[1001]"}>
      {links.map(link => <li key={link.to}><Link to={link.to} aria-current={pathname === link.to ? "page" : undefined}
        className={`block px-4 py-3 text-[14px] font-medium dropdown-header hover:bg-[#6B98BF] hover:text-white ${pathname === link.to ? "bg-[#6B98BF] text-white" : "text-[#44403E]"}`}
        onClick={() => { setOpen(false); onNavigate?.(); }}>{link.mobileTitle || link.title}</Link></li>)}
    </ul>}
  </>;
  return mobile ? <div ref={ref} className="relative w-full">{content}</div> : <li ref={ref} data-header-item="service" className="h-full relative flex-1 flex items-center border-r border-gray-300/30 last:border-r-0">{content}</li>;
}
