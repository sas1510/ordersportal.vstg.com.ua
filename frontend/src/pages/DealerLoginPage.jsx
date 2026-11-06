import { useContext, useEffect, useLayoutEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { RoleContext } from "../context/RoleContext";
import DealerSelectWithAll from "./DealerSelectWithAll";

const STAFF_ROLE_LABELS = {
  admin: "Адміністратор",
  region_manager: "Регіональний менеджер",
  regionalManager: "Регіональний менеджер",
  manager: "Менеджер",
  branch_manager: "Керівник філіалу",
  branches_director: "Директор філіалів",
  director: "Директор",
};

export default function DealerLoginPage() {
  const { user } = useContext(RoleContext);
  const canPreviewStaff = Boolean(user?.can_preview_staff);
  const [staff, setStaff] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const roleOf = (person) => person.role === "regionalManager" ? "region_manager" : person.role;
  const staffRoles = [...new Set(staff.map(roleOf))];
  const [dealerGuid, setDealerGuid] = useState("");
  const [previewPending, setPreviewPending] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [headerHeight, setHeaderHeight] = useState(100);
  useLayoutEffect(() => {
    const header = document.querySelector("[data-portal-header]");
    if (!header) return;
    const updateHeight = () => setHeaderHeight(header.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canPreviewStaff) return;
    const controller = new AbortController();
    axiosInstance.get("/dealer-preview/start/", { signal: controller.signal })
      .then(({ data }) => setStaff(data))
      .catch(() => { if (!controller.signal.aborted) setPreviewError("Не вдалося завантажити список працівників."); });
    return () => controller.abort();
  }, [canPreviewStaff]);

  const startPreview = async (staffMode = false) => {
    setPreviewError("");
    const dealerTab = window.open("about:blank", "_blank");
    if (!dealerTab) {
      setPreviewError("Дозвольте відкриття нових вкладок для порталу й спробуйте ще раз.");
      return;
    }
    dealerTab.opener = null;
    setPreviewPending(true);
    try {
      const { data } = await axiosInstance.post("/dealer-preview/start/", staffMode ? { staff_id: staffId } : { contractor_guid: dealerGuid });
      if (dealerTab.closed) return;
      dealerTab.sessionStorage.setItem("dealerPreviewToken", data.token);
      const startedAt = String(Date.now());
      dealerTab.sessionStorage.setItem("dealerPreviewStartedAt", startedAt);
      dealerTab.sessionStorage.setItem("dealerPreviewActivityAt", startedAt);
      dealerTab.location.replace(new URL(staffMode ? "/admin-order" : "/orders", window.location.origin).href);
    } catch (error) {
      dealerTab.close();
      setPreviewError(error.response?.data?.detail || "Не вдалося відкрити кабінет дилера.");
    } finally {
      setPreviewPending(false);
    }
  };


  return (
    <section className="mx-auto w-full max-w-xl p-6" style={{ paddingTop: headerHeight + 24 }}>
      <h1 className="text-2xl font-bold">Увійти як дилер</h1>
      <p className="my-3">Вибери дилера. Його кабінет відкриється в окремій вкладці.</p>
      <DealerSelectWithAll dealerPreview value={dealerGuid} onChange={setDealerGuid} allowAll={false} placeholder="Вибрати дилера" />
      <button type="button" className="orders-expand-all-button mt-4" disabled={!dealerGuid || previewPending} onClick={() => startPreview()}>
        {previewPending ? "Відкриваємо…" : "Увійти як дилер"}
      </button>
      {canPreviewStaff && (
        <div className="mt-6 border-t border-current pt-4">
          <h2 className="text-xl font-bold">Переглянути як працівник</h2>
          <label className="my-3 block">
            Роль
            <select className="block w-full border border-current p-2" value={staffRole} onChange={(event) => { setStaffRole(event.target.value); setStaffId(""); }}>
              <option value="">Вибрати роль</option>
              {staffRoles.map((role) => <option key={role} value={role}>{STAFF_ROLE_LABELS[role] || role}</option>)}
            </select>
          </label>
          <label className="my-3 block">
            Працівник
            <select className="block w-full border border-current p-2" value={staffId} disabled={!staffRole} onChange={(event) => setStaffId(event.target.value)}>
              <option value="">Вибрати працівника</option>
              {staff.filter((person) => roleOf(person) === staffRole).map((person) => <option key={person.id} value={person.id}>{person.full_name || person.username}</option>)}
            </select>
          </label>
          <button type="button" className="orders-expand-all-button" disabled={!staffId || previewPending} onClick={() => startPreview(true)}>Відкрити перегляд</button>
        </div>
      )}
      {previewError && <p role="alert" className="mt-3 text-red-600">{previewError}</p>}
    </section>
  );
}
