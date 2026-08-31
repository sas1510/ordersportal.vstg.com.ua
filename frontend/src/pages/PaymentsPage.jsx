import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../api/axios";
import { useTheme } from "../hooks/useTheme";
import PaymentModal from "../components/Orders/PaymentModal";
import OrderFilesModal from "../components/Orders/OrderFilesModal";
import DebtDetailModal from "./DebtDetailModal"; // 👈 Імпортуємо нову модалку
import { formatDateHuman } from "../utils/formatters";
import PaymentsMobileContent from "./PaymentsMobileContent.jsx";
// Стилі
import "../components/Portal/PortalOriginal.css";
import "../components/Portal/PortalSidebar.css";
import "./PaymentsPage.css";
import { useNotification } from "../hooks/useNotification";
import { AppIcon } from "../components/Icons/AppIcon";
import PaymentsAnalyticsMobile from "./PaymentsAnalyticsMobile";
import { useTranslation } from "react-i18next";

// Хук для мобільної версії
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1024px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const listener = (e) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isMobile;
};

const useIsMobile_2 = () => {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 1269px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1260px)");
    const listener = (e) => setIsMobile(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  return isMobile;
};

const normalizeCompareValue = (value) => String(value || "").trim().toLowerCase();
const parseFlexibleAmount = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value || "")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  if (!normalized) return 0;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const areBatchSelectionsEqual = (left, right) => {
  const leftKeys = Object.keys(left || {});
  const rightKeys = Object.keys(right || {});

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => {
    const leftValue = Number(left[key] || 0);
    const rightValue = Number(right[key] || 0);
    return Math.abs(leftValue - rightValue) <= 0.005;
  });
};

const getContractOptionValue = (contract, index) => {
  const rawId =
    contract?.Dogovor_ID ??
    contract?.Dogovor_GUID ??
    contract?.DogovorId ??
    contract?.DogovorGuid;

  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== "") {
    return String(rawId).trim();
  }

  return [
    String(contract?.DogovorName || "").trim(),
    String(contract?.CurrencyName || "").trim(),
    String(contract?.DogovorBalance ?? contract?.DogovorSum ?? ""),
    String(index),
  ].join("__");
};

export default function PaymentsPage() {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();

  const isMobileLarger = useIsMobile_2();

  const yearIcon = "/assets/icons/YearIcon.png";
  const plusIcon = "/assets/icons/PlusIcon.png";

  const allPayment = "/assets/icons/AllPayment.png";
  const newCalcIcon = "/assets/icons/NewCalcIcon.png";
  const inProcessingIcon = "/assets/icons/InProcessingIcon.png";
  const waitingForPaymentIcon = "/assets/icons/WaitingForPaymentIcon.png";
  const waitingForConfirmIcon = "/assets/icons/WaitingForConfirmIcon.png";
  const confirmedIcon = "/assets/icons/ConfirmedIcon.png";
  const factoryIcon = "/assets/icons/FactoringIcon.png";
  const finishedIcon = "/assets/icons/FinishedIcon.png";
  const deliveredIcon = "/assets/icons/DeliveredIcon.png";
  const canceledCalcIcon = "/assets/icons/CancelCalc.png";
  const filterIcon = "/assets/icons/FiltersIcon.png";
  const nelicvid = "/assets/icons/Nelicvid.png";
  const allContracts = "/assets/icons/AllContracts.png";
  const contract = "/assets/icons/Contracts.png";
  

  const closeIcon = "/assets/icons/CloseButton.png";

  // Дані
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [debtItems, setDebtItems] = useState([]); // Деталі з SQL для Drill-down
  const [debtTotal, setDebtTotal] = useState(null); // Рядок РАЗОМ

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Стан для Drill-down модалки
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [filteredDetailOrders, setFilteredDetailOrders] = useState([]);

  // Фільтри та UI
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [contractFilter, setContractFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Модалка основної оплати
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [batchPaymentOpen, setBatchPaymentOpen] = useState(false);
  const [batchContractId, setBatchContractId] = useState("");
  const [batchSelection, setBatchSelection] = useState({});
  const [batchAmountDrafts, setBatchAmountDrafts] = useState({});
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedFilesOrder, setSelectedFilesOrder] = useState(null);

  const STATUS_COLORS = {
    "Очікуємо оплату": "status-wait-payment",
    "Очікуємо підтвердження": "status-wait-confirm",
    Підтверджено: "status-confirmed",
    Резервування: "status-reserved",
    "У виробництві": "status-production",
    Готовий: "status-ready",
    Відвантажений: "status-shipped",
    Неліквід: "status-closed",
    "—": "status-unknown",
  };

  const STATUS_FILTERS = [
    { key: "all", label: t("payments_page.status_filters.all"), icon: allPayment, colorClass: "status-all" },
    { key: "Очікуємо підтвердження", label: t("payments_page.status_filters.waiting_confirmation"), icon: waitingForConfirmIcon, colorClass: "status-wait-confirm" },
    { key: "Очікуємо оплату", label: t("payments_page.status_filters.waiting_payment"), icon: waitingForPaymentIcon, colorClass: "status-wait-payment" },
    { key: "Підтверджено", label: t("payments_page.status_filters.confirmed"), icon: confirmedIcon, colorClass: "status-confirmed" },
    { key: "У виробництві", label: t("payments_page.status_filters.production"), icon: factoryIcon, colorClass: "status-production" },
    { key: "Готовий", label: t("payments_page.status_filters.ready"), icon: finishedIcon, colorClass: "status-ready" },
    { key: "Відвантажений", label: t("payments_page.status_filters.shipped"), icon: deliveredIcon, colorClass: "status-shipped" },
    { key: "Неліквід", label: t("payments_page.status_filters.non_liquid"), icon: nelicvid, colorClass: "status-closed" },
  ];

  const contractorGUID =
    JSON.parse(localStorage.getItem("user") || "{}")?.user_id_1c ||
    localStorage.getItem("contractor_guid");

  const formatCurrency = (value) => {
    if (value == null || isNaN(Number(value))) return "0,00";
    const locale =
      i18n.language === "en" ? "en-US" : i18n.language === "de" ? "de-DE" : "uk-UA";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const normalizeStatus = (s) => (s || "—").toString().trim();

  // =====================================================
  // LOAD DATA
  // =====================================================
  const loadData = useCallback(async () => {
    if (!contractorGUID) return;
    setLoading(true);
    setError("");
    try {
      const [resPage, resDebts] = await Promise.all([
        axiosInstance.get("/payments/get_dealer_payment_page_data/", {
          params: { contractor: contractorGUID },
        }),
        axiosInstance.get("/partner-debts/", {
          params: { contractor_guid: contractorGUID },
        }),
      ]);
      setOrders(resPage.data.orders || []);
      setContracts(resPage.data.contracts || []);
      setDebtItems(resDebts.data.debts?.items || []);
      setDebtTotal(resDebts.data.debts?.total || null);
    } catch (_e) {
      setError(t("payments_page.errors.load_data"));
    } finally {
      setLoading(false);
    }
  }, [contractorGUID, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (detailModalOpen) setDetailModalOpen(false);
        if (modalOpen) closeModal();
      }
    };

    if (detailModalOpen || modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailModalOpen, modalOpen]);

  // =====================================================
  // SIDEBAR FILTERS LOGIC
  // =====================================================
  const contractFilters = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => {
      if (o.Dogovor_GUID && o.DogovorName)
        map.set(o.Dogovor_GUID, o.DogovorName);
    });
    return Array.from(map.entries()).map(([guid, name]) => ({
      guid,
      name,
      count: orders.filter((o) => o.Dogovor_GUID === guid).length,
    }));
  }, [orders]);

  const statusSummary = useMemo(() => {
    const summary = { all: orders.length };
    orders.forEach((o) => {
      const s = o.OrderStage || "—";
      summary[s] = (summary[s] || 0) + 1;
    });
    return summary;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === "all" || o.OrderStage === statusFilter;
      const contractOk =
        contractFilter === "all" || o.Dogovor_GUID === contractFilter;
      const searchOk =
        !search ||
        (o.OrderNumber || "")
          .toString()
          .toLowerCase()
          .includes(search.toLowerCase());
      return statusOk && contractOk && searchOk;
    });
  }, [orders, statusFilter, contractFilter, search]);

  const batchContract = useMemo(
    () =>
      contracts.find(
        (item, index) =>
          getContractOptionValue(item, index) === String(batchContractId).trim(),
      ),
    [contracts, batchContractId],
  );
  const batchAvailableAmount = parseFlexibleAmount(
    batchContract?.DogovorBalance ?? batchContract?.DogovorSum ?? 0,
  );

  const batchSelectedOrders = useMemo(
    () =>
      orders
        .filter((order) => Number(batchSelection[order.OrderID_GUID] || 0) > 0)
        .map((order) => ({
          order,
          amount: Number(batchSelection[order.OrderID_GUID] || 0),
        })),
    [batchSelection, orders],
  );
  const batchPrimaryContractKey = useMemo(() => {
    const firstSelectedOrder = batchSelectedOrders[0]?.order;
    return (
      normalizeCompareValue(firstSelectedOrder?.Dogovor_GUID) ||
      normalizeCompareValue(firstSelectedOrder?.Dogovor_ID) ||
      ""
    );
  }, [batchSelectedOrders]);
  const isBatchOrderEligible = useCallback(
    (order) => {
      const orderContractKeys = [
        normalizeCompareValue(order?.Dogovor_GUID),
        normalizeCompareValue(order?.Dogovor_ID),
      ].filter(Boolean);

      if (Number(order?.DebtAmount || 0) <= 0) {
        return false;
      }

      if (!batchPrimaryContractKey) {
        return true;
      }

      return orderContractKeys.includes(batchPrimaryContractKey);
    },
    [batchPrimaryContractKey],
  );

  const batchSelectedTotal = useMemo(
    () => batchSelectedOrders.reduce((sum, item) => sum + item.amount, 0),
    [batchSelectedOrders],
  );

  const batchRemainingAmount = Math.max(0, batchAvailableAmount - batchSelectedTotal);
  const batchHasOverLimit = batchSelectedTotal > batchAvailableAmount + 0.005;
  const clampBatchSelection = useCallback((selection) => {
    const source = selection || {};
    const next = {};

    if (!batchContract) {
      Object.entries(source).forEach(([orderId, amount]) => {
        const parsedAmount = parseFlexibleAmount(amount);
        if (parsedAmount > 0) {
          next[orderId] = Number(parsedAmount.toFixed(2));
        }
      });
      return next;
    }

    let remaining = parseFlexibleAmount(batchAvailableAmount);

    orders.forEach((order) => {
      const orderId = order?.OrderID_GUID;
      const currentAmount = parseFlexibleAmount(source[orderId]);

      if (!orderId || currentAmount <= 0) {
        return;
      }

      if (!isBatchOrderEligible(order)) {
        return;
      }

      const debt = parseFlexibleAmount(order?.DebtAmount);
      const maxAllowed = Math.min(debt, Math.max(0, remaining));
      const clampedAmount = Math.min(currentAmount, maxAllowed);

      if (clampedAmount > 0) {
        next[orderId] = Number(clampedAmount.toFixed(2));
        remaining -= clampedAmount;
      }
    });

    return next;
  }, [batchAvailableAmount, batchContract, isBatchOrderEligible, orders]);
  const getBatchMaxForOrder = useCallback((order) => {
    const debt = parseFlexibleAmount(order?.DebtAmount);
    const currentAmount = parseFlexibleAmount(batchSelection[order?.OrderID_GUID]);

    if (!batchContract) {
      return debt;
    }

    const availableForThisOrder = Math.max(
      0,
      batchAvailableAmount - (batchSelectedTotal - currentAmount),
    );

    return Math.min(debt, availableForThisOrder);
  }, [batchAvailableAmount, batchContract, batchSelectedTotal, batchSelection]);

  const setBatchOrderAmount = useCallback((order, amount, options = {}) => {
    if (!isBatchOrderEligible(order)) {
      return;
    }

    const { notifyOnClamp = false } = options;
    const maxAllowed = getBatchMaxForOrder(order);
    const requestedValue = parseFlexibleAmount(amount);
    const value = Math.max(0, Math.min(requestedValue, maxAllowed));

    if (notifyOnClamp && requestedValue > maxAllowed + 0.005) {
      addNotification(
        t(
          "payments_page.notifications.batch_limit_exceeded",
          "Сума перевищує доступний залишок. Встановлено максимально можливу суму.",
        ),
        "warning",
      );
    }

    setBatchSelection((previous) => {
      const next = { ...previous };
      if (value > 0) {
        next[order.OrderID_GUID] = Number(value.toFixed(2));
      } else {
        delete next[order.OrderID_GUID];
      }
      return next;
    });

    setBatchAmountDrafts((previous) => {
      const next = { ...previous };
      if (value > 0) {
        const rawAmount = String(amount ?? "").trim();
        const wasClamped = requestedValue > maxAllowed + 0.005;
        const shouldShowClampedValue = wasClamped || typeof amount === "number";

        next[order.OrderID_GUID] = shouldShowClampedValue
          ? String(value.toFixed(2)).replace(".", ",")
          : (rawAmount ? rawAmount.replace(".", ",") : String(value.toFixed(2)).replace(".", ","));
      } else {
        delete next[order.OrderID_GUID];
      }
      return next;
    });
  }, [
    addNotification,
    getBatchMaxForOrder,
    isBatchOrderEligible,
    t,
  ]);

  useEffect(() => {
    setBatchSelection((previous) => {
      const next = {};
      Object.entries(previous).forEach(([orderId, amount]) => {
        const order = orders.find((item) => item.OrderID_GUID === orderId);
        if (order && isBatchOrderEligible(order) && Number(amount || 0) > 0) {
          next[orderId] = Number(amount);
        }
      });
      return next;
    });
  }, [batchContractId, contracts, orders, isBatchOrderEligible]);

  useEffect(() => {
    if (!batchContract) {
      return;
    }

    setBatchSelection((previous) => {
      const next = clampBatchSelection(previous);
      if (areBatchSelectionsEqual(previous, next)) {
        return previous;
      }
      return next;
    });
  }, [batchContract, clampBatchSelection]);

  useEffect(() => {
    setBatchAmountDrafts((previous) => {
      const next = {};
      Object.entries(batchSelection).forEach(([orderId, amount]) => {
        if (Number(amount || 0) <= 0) return;
        // Preserve incomplete manual input such as "5,".
        next[orderId] = previous[orderId] ?? String(Number(amount)).replace(".", ",");
      });

      if (areBatchSelectionsEqual(previous, next)) {
        return previous;
      }
      return next;
    });
  }, [batchSelection]);

  useEffect(() => {
    if (!batchPaymentOpen) {
      setBatchSelection({});
      setBatchAmountDrafts({});
    }
  }, [batchPaymentOpen]);

  const debtAnalytics = useMemo(() => {
  const routeDebtOrders = debtItems.filter(
    (order) => Number(order.Debt || 0) > 0,
  );

  const moneyInTransitOrders = debtItems.filter(
    (order) =>
      Number(order.Summa || 0) > 0 &&
      Number(order.Debt || 0) <= 0,
  );

  const criticalOrders = debtItems.filter(
    (order) => Number(order.DebtMoreTen || 0) > 0,
  );

  const noPrepaymentOrders = debtItems.filter(
    (order) => Number(order.BezPeredOplaty || 0) > 0,
  );

  const underfundedOrders = debtItems.filter(
    (order) => Number(order.NedoAvans || 0) > 0,
  );

  const routeDebtTotal = routeDebtOrders.reduce(
    (sum, order) => sum + Number(order.Debt || 0),
    0,
  );

  const moneyInTransitTotal = moneyInTransitOrders.reduce(
    (sum, order) => sum + Number(order.Summa || 0),
    0,
  );

  const postSaleDebtTotal =
    routeDebtTotal + moneyInTransitTotal;

  return {
    routeDebtOrders,
    moneyInTransitOrders,
    criticalOrders,
    noPrepaymentOrders,
    underfundedOrders,

    routeDebtTotal,
    moneyInTransitTotal,
    postSaleDebtTotal,
  };
}, [debtItems]);


  // =====================================================
  // DRILL-DOWN LOGIC
  // =====================================================
  const showDebtDetails = (type) => {
  let filtered = [];
  let title = "";

  switch (type) {
    case "no_prepayment":
      filtered = debtAnalytics.noPrepaymentOrders;
      title = t(
        "payments_page.analytics.no_prepayment_orders",
      );
      break;

    case "critical":
      filtered = debtAnalytics.criticalOrders;
      title = t(
        "payments_page.analytics.critical_orders",
      );
      break;

    case "nedoavans":
      filtered = debtAnalytics.underfundedOrders;
      title = t(
        "payments_page.analytics.underfunded_orders",
      );
      break;

    case "in_route":
      filtered = debtAnalytics.routeDebtOrders;
      title = t(
        "payments_page.analytics.in_route_orders",
      );
      break;

    case "money_way":
      filtered = debtAnalytics.moneyInTransitOrders;
      title = t(
        "payments_page.analytics.money_in_transit_orders",
      );
      break;

    default:
      return;
  }

  setFilteredDetailOrders(filtered);
  setDetailTitle(title);
  setDetailModalOpen(true);
};

  const translateStatus = useCallback(
    (status) => {
      const statusMap = {
        "Очікуємо оплату": t("order_status.waiting_payment"),
        "Очікуємо підтвердження": t("order_status.waiting_confirmation"),
        "Підтверджено": t("payments_page.status_filters.confirmed"),
        "У виробництві": t("order_status.production"),
        "Готовий": t("order_status.ready"),
        "Відвантажений": t("order_status.shipped"),
        "Неліквід": t("payments_page.status_filters.non_liquid"),
        "Резервування": t("payments_page.statuses.reserved"),
        "—": t("payments_page.common.no_data_short"),
      };
      return statusMap[status] || status;
    },
    [t],
  );

  const handlePayFromDetails = (zakazNum) => {
    setSearch(String(zakazNum));
    setStatusFilter("all");
    setContractFilter("all");
    setDetailModalOpen(false);
  };

  const openPaymentModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const openFilesModal = useCallback((order, event) => {
    event?.stopPropagation();

    if (!order?.OrderID_GUID) {
      return;
    }

    setSelectedFilesOrder(order);
    setIsFilesModalOpen(true);
  }, []);
  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const submitBatchPayments = useCallback(async () => {
    if (batchSubmitting) return;

    if (!batchContract) {
      addNotification(
        t("payments_page.notifications.batch_contract_required", "Оберіть авансовий договір."),
        "warning",
      );
      return;
    }

    if (!batchSelectedOrders.length) {
      addNotification(
        t("payments_page.notifications.batch_orders_required", "Оберіть хоча б одне замовлення до оплати."),
        "warning",
      );
      return;
    }

    setBatchSubmitting(true);

    try {
      const response = await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: batchContractId,
        payments: batchSelectedOrders.map(({ order, amount }) => ({
          order_id: order.OrderID_GUID,
          amount: Number(amount.toFixed(2)),
        })),
      });

      if (response?.data?.success !== true) {
        throw new Error("Batch payment was not confirmed by 1C");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 5000));
      await loadData();
      setBatchSelection({});
      setBatchAmountDrafts({});
      setBatchPaymentOpen(false);
      addNotification(
        t("payments_page.notifications.batch_payment_success", "Оплату вибраних замовлень виконано!"),
        "success",
      );
    } catch {
      addNotification(
        t("payments_page.notifications.batch_payment_error", "Не вдалося виконати оплату вибраних замовлень."),
        "warning",
      );
    } finally {
      setBatchSubmitting(false);
    }
  }, [
    addNotification,
    batchContract,
    batchContractId,
    batchSelectedOrders,
    batchSubmitting,
    loadData,
    t,
  ]);

  const makePayment = async (contractID, amount) => {
    try {
      const response = await axiosInstance.post("/payments/make_payment_from_advance/", {
        contract: contractID,
        order_id: selectedOrder.OrderID_GUID,
        amount: Number(amount),
      });
      if (response?.data?.success !== true) {
        throw new Error("Payment was not confirmed by 1C");
      }
      await new Promise((resolve) => window.setTimeout(resolve, 5000));
      await loadData();
      closeModal();
      addNotification(t("payments_page.notifications.payment_success"), "success");
    } catch {
      addNotification(t("payments_page.notifications.payment_error"), "warning");
    }
  };

  const searchIcon = "/assets/icons/SearchIcon.png";

  const Sidebar = (
    <div className={`content-filter-payment column !pr-4 ${isMobileLarger ? (isSidebarOpen ? "open" : "closed") : ""}`}>
      {isMobileLarger && (
        <div className="sidebar-header-payment row ai-center jc-space-between">
          <span>{t("payments_page.filters.title")}</span>
          <div onClick={() => setIsSidebarOpen(false)} >
           <AppIcon name="closeFiltersButton" className='w-[30px] h-[30px]' />
           </div>
          {/* <span className="icon icon-cross" onClick={() => setIsSidebarOpen(false)} /> */}
        </div>
      )}
      <span className="payment-filter-headers-name uppercase">{t("payments_page.filters.search")}</span>
      <div className="search-wrapper-payment">
        <input
          type="text"
          className="search-orders"
          placeholder={t("payments_page.filters.search_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={searchIcon} alt={t("payments_page.filters.search")} className="relative right-[-2%] top-[-60%] cursor-pointer text-[18px] text-[var(--text-color)] leading-none" />
        {!!search && (
          <span
            className="icon icon-cancel2 clear-search-payment"
            title="Очистити пошук"
            onClick={() => setSearch("")}
          />
        )}
      </div>

      <div className="filters-scroll">

      <div className="min-[1260px]:w-72 min-[1260px]:bg-white min-[1260px]:shadow-sm min-[1260px]:py-[18px] min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px] max-[1260px]:bg-transparent max-[1260px]:shadow-none max-[1260px]:py-0 max-[1260px]:w-full max-[1260px]:overflow-visible">
        <div className="payment-type-headers-name !pl-3 !pb-2 uppercase">{t("payments_page.filters.statuses")}</div>
        <ul className="filter column align-center">
          {STATUS_FILTERS.map(({ key, label, icon }) => {
            const count = key === "all" ? statusSummary.all : statusSummary[key] || 0;
            return (
              <li
                key={key}
                className={`filter-item ${statusFilter === key ? "active" : ""} `}
                onClick={() => {
                  setStatusFilter(key);
                  if (isMobileLarger) setIsSidebarOpen(false);
                }}
              >
                <img
                  src={icon}
                  alt=""
                  className={`mr-3 object-contain transition-all duration-300 ${statusFilter === key ? "brightness-0 invert group-hover:invert-0 group-hover:brightness-0" : "opacity-70 group-hover:opacity-100 group-hover:brightness-0"}`}
                />
                <span className="w-100">{label}</span>
                <span>{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="divider-bottom" />

      <div className="min-[1260px]:w-72 mt-3 min-[1260px]:bg-white min-[1260px]:shadow-sm min-[1260px]:py-[18px] min-[1260px]:rounded-tl-[5px] min-[1260px]:rounded-tr-[20px] min-[1260px]:rounded-bl-[5px] min-[1260px]:rounded-br-[20px] max-[1260px]:bg-transparent max-[1260px]:shadow-none max-[1260px]:py-0 max-[1260px]:w-full max-[1260px]:overflow-visible">
        <div className="payment-type-headers-name !pl-3 !pb-2 uppercase">{t("payments_page.filters.contracts")}</div>
        <ul className="filter column align-center">
          <li
            className={`filter-item ${contractFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setContractFilter("all");
              if (isMobileLarger) setIsSidebarOpen(false);
            }}
          >
            <img
              src={allContracts}
              alt=""
              className={`mr-3 w-[20px] h-[20px] object-contain transition-all duration-300 ${contractFilter === "all" ? "brightness-0 invert" : "opacity-70 brightness-0"}`}
            />
            <span className="w-100">{t("payments_page.filters.all_contracts")}</span>
            <span className={`status-badge ${contractFilter === "all" ? "badge-active" : orders.length === 0 ? "badge-zero" : "badge-normal"}`}>
              {orders.length}
            </span>
          </li>

          {contractFilters.map((c) => {
            const isActive = contractFilter === c.guid;
            return (
              <li
                key={c.guid}
                className={`filter-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setContractFilter(c.guid);
                  if (isMobileLarger) setIsSidebarOpen(false);
                }}
              >
                <img
                  src={contract}
                  alt=""
                  className={`mr-3 w-[20px] h-[20px] object-contain transition-all duration-300 ${isActive ? "brightness-0 invert" : "opacity-70 brightness-0"}`}
                />
                <span className="w-100 no-wrap-ellipsis" title={c.name}>
                  {c.name}
                </span>
                <span className={`status-badge ${isActive ? "badge-active" : c.count === 0 ? "badge-zero" : "badge-normal"}`}>
                  {c.count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    </div>
  );

  return (
    <div className={`column portal-body ${isDark ? "dark-theme" : ""}`}>
      {loading && (
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
        </div>
      )}
      {isMobileLarger && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="content-wrapper row w-100 h-100">
        <div className="row h-100 max-w-[1334px] w-100">
          {Sidebar}

          <div className="content scroll-bar-custom " id="content" style={{ paddingTop: '0px' }}>
            <div className="pp-header">
              <div className="pp-title-header row ai-center gap-7">
                {isMobileLarger && (
                  // <span
                  //   className="icon icon-menu font-size-24"
                  //   onClick={() => setIsSidebarOpen(true)}
                  //   style={{ cursor: "pointer" }}
                  // />
                  <div
                  className="mobile-sidebar-toggle mr-1"
                  onClick={() => setIsSidebarOpen(true)}
                
                >
                     <AppIcon name="filters" className='w-[20px] h-[20px]' />
                </div>
                )}
                <div className="payment-type-headers-name uppercase !mt-0 !gap-0 !pt-0 leading-none">
                  {t("payments_page.title")}
                </div>
              </div>
              <button className="pp-reload flex items-center gap-2 font-bold " onClick={loadData}>
                <AppIcon name="reload" className='w-[18px] h-[18px]' /> {t("payments_page.actions.refresh")}
              </button>
            </div>

            {error && <div className="pp-error">{error}</div>}

            {/* АНАЛІТИЧНА ТАБЛИЦЯ */}
            {debtTotal &&
              (isMobile ? (
                <PaymentsAnalyticsMobile
                  debtTotal={debtTotal}
                  formatCurrency={formatCurrency}
                  showDebtDetails={showDebtDetails}
                />
              ) : (
                <div className="analytics-container">
                  <div className="analytics-row-top">
                    <div className="analytics-card !pl-0">
                      <div className="card-title">{t("payments_page.analytics.debt_limit")}</div>
                      <div className="card-value">
                        {debtTotal.CustomerLimit === null || debtTotal.CustomerLimit === 0
                          ? "—"
                          : `${formatCurrency(debtTotal.CustomerLimit)} ${debtTotal.CurrencyName || t("common.currency_uah")}`}
                      </div>
                      <div className="mobile-vert-divider" />
                    </div>

                    <div className="analytics-card">
  <div className="card-title">
    {t("payments_page.analytics.overlimit")}
  </div>

  <div
    className={`card-value ${
      (Number(debtTotal.Debt || 0) +
        Number(debtTotal.Summa || 0) +
        Number(debtTotal.BezPeredOplaty || 0)) >
        Number(debtTotal.CustomerLimit || 0) &&
      Number(debtTotal.CustomerLimit || 0) > 0
        ? "text-danger"
        : ""
    }`}
  >
    {(() => {
      const limit = Number(debtTotal.CustomerLimit || 0);

      const limitUsage =
        Number(debtTotal.Debt || 0) +
        Number(debtTotal.Summa || 0) +
        Number(debtTotal.BezPeredOplaty || 0);

      const overLimit = limitUsage - limit;

      return limit > 0 && overLimit > 0
        ? `${formatCurrency(overLimit)} ${
            debtTotal.CurrencyName || t("common.currency_uah")
          }`
        : "—";
    })()}
  </div>
</div>

                    <div className="analytics-card">
                      <div className="card-title">{t("payments_page.analytics.limit_usage")}</div>
                      <div className="card-value">
                        {debtTotal.CustomerLimit > 0
                          ? formatCurrency(
                              debtTotal.LimitUsage ?? Math.min(Number(debtTotal.CustomerLimit), Number(debtTotal.Debt || 0) + Number(debtTotal.Summa || 0) + Number(debtTotal.BezPeredOplaty || 0))
                            )
                          : "—"}{" "}
                        {debtTotal.CustomerLimit > 0 && `${debtTotal.CurrencyName}`}
                      </div>
                    </div>

                    <div
                      className={`analytics-card ${Number(debtTotal.BezPeredOplaty || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.BezPeredOplaty || 0) > 0 && showDebtDetails("no_prepayment")}
                    >
                      <div className="card-title">{t("payments_page.analytics.no_prepayment")}</div>
                      <div className="card-value">
                        {Number(debtTotal.BezPeredOplaty || 0) > 0
                          ? `${formatCurrency(debtTotal.BezPeredOplaty)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
                          : "—"}
                      </div>
                    </div>

                    <div
                      className={`analytics-card !pr-0 ${Number(debtTotal.NedoAvans || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.NedoAvans || 0) > 0 && showDebtDetails("nedoavans")}
                    >
                      <div className="card-title">{t("payments_page.analytics.underfunded")}</div>
                      <div className="card-value">
                        {Number(debtTotal.NedoAvans || 0) > 0
                          ? `${formatCurrency(debtTotal.NedoAvans)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-divider" />

                  <div className="analytics-row-bottom">
                    <div className="analytics-card !pl-0">
                      <div className="card-title">{t("payments_page.analytics.post_sale_debt")}</div>
                      <div className="card-value">
                        {debtAnalytics.postSaleDebtTotal > 0
                          ? `${formatCurrency(debtAnalytics.postSaleDebtTotal)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
                          : "—"}
                      </div>
                    </div>

                    <div
  className={`analytics-card ${
    debtAnalytics.routeDebtTotal > 0
      ? "pointer-link"
      : ""
  }`}
  onClick={() =>
    debtAnalytics.routeDebtTotal > 0 &&
    showDebtDetails("in_route")
  }
>
  <div className="card-title">
    {t("payments_page.analytics.route_debt")}
  </div>

  <div className="card-value">
    {debtAnalytics.routeDebtTotal > 0
      ? `${formatCurrency(
          debtAnalytics.routeDebtTotal,
        )} ${
          debtTotal.CurrencyName ||
          t("common.currency_uah")
        }`
      : "—"}
  </div>
</div>

                    <div
  className={`analytics-card ${
    debtAnalytics.moneyInTransitTotal > 0
      ? "pointer-link"
      : ""
  }`}
  onClick={() =>
    debtAnalytics.moneyInTransitTotal > 0 &&
    showDebtDetails("money_way")
  }
>
  <div className="card-title">
    {t("payments_page.analytics.money_in_transit")}
  </div>

  <div className="card-value">
    {debtAnalytics.moneyInTransitTotal > 0
      ? `${formatCurrency(
          debtAnalytics.moneyInTransitTotal,
        )} ${
          debtTotal.CurrencyName ||
          t("common.currency_uah")
        }`
      : "—"}
  </div>
</div>

                    <div
                      className={`analytics-card !pr-0 ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "pointer-link" : ""}`}
                      onClick={() => Number(debtTotal.DebtMoreTen || 0) > 0 && showDebtDetails("critical")}
                    >
                      <div className="card-title">{t("payments_page.analytics.debt_over_ten_days")}</div>
                      <div className={`card-value ${Number(debtTotal.DebtMoreTen || 0) > 0 ? "text-danger" : ""}`}>
                        {Number(debtTotal.DebtMoreTen || 0) > 0
                          ? `${formatCurrency(debtTotal.DebtMoreTen)} ${debtTotal.CurrencyName || t("common.currency_uah")}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* АВАНСИ */}
            <h2 className="pp-title" style={{ marginTop: 24 }}>
              {t("payments_page.sections.advances")}
            </h2>
            <div className="pp-badges">
              {contracts.length === 0 ? (
                <div className="pp-empty">{t("payments_page.empty.no_advances")}</div>
              ) : (
                contracts.map((c, i) => (
                  <div key={i} className="pp-badge">
                    {c.DogovorName} —{"\u00A0"}
                    <strong> {formatCurrency(c.DogovorBalance)} {c.CurrencyName}</strong>
                  </div>
                ))
              )}
            </div>

            {/* СПИСОК ЗАМОВЛЕНЬ */}
            <div className={batchPaymentOpen ? "batch-payment-sticky-anchor" : ""}>
            <div className="flex items-center justify-between gap-3" style={{ marginTop: 4, marginBottom: 8 }}>
              <h2 className="pp-title" style={{ marginTop: 0 }}>
                {t("payments_page.sections.orders_to_pay")}
              </h2>
              <div className="flex items-center gap-3">
                {batchPaymentOpen && (
                  <button
                    className="pp-pay-btn"
                    type="button"
                    disabled={!batchContract || !batchSelectedOrders.length || batchHasOverLimit || batchSubmitting}
                    onClick={submitBatchPayments}
                  >
                    {batchSubmitting
                      ? t("payments_page.batch.processing", "Оплата...")
                      : t("payments_page.batch.pay_selected", "Оплатити всі")}
                  </button>
                )}
                <button className="pp-pay-btn" type="button" onClick={() => setBatchPaymentOpen((value) => !value)}>
                  {batchPaymentOpen
                    ? t("payments_page.batch.cancel_selection", "Скасувати вибір")
                    : t("payments_page.batch.open", "Оплатити декілька замовлень")}
                </button>
              </div>
            </div>
            {batchPaymentOpen && (
              <div className="batch-payment-inline">
                <label>{t("payments_page.batch.advance_contract", "Авансовий договір")}
                  <select
                    value={batchContractId}
                    onChange={(event) => {
                      setBatchContractId(event.target.value);
                      setBatchSelection({});
                      setBatchAmountDrafts({});
                    }}
                  >
                    <option value="">{t("payments_page.batch.choose_contract", "Оберіть договір")}</option>
                    {contracts.map((item, index) => (
                      <option
                        key={getContractOptionValue(item, index)}
                        value={getContractOptionValue(item, index)}
                      >
                        {item.DogovorName} — {formatCurrency(item.DogovorBalance)} {item.CurrencyName}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="batch-payment-summary-row">
                  {batchContract && (
                    <>
                      <strong>
                        {t("payments_page.batch.available", "Доступно")}: {formatCurrency(batchAvailableAmount)} {batchContract.CurrencyName}
                      </strong>
                      <strong>
                        {t("payments_page.batch.selected_total", "Обрано на суму")}: {formatCurrency(batchSelectedTotal)} {batchContract.CurrencyName}
                      </strong>
                      <strong className={batchHasOverLimit ? "batch-payment-limit-error" : ""}>
                        {t("payments_page.batch.remaining", "Залишок авансу")}: {formatCurrency(batchRemainingAmount)} {batchContract.CurrencyName}
                      </strong>
                    </>
                  )}
                  <strong>
                    {t("payments_page.batch.selected_count", "Обрані на оплату")}: {batchSelectedOrders.length}
                  </strong>
                </div>
                {!batchContract && (
                  <div className="batch-payment-hint-inline">
                    {t("payments_page.batch.choose_contract_hint", "Спочатку відмітьте замовлення одного основного договору, потім оберіть авансовий договір для списання.")}
                  </div>
                )}
                {batchContract && (
                  <div className="batch-payment-hint-inline">
                    {t("payments_page.batch.single_contract_hint", "Авансовий договір є лише джерелом списання. За один раз можна оплачувати замовлення лише одного основного договору.")}
                  </div>
                )}
              </div>
            )}
            </div>
            {isMobile ? (
              <PaymentsMobileContent
                filteredOrders={filteredOrders}
                openPaymentModal={openPaymentModal}
                openFilesModal={openFilesModal}
                formatCurrency={formatCurrency}
                normalizeStatus={normalizeStatus}
                translateStatus={translateStatus}
                STATUS_FILTERS={STATUS_FILTERS}
                inProcessingIcon={inProcessingIcon}
              />
            ) : (
              <div className="pp-orders-wrapper">
                {filteredOrders.length === 0 ? (
                  <div className="pp-empty">{t("payments_page.empty.no_orders_filtered")}</div>
                ) : (
                  filteredOrders.map((o, i) => (
                    <div
                      className={
                        "pp-order-card" +
                        (batchPaymentOpen ? " batch-payment-active" : "") +
                        (batchPaymentOpen && batchContract && !isBatchOrderEligible(o)
                          ? " batch-payment-disabled"
                          : "")
                      }
                      key={i}
                    >
                      <div className="pp-section pp-order-meta">
                        <button
                          type="button"
                          className="pp-num-block pp-num-trigger"
                          onClick={(event) => openFilesModal(o, event)}
                        >
                          <div className="pp-num">№ {String(o.OrderNumber || "").trim()}</div>
                          {String(o.BaseDocumentNumber || "").trim() && (
                            <div className="pp-base-doc-num">№ {String(o.BaseDocumentNumber || "").trim()}</div>
                          )}
                        </button>
                        <div className="pp-date">
                          {o.OrderDate ? formatDateHuman(o.OrderDate.slice(0, 10), i18n.language) : "—"}
                        </div>
                      </div>

                      <div className="pp-section pp-status-col">
                        {(() => {
                          const currentStatus = normalizeStatus(o.OrderStage);
                          const statusObj = STATUS_FILTERS.find((f) => f.key === currentStatus);
                          const statusIcon = statusObj ? statusObj.icon : inProcessingIcon;
                          const statusColor = statusObj ? statusObj.colorClass : "status-unknown";

                          return (
                            <span className={`status-pill ${statusColor}`}>
                              <img src={statusIcon} alt="" className="brightness-0 invert" />
                              {translateStatus(currentStatus)}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">{t("payments_page.labels.amount")}</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="money" className="w-[20px] h-[18px]" />
                          <strong className="order-sum">
                            {formatCurrency(o.OrderSum)}
                            <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                          </strong>
                        </div>
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">{t("payments_page.labels.paid")}</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="moneyGreen" className="w-[20px] h-[18px]" />
                          <strong className="pp-green">
                            {formatCurrency(o.PaidAmount)}
                            <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                          </strong>
                        </div>
                      </div>

                      <div className="pp-section pp-info-block">
                        <div className="pp-label">{t("payments_page.labels.balance_due")}</div>
                        <div className="pp-value-wrapper">
                          <AppIcon name="moneyRed" className="w-[20px] h-[18px] pp-red" />
                          <strong className="pp-red">
                            {formatCurrency(o.DebtAmount)}
                            <span className="pp-currency">{o.CurrencyName || t("common.currency_uah")}</span>
                          </strong>
                        </div>
                      </div>

                      {!batchPaymentOpen ? (
                        <div className="pp-section pp-pay-btn-wrapper">
                          <button className="pp-pay-btn" onClick={() => openPaymentModal(o)}>
                            <span className="pp-pay-icon">
                              <AppIcon name="pay" className="w-[20px] h-[20px]" />
                            </span>
                            {t("payments_page.actions.pay")}
                          </button>
                        </div>
                      ) : null}

                      {batchPaymentOpen ? (
                        <div className="batch-payment-card-actions-row">
                          <label className="batch-payment-inline-check">
                            <input
                              type="checkbox"
                              checked={Boolean(batchSelection[o.OrderID_GUID])}
                              disabled={!batchContract || !isBatchOrderEligible(o)}
                              onChange={(event) =>
                                setBatchOrderAmount(
                                  o,
                                  event.target.checked ? Number(o.DebtAmount || 0) : 0,
                                  { notifyOnClamp: true },
                                )
                              }
                            />
                          </label>
                          <div className="batch-payment-amount-field">
                            <input
                              type="text"
                              min="0"
                              max={getBatchMaxForOrder(o)}
                              step="0.01"
                              placeholder={t("payments_page.batch.amount_short", "Сума")}
                              inputMode="decimal"
                              value={batchAmountDrafts[o.OrderID_GUID] ?? (batchSelection[o.OrderID_GUID] ? String(batchSelection[o.OrderID_GUID]).replace(".", ",") : "")}
                              disabled={!batchContract || !isBatchOrderEligible(o)}
                              onChange={(event) => {
                                const draftValue = event.target.value;
                                setBatchAmountDrafts((previous) => ({
                                  ...previous,
                                  [o.OrderID_GUID]: draftValue,
                                }));

                                if (draftValue === "") {
                                  setBatchOrderAmount(o, 0);
                                  return;
                                }

                                setBatchOrderAmount(o, draftValue, { notifyOnClamp: true });
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            disabled={!batchContract || !isBatchOrderEligible(o)}
                            onClick={() =>
                              setBatchOrderAmount(o, Number(o.DebtAmount || 0) * 0.5, {
                                notifyOnClamp: true,
                              })
                            }
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            disabled={!batchContract || !isBatchOrderEligible(o)}
                            onClick={() =>
                              setBatchOrderAmount(o, Number(o.DebtAmount || 0), {
                                notifyOnClamp: true,
                              })
                            }
                          >
                            100%
                          </button>
                          {batchContract && !isBatchOrderEligible(o) ? (
                            <span className="batch-payment-row-hint">
                              {t("payments_page.batch.other_contract", "Інший основний договір")}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🛠️ ВИКОРИСТОВУЄМО ОНОВЛЕНУ МOДАЛКУ ДЕТАЛЕЙ */}
        <DebtDetailModal
          isOpen={detailModalOpen}
          title={detailTitle}
          orders={filteredDetailOrders}
          isDark={isDark}
          formatCurrency={formatCurrency}
          onClose={() => setDetailModalOpen(false)}
          onPay={handlePayFromDetails}
        />

        {isFilesModalOpen && selectedFilesOrder && (
          <OrderFilesModal
            orderGuid={selectedFilesOrder.OrderID_GUID}
            orderNumber={String(selectedFilesOrder.OrderNumber || "").trim()}
            hideZkzFiles
            entityType="order"
            onClose={() => {
              setIsFilesModalOpen(false);
              setSelectedFilesOrder(null);
            }}
          />
        )}

        {/* PAYMENT MODAL */}
        {modalOpen && selectedOrder && (
          <PaymentModal
            order={selectedOrder}
            contracts={contracts}
            onClose={closeModal}
            onConfirm={makePayment}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}
