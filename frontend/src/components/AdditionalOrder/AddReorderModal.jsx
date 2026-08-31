import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaPlus, FaSpinner } from "react-icons/fa";
import axiosInstance from "../../api/axios";
import CustomSelect from "./CustomSelect";
import DealerSelectWithAll from "../../pages/DealerSelectWithAll";
import { useTranslation } from "react-i18next";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";
import { useDealerContext } from "../../hooks/useDealerContext";
import "./AddReorderModal.css";

const ALL_DEALERS_VALUE = "__ALL__";

export default function AddReorderModal({
  isOpen,
  onClose,
  onSave,
  initialOrderNumber,
  initialContractorGuid,
}) {
  const { t, i18n } = useTranslation();
  const { isBackoffice } = useAuthGetRole();
  const { dealerGuid } = useDealerContext();
  const [orderNumber, setOrderNumber] = useState("");
  const [noOrder, setNoOrder] = useState(false);
  const [nomenclature, setNomenclature] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [_selectedReason, setSelectedReason] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [contractorGuid, setContractorGuid] = useState("");
  const [orderDeliveryAddress, setOrderDeliveryAddress] = useState("");
  const [manualDeliveryAddress, setManualDeliveryAddress] = useState("");
  const [deliveryAddressMode, setDeliveryAddressMode] = useState("order");
  const [loading, setLoading] = useState(false);
  const resolvedLanguage = (i18n.resolvedLanguage || i18n.language || "uk")
    .toLowerCase()
    .split("-")[0];
  const resolvedInitialContractorGuid =
    initialContractorGuid ||
    (dealerGuid && dealerGuid !== ALL_DEALERS_VALUE ? dealerGuid : "");

  const normalizeOptionValue = useCallback(
    (value = "") => value.replace(/^\*\s*/, "").trim(),
    [],
  );

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setOrderNumber(initialOrderNumber || "");
      setContractorGuid(resolvedInitialContractorGuid || "");
    setOrderDeliveryAddress("");
    setManualDeliveryAddress("");
    setDeliveryAddressMode("order");
      fetchDropdownData();
    }
  }, [isOpen, initialOrderNumber, resolvedInitialContractorGuid, resolvedLanguage]);

  const translateOptionsForLanguage = useCallback(
    async (items = [], fieldName = "Name") => {
      const normalizedItems = items.map((item) => ({
        ...item,
        [fieldName]: normalizeOptionValue(item?.[fieldName] || ""),
      }));

      if (resolvedLanguage === "uk") {
        return normalizedItems;
      }

      return Promise.all(
        normalizedItems.map(async (item) => {
          const cleanValue = item?.[fieldName] || "";

          if (!cleanValue) {
            return item;
          }

          try {
            const response = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanValue)}&langpair=uk|${resolvedLanguage}`,
            );
            const data = await response.json();
            const translatedText = data?.responseData?.translatedText?.trim();
            const finalText = translatedText || cleanValue;

            return {
              ...item,
              [fieldName]: finalText,
            };
          } catch {
            return item;
          }
        }),
      );
    },
    [normalizeOptionValue, resolvedLanguage],
  );

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const [nomRes, reasonRes] = await Promise.all([
        axiosInstance.get("/additional_orders/additional_order_nomenclature/"),
        axiosInstance.get("/additional_orders/get_issue_additional_order/"),
      ]);

      const nomData = nomRes.data?.nomenclature || [];
      const formattedNom = nomData.map((item) => ({
        ...item,
        Link: item.Link || item.URL,
        Name: item.Name,
      }));

      const reasonData = reasonRes.data?.issues || [];
      const formattedReasons = reasonData.map((item) => ({
        ...item,
        Link: item.Link,
        Name:
          item.Name ||
          item.name ||
          Object.values(item).find(
            (value) => typeof value === "string" && value.trim(),
          ) ||
          "",
      }));

      const [translatedNom, translatedReasons] = await Promise.all([
        translateOptionsForLanguage(formattedNom),
        translateOptionsForLanguage(formattedReasons),
      ]);

      setNomenclature(translatedNom);
      setReasons(translatedReasons);

      if (translatedNom.length > 0) setSelectedItem(translatedNom[0].Link);
      if (translatedReasons.length > 0) {
        setSelectedReason(translatedReasons[0].Link);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryAddress = useCallback(async () => {
    if (!isOpen) return;

    try {
      const response = await axiosInstance.get("/additional_orders/delivery-address/", {
        params: {
          order_number: noOrder ? "" : orderNumber.trim(),
          contractor_guid: contractorGuid || resolvedInitialContractorGuid || "",
        },
      });
      setOrderDeliveryAddress(response.data?.address || "");
    } catch {
      setOrderDeliveryAddress("");
    }
  }, [isOpen, noOrder, orderNumber, contractorGuid, resolvedInitialContractorGuid]);

  useEffect(() => {
    fetchDeliveryAddress();
  }, [fetchDeliveryAddress]);

  const resetForm = () => {
    setOrderNumber("");
    setNoOrder(false);
    setSelectedItem(nomenclature.length > 0 ? nomenclature[0].Link : "");
    setSelectedReason(reasons.length > 0 ? reasons[0].Link : "");
    setQuantity(1);
    setComment("");
    setContractorGuid(resolvedInitialContractorGuid || "");
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      orderNumber: noOrder ? null : orderNumber,
      noOrder,
      nomenclatureLink: selectedItem,
      quantity: Number(quantity),
      comment,
      order_delivery_address: (deliveryAddressMode === "order" ? orderDeliveryAddress : manualDeliveryAddress).trim(),
      ...(isBackoffice && contractorGuid ? { contractor_guid: contractorGuid } : {}),
    };
    onSave?.(formData);
    handleCloseWithReset();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="reorder-modal-overlay" onClick={handleCloseWithReset}>
      <div className="reorder-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="reorder-modal-header">
          <div className="reorder-header-content">
            <span className="reorder-icon">
              <FaPlus />
            </span>
            <h3>{t("reorder_modal.title")}</h3>
          </div>
          <FaTimes className="reorder-close-btn" onClick={handleCloseWithReset} />
        </div>

        <form className="reorder-form" onSubmit={handleSubmit}>
          {isBackoffice ? (
            <div className="reorder-label">
              <span>Контрагент</span>
              <DealerSelectWithAll
                value={contractorGuid}
                onChange={setContractorGuid}
                allowAll={false}
                placeholder="Оберіть контрагента"
              />
            </div>
          ) : null}

          <div className="reorder-label">
            <span>{t("reorder_modal.order_number")}</span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              disabled={noOrder}
              className="reorder-input"
              placeholder={t("reorder_modal.order_placeholder")}
            />
          </div>

          <label className="reorder-label reorder-row">
            <input
              type="checkbox"
              checked={noOrder}
              onChange={(e) => setNoOrder(e.target.checked)}
            />
            <span>{t("reorder_modal.no_order")}</span>
          </label>

          <div className="reorder-label">
            <span>{t("add_claim.delivery_address")}</span>
            <label className="reorder-row">
              <input
                type="radio"
                name="additional-order-delivery-address"
                checked={deliveryAddressMode === "order"}
                onChange={() => setDeliveryAddressMode("order")}
              />
              <span>{orderDeliveryAddress || t("add_claim.use_order_delivery_address")}</span>
            </label>
            <label className="reorder-row">
              <input
                type="radio"
                name="additional-order-delivery-address"
                checked={deliveryAddressMode === "manual"}
                onChange={() => setDeliveryAddressMode("manual")}
              />
              <span>{t("add_claim.enter_delivery_address")}</span>
            </label>
            {deliveryAddressMode === "manual" && (
              <textarea
                className="reorder-input"
                value={manualDeliveryAddress}
                onChange={(event) => setManualDeliveryAddress(event.target.value)}
                placeholder={t("add_claim.select_delivery_address")}
                rows={2}
              />
            )}
          </div>

          <CustomSelect
            label={t("reorder_modal.item_label")}
            options={nomenclature}
            value={selectedItem}
            onChange={setSelectedItem}
            disabled={loading}
            placeholder={
              loading
                ? t("reorder_modal.loading")
                : t("reorder_modal.select_placeholder")
            }
          />

          <div className="reorder-label">
            <span>{t("reorder_modal.quantity")}</span>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="reorder-input"
              required
            />
          </div>

          <label className="reorder-label">
            <span>{t("reorder_modal.comment_label")}</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="reorder-textarea"
              placeholder={t("reorder_modal.comment_placeholder")}
            />
          </label>

          <div className="reorder-modal-footer">
            <button
              type="button"
              className="reorder-btn-cancel"
              onClick={handleCloseWithReset}
            >
              <FaTimes /> {t("reorder_modal.btn_cancel")}
            </button>
            <button
              type="submit"
              className="reorder-btn-save"
              disabled={loading || (!noOrder && !orderNumber) || (isBackoffice && !contractorGuid)}
            >
              {loading ? <FaSpinner className="spinner" /> : <FaPlus />} {t("reorder_modal.btn_save")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
