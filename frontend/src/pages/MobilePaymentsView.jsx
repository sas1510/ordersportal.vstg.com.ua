import React, { useState, useEffect } from "react";
import "./MobilePaymentsView.css";

import { formatDateHuman } from "../utils/formatters";

import DealerSelect from "./DealerSelect";

import { formatPercent } from "../utils/formatMoney";

const MobilePaymentsView = ({
  groups,
  formatCurrency,
  detectPaymentChannel,
  expandedRows,
  toggleRow,
  filters,
  onFilterChange,
  onSearch,
  onExcel,
  isAdmin,
  setDealerGuid,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showFilters ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showFilters]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getArrowIcon = (item) => {
    if (item.FlowDirection === "Прихід")
      return <span className="mobile-arrow arrow-in">▲</span>;
    if (item.FlowDirection === "Витрата")
      return <span className="mobile-arrow arrow-out">▼</span>;
    return <span className="mobile-arrow arrow-none">•</span>;
  };

  const getChannelBadge = (channel) => {
    const map = {
      bank: "БАНК",
      cash: "КАСА",
      order: "ЗАМОВЛ.",
      none: "—",
    };
    return (
      <span className={`mobile-channel-badge ${channel}`}>
        {map[channel] || "—"}
      </span>
    );
  };

  return (
    <div className="mobile-payments-container">
      <div className="mobile-top-card">
        {/* HEADER */}
        <div className="mobile-header">
          <h2 className="mobile-title">
            <i className="fa-solid fa-right-left" style={{ marginRight: 8 }} />
            Рух коштів
          </h2>

          <button
            className="mobile-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Фільтри"
          >
            <i
              className={`fa-solid ${showFilters ? "fa-xmark" : "fa-sliders"}`}
            />
          </button>
        </div>

        {/* FILTERS */}
        {showFilters && (
          <div className="mobile-filters">
            <div className="mobile-filter-group">
              <label className="mobile-label">З:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange("dateFrom", e.target.value)}
                className="mobile-input-date"
              />
            </div>

            <div className="mobile-filter-group">
              <label className="mobile-label">По:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange("dateTo", e.target.value)}
                className="mobile-input-date"
              />
            </div>
            {isAdmin && (
              <div className="mobile-filter-group">
                <label className="mobile-label">Дилер:</label>

                <DealerSelect
                  value={filters.contractor}
                  onChange={(id) => {
                    setDealerGuid(id);
                    onFilterChange("contractor", id);
                  }}
                  isMobile
                />
              </div>
            )}

            <div className="mobile-filter-actions">
              <button
                className="mobile-btn mobile-btn-primary"
                onClick={() => {
                  onSearch();
                  setShowFilters(false);
                }}
              >
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{ marginRight: 8 }}
                />
                Пошук
              </button>

              <button
                className="mobile-btn mobile-btn-refresh"
                onClick={onSearch}
                aria-label="Оновити"
              >
                <i className="fa-solid fa-rotate-right" />
              </button>

              {/* 🆕 EXCEL */}
              <button
                className="mobile-btn mobile-btn-excel"
                onClick={onExcel}
                aria-label="Excel"
              >
                <i className="fa-solid fa-file-excel" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= LIST ================= */}
      <div className="mobile-groups-list">
        {groups.length === 0 && (
          <div className="mobile-empty">Даних не знайдено</div>
        )}

        {groups.map((group) => (
          <div key={group.date} className="mobile-date-group">
            <div className="mobile-day-surface">
              {/* DATE HEADER */}
              <div className="mobile-date-header sticky-date">
                <div className="mobile-date-title">
                  📅 {formatDateHuman(group.date)}
                </div>
              </div>

              {/* ⬇️ SCROLLABLE CONTRACTS */}
              <div className="mobile-contracts-list">
                {Object.values(group.initialContracts).map((c, idx) => (
                  <div key={idx} className="mobile-contract-badge">
                    <span className="mobile-contract-name">
                      {c.contractName}:
                    </span>
                    <span className="mobile-contract-value">
                      {formatCurrency(c.initialSaldo)}
                    </span>
                  </div>
                ))}
              </div>

              {/* DOCUMENTS */}
              {Object.values(group.documentGroups).map((docGroup) => {
                const firstItem = docGroup.items[0];
                const docKey = docGroup.docKey;
                const channel = detectPaymentChannel(firstItem);
                const isExpanded = expandedRows.has(docKey);

                const canExpand =
                  channel === "order" &&
                  (firstItem.DocumentType === "ППВход" ||
                    firstItem.DocumentType === "ПКО") &&
                  docGroup.items.length > 0;

                return (
                  <div
                    key={docKey}
                    className={`mobile-doc-card ${
                      firstItem.FlowDirection === "Прихід"
                        ? "income"
                        : firstItem.FlowDirection === "Витрата"
                          ? "expense"
                          : "neutral"
                    }`}
                  >
                    {/* MAIN */}
                    <div
                      className={`mobile-doc-main ${
                        canExpand ? "" : "no-expand"
                      } ${isExpanded ? "expanded" : ""}`}
                      onClick={() => canExpand && toggleRow(docKey)}
                    >
                      <div className="mobile-doc-header">
                        <div className="mobile-doc-time">
                          {getArrowIcon(firstItem)}
                          <span>
                            {(firstItem.Date || "").split("T")[1]?.slice(0, 5)}
                          </span>
                        </div>
                        {getChannelBadge(channel)}
                      </div>

                      <div className="mobile-doc-operation">
                        {firstItem.DocumentType === "КорректировкаДолга"
                          ? `Коригування. ${firstItem.DescriptionCor || ""}`
                          : firstItem.DealType || firstItem.DocumentType || "—"}
                      </div>

                      <div className="mobile-doc-amounts">
                        <div className="mobile-amount-item">
                          <span className="mobile-amount-label">Початок:</span>
                          <span className="mobile-amount-value">
                            {formatCurrency(docGroup.CumSaldoStart)}
                          </span>
                        </div>

                        {docGroup.totalIncome > 0 && (
                          <div className="mobile-amount-item">
                            <span className="mobile-amount-label">Прихід:</span>
                            <span className="mobile-amount-value text-green">
                              {formatCurrency(docGroup.totalIncome, "")} грн
                            </span>
                          </div>
                        )}

                        {docGroup.totalExpense > 0 && (
                          <div className="mobile-amount-item">
                            <span className="mobile-amount-label">Розхід:</span>
                            <span className="mobile-amount-value text-red">
                              {formatCurrency(docGroup.totalExpense, "")} грн
                            </span>
                          </div>
                        )}

                        <div className="mobile-amount-item mobile-amount-total">
                          <span className="mobile-amount-label">Залишок:</span>
                          <span className="mobile-amount-value text-bold">
                            {formatCurrency(docGroup.lastCumSaldo)}
                          </span>
                        </div>
                      </div>

                      {canExpand ? (
                        <div className="mobile-expand-btn">
                          {isExpanded ? (
                            <>
                              <i
                                className="fa-solid fa-chevron-up"
                                style={{ marginRight: 6 }}
                              />
                              Сховати замовлення
                            </>
                          ) : (
                            <>
                              <i
                                className="fa-solid fa-chevron-down"
                                style={{ marginRight: 6 }}
                              />
                              Рознесено на замовлення
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="mobile-contract">
                          <i
                            className="fa-solid fa-file-contract"
                            style={{ marginRight: 6 }}
                          />
                          {firstItem.FinalDogovorName || "—"}
                        </div>
                      )}
                    </div>

                    {/* SUBORDERS */}
                    {canExpand && isExpanded && (
                      <div className="mobile-suborders">
                        {docGroup.items.map((item, idx) => {
                          // const payment = Math.abs(Number(item.DeltaRow || 0));
                          // const debt = Number(item.OrderBalance || 0);

                          return (
                            <div
                              key={idx}
                              className="order-mini-card-mobile clickable-subcard"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* HEADER */}
                              <div className="order-mini-header">
                                <i className="fa-solid fa-file-invoice" />{" "}
                                Замовлення № {item.OrderNumber}
                              </div>

                              {/* GRID */}
                              <div className="order-mini-grid">
                                {/* СУМА */}
                                <div className="order-mini-col">
                                  <span className="order-mini-label">Сума</span>
                                  <span className="order-mini-value">
                                    {formatCurrency(item.OrderAmount)}
                                  </span>
                                </div>

                                {/* ОПЛАЧЕНО ДО */}
                                <div className="order-mini-col">
                                  <span className="order-mini-label">
                                    Оплачено до
                                  </span>
                                  <span className="order-mini-value text-grey">
                                    {formatCurrency(item.PaidBefore)}
                                  </span>
                                </div>

                                {/* Оплата */}
                                <div
                                  className="order-mini-col"
                                  style={{ fontSize: "14px" }}
                                >
                                  <span className="order-mini-label">
                                    Оплата
                                  </span>
                                  <span
                                    className={
                                      item.FlowDirection === "Прихід"
                                        ? "order-mini-green"
                                        : "order-mini-red"
                                    }
                                  >
                                    {formatCurrency(
                                      Math.abs(Number(item.DeltaRow || 0)),
                                    )}
                                  </span>
                                </div>

                                {/* Борг */}
                                <div
                                  className="order-mini-col"
                                  style={{ fontSize: "14px" }}
                                >
                                  <span className="order-mini-label">Борг</span>
                                  <span className="order-mini-red">
                                    {formatCurrency(
                                      Math.abs(Number(item.DeltaRow || 0)),
                                    )}
                                  </span>
                                </div>

                                {/* СТАТУС — НИЖЧЕ, НА ВСЮ ШИРИНУ */}
                                <div className="order-mini-col">
                                  <span className="order-mini-label">
                                    Відсоток оплати
                                  </span>
                                  <span className="order-mini-value">
                                    <span
                                      className={
                                        item.PaymentStatus < 50
                                          ? "mini-red"
                                          : "mini-green"
                                      }
                                    >
                                      {item.PaymentStatus !== null
                                        ? `${formatPercent(item.PaymentStatus)} %`
                                        : "—"}
                                    </span>
                                  </span>
                                </div>

                                {/* ДОГОВІР */}
                                <div className="order-mini-col">
                                  <span className="order-mini-label">
                                    Договір
                                  </span>
                                  <span className="order-mini-value">
                                    {item.FinalDogovorName || "—"}
                                  </span>
                                </div>

                                {/* ДАТА */}
                                <div className="order-mini-col">
                                  <span className="order-mini-label">Дата</span>
                                  <span className="order-mini-value">
                                    {
                                      (
                                        formatDateHuman(item.OrderDate) || ""
                                      ).split("T")[0]
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {showScrollTop && (
        <button
          className="mobile-scroll-top"
          onClick={scrollToTop}
          aria-label="На верх"
        >
          <i className="fa-solid fa-chevron-up" />
        </button>
      )}
    </div>
  );
};

export default MobilePaymentsView;
