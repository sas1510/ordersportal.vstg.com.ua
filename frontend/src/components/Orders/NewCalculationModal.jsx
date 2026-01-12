import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios.js";

import { useNotification } from "../notification/Notifications.jsx";
import "./NewCalculationModal.css";
import DealerSelect from "../../pages/DealerSelect";
import {
  FaTimes,
  FaSave,
  FaUpload,
  FaTrash,
  FaUserAlt,
  FaChevronDown
} from "react-icons/fa";

import ClientAddressModal from "./ClientAddressModal";

const NewCalculationModal = ({ isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();

  const [orderNumber, setOrderNumber] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не обрано");
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState("");

  const [dealerId, setDealerId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressGuid, setAddressGuid] = useState("");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  /* 🔀 режим адреси */
  const [addressMode, setAddressMode] = useState("dealer"); // dealer | client

  /* 📍 клієнтська адреса */
  const [customAddress, setCustomAddress] = useState({
    text: "",
    lat: null,
    lng: null,
  });

  const [isClientAddressModalOpen, setIsClientAddressModalOpen] = useState(false);

  const role = (localStorage.getItem("role") || "").trim().toLowerCase();
  const isManager = ["manager", "region_manager", "admin"].includes(role);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* =========================
     📦 Завантаження адрес
     ========================= */
  const loadAddresses = async (contractorGuid) => {
    if (!contractorGuid) return;

    setAddressesLoading(true);
    setAddresses([]);
    setAddressGuid("");

    try {
      const res = await axiosInstance.get("/dealer-addresses/", {
        params: { contractor: contractorGuid },
      });

      const list = res.data?.addresses || [];

      const deliveryAddresses = list.filter(
        (a) =>
          typeof a.AddressKind === "string" &&
          a.AddressKind.toLowerCase().includes("достав")
      );

      setAddresses(deliveryAddresses);

      const def = deliveryAddresses.find(
        (a) =>
          a.IsDefault === "\u0001" ||
          a.IsDefault === 1 ||
          a.IsDefault === true
      );

      if (def) setAddressGuid(def.AddressKindGUID);
    } catch (err) {
      console.error(err);
      addNotification("Не вдалося завантажити адресу доставки ❌", "error");
    } finally {
      setAddressesLoading(false);
    }
  };

  /* =========================
     🧠 Відкриття модалки
     ========================= */
  useEffect(() => {
    if (!isOpen) return;

    if (!isManager) {
      const contractorGuid = user.user_id_1c;
      setDealerId(contractorGuid);
      loadAddresses(contractorGuid);
    }
  }, [isOpen]);

  /* =========================
     🧠 Зміна дилера
     ========================= */
  useEffect(() => {
    setIsAddressOpen(false);

    if (!isOpen || !isManager) return;

    if (dealerId) {
      loadAddresses(dealerId);
    } else {
      setAddresses([]);
      setAddressGuid("");
    }
  }, [dealerId, isOpen]);

  /* =========================
     📁 File handlers
     ========================= */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setFileName(selected ? selected.name : "Файл не обрано");
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("Файл не обрано");
    const input = document.getElementById("new-calc-file");
    if (input) input.value = "";
  };

  const resetForm = () => {
    setOrderNumber("");
    setFile(null);
    setFileName("Файл не обрано");
    setItemsCount(1);
    setComment("");
    setDealerId("");
    setAddresses([]);
    setAddressGuid("");
    setIsAddressOpen(false);
    setAddressMode("dealer");
    setCustomAddress({ text: "", lat: null, lng: null });
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  /* =========================
     🚀 Submit
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const contractorGuid = isManager ? dealerId : user.user_id_1c;

    if (!contractorGuid || !orderNumber || !file || !itemsCount || !comment.trim()) {
      addNotification("Заповніть усі поля ❌", "error");
      return;
    }

    if (addressMode === "dealer" && !addressGuid) {
      addNotification("Оберіть адресу доставки ❌", "error");
      return;
    }

    if (
      addressMode === "client" &&
      (!customAddress.text || !customAddress.lat || !customAddress.lng)
    ) {
      addNotification("Оберіть клієнтську адресу ❌", "error");
      return;
    }

    setLoading(true);

    try {
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const payload = {
        contractor_guid: contractorGuid,
        order_number: orderNumber,
        items_count: Number(itemsCount),
        comment,
        file: {
          fileName: file.name,
          fileDataB64: fileBase64,
        },
        ...(addressMode === "dealer"
          ? { delivery_address_guid: addressGuid }
          : {
              client_address: {
                text: customAddress.text,
                lat: customAddress.lat,
                lng: customAddress.lng,
              },
            }),
      };

      const response = await axiosInstance.post("/calculations/create/", payload);

      addNotification(`Прорахунок №${orderNumber} створено ✅`, "success");

      onSave?.(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      addNotification("Помилка при збереженні ❌", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* =========================
     🖼️ UI
     ========================= */
  return (
    <>
      <div className="new-calc-modal-overlay" onClick={onClose}>
        <div className="new-calc-modal-window" onClick={(e) => e.stopPropagation()}>
          <div className="new-calc-modal-border-top">
            <div className="new-calc-modal-header">
              <span className="icon icon-calculator" />
              <h3>Створити новий прорахунок</h3>
              <span
                className="icon icon-cross new-calc-close-btn"
                onClick={handleCloseWithReset}
              />
            </div>
          </div>

          <div className="new-calc-modal-body">
            <form className="new-calc-form" onSubmit={handleSubmit}>
              <label className="new-calc-label-row">
                <span>№:</span>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="new-calc-input"
                />
              </label>

              {isManager && (
                <div className="new-calc-label-row">
                  <span className="flex items-center gap-2">
                    <FaUserAlt />
                    <span>Дилер:</span>
                  </span>
                  <DealerSelect value={dealerId} onChange={setDealerId} />
                </div>
              )}

              {/* 🔀 ПЕРЕМИКАЧ */}
              <div className="address-mode-switch">
                <label>
                  <input
                    type="radio"
                    checked={addressMode === "dealer"}
                    onChange={() => setAddressMode("dealer")}
                  />
                  Моя адреса
                </label>
                <label>
                  <input
                    type="radio"
                    checked={addressMode === "client"}
                    onChange={() => setAddressMode("client")}
                  />
                  Клієнтська адреса
                </label>
              </div>

              {/* ===== DEALER ADDRESS ===== */}
              {addressMode === "dealer" && (
                <div className="new-calc-label-row address-dropdown-wrapper">
                  <span>Адреса доставки:</span>

                  <div
                    className={`address-dropdown ${isAddressOpen ? "open" : ""}`}
                    onClick={() =>
                      !addressesLoading && setIsAddressOpen((p) => !p)
                    }
                  >
                    <div className="address-dropdown-selected">
                      <span>
                        {  addressesLoading
                          ? "Завантаження адрес..."
                          : addresses.find(
                              (a) => a.AddressKindGUID === addressGuid
                            )?.AddressValue || "Оберіть адресу доставки"}
                      </span>
                      <FaChevronDown
                        className={`dropdown-arrow-icon ${
                          isAddressOpen ? "rotated" : ""
                        }`}
                      />
                    </div>

                    {isAddressOpen && (
                      <div className="address-dropdown-menu">
                        {addresses.map((a) => (
                          <div
                            key={a.AddressKindGUID}
                            className="address-dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddressGuid(a.AddressKindGUID);
                              setIsAddressOpen(false);
                            }}
                          >
                            {a.AddressValue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== CLIENT ADDRESS ===== */}
              {addressMode === "client" && (
                <div className="client-address-block">
                  <label className="new-calc-label">
                    <span>Клієнтська адреса:</span>
                    <input
                      className="new-calc-input"
                      readOnly
                      value={customAddress.text || ""}
                      placeholder="Адреса не обрана"
                      onClick={() => setIsClientAddressModalOpen(true)}
                    />
                  

                  <button
                    type="button"
                    className="new-calc-btn-save" 
                    onClick={() => setIsClientAddressModalOpen(true)}
                  >
                    Обрати адресу
                  </button>
                  </label>
                </div>
              )}

              {/* ===== FILE ===== */}
              <div className="new-calc-file-upload">
                <label htmlFor="new-calc-file" className="new-calc-upload-label">
                  <FaUpload size={20} />
                  <span>Завантажити файл (.zkz)</span>
                  <input
                    type="file"
                    id="new-calc-file"
                    accept=".zkz"
                    onChange={handleFileChange}
                    hidden
                  />
                </label>

                <div className="new-calc-file-name">
                  <span>{fileName}</span>
                  {file && (
                    <button
                      type="button"
                      className="new-calc-clear-file"
                      onClick={handleClearFile}
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>

              <label className="new-calc-label-row">
                <span>Кількість конструкцій:</span>
                <input
                  type="number"
                  min="1"
                  value={itemsCount}
                  onChange={(e) => setItemsCount(e.target.value)}
                  className="new-calc-input-number"
                />
              </label>

              <label className="new-calc-label">
                <span>Коментар:</span>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="new-calc-textarea"
                />
              </label>
            </form>
          </div>

          <div className="new-calc-modal-footer">
            <button
              className="new-calc-btn-cancel"
              onClick={handleCloseWithReset}
            >
              <FaTimes /> Відмінити
            </button>
            <button
              className="new-calc-btn-save"
              onClick={handleSubmit}
              disabled={loading}
            >
              <FaSave /> {loading ? "Створюємо..." : "Зберегти"}
            </button>
          </div>

          <div className="new-calc-modal-border-bottom" />
        </div>
      </div>

      {/* ===== CLIENT ADDRESS MODAL ===== */}
      {isClientAddressModalOpen && (
        <ClientAddressModal
          initialValue={customAddress}
          onClose={() => setIsClientAddressModalOpen(false)}
          onSave={(addr) => {
            setCustomAddress(addr);
            setIsClientAddressModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default NewCalculationModal;
