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
import { useAuth } from '../../hooks/useAuth';

const NewCalculationModal = ({ isOpen, onClose, onSave }) => {
  const { addNotification } = useNotification();

  const [orderNumber, setOrderNumber] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("Файл не обрано");
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [dealerId, setDealerId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressGuid, setAddressGuid] = useState("");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  /* 🔀 режим адреси */
  const [addressMode, setAddressMode] = useState("dealer"); // dealer | client

  /* 📍 координати dealer-адреси */
  const [dealerCoords, setDealerCoords] = useState(null); // { lat, lng }

  /* 📍 клієнтська адреса */
  const [customAddress, setCustomAddress] = useState({
    text: "",
    lat: null,
    lng: null,
  });

  const [isClientAddressModalOpen, setIsClientAddressModalOpen] = useState(false);

  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const isManager = ["manager", "region_manager", "admin"].includes(role);

  /* ======================================================
     ❗ Перевірка + витяг координат з адреси
     ====================================================== */
  const extractCoordinates = (addressObj) => {
    if (!addressObj) return null;

    let lat = null;
    let lng = null;

    // 1️⃣ формат "48.26,25.93"
    if (typeof addressObj.Coordinates === "string") {
      const [latStr, lngStr] = addressObj.Coordinates.split(",");
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    }

    // 2️⃣ fallback
    lat = lat ?? addressObj.Latitude ?? addressObj.lat;
    lng = lng ?? addressObj.Longitude ?? addressObj.lng;

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat !== 0 &&
      lng !== 0
    ) {
      return { lat, lng };
    }

    return null;
  };

  const checkAddressCoordinates = (addressObj) => {
    const coords = extractCoordinates(addressObj);

    if (!coords) {
      addNotification(
        <div style={{ lineHeight: "1.4" }}>
          <strong>Увага! Гео-координати не встановлені.</strong> <br />
          Для коректного прорахунку логістики необхідно вказати точку на карті. <br />
          Будь ласка, <strong>зверніться до вашого менеджера</strong> для оновлення даних адреси <br />

          {/* <a
            href="https://ordersportal.vstg.com.ua/edit-addresses"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#fff", textDecoration: "underline", fontWeight: "bold", display: "inline-block", marginTop: "5px" }}
          >
            Редагувати адресу на карті
          </a> */}
        </div>,
        "warning",
        10000
      );
    }

    return coords;
  };

  /* =========================
      📦 Завантаження адрес
     ========================= */
  const loadAddresses = async (contractorGuid = null) => {
    setAddressesLoading(true);
    setAddresses([]);
    setAddressGuid("");
    setDealerCoords(null);

    try {
      const res = await axiosInstance.get("/dealer-addresses/", {
        params: contractorGuid ? { contractor: contractorGuid } : {}
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

      if (def) {
        setAddressGuid(def.AddressKindGUID);
        const coords = checkAddressCoordinates(def);
        setDealerCoords(coords);
      }
    } catch (err) {
      console.error(err);
      addNotification(
        <div className="flex ai-center jc-space-between gap-5" style={{ minWidth: '250px' }}>
          <span>Не вдалося завантажити адреси:</span>
          <button 
            onClick={() => loadAddresses(contractorGuid)} 
            style={{
              background: 'white',
              color: '#d32f2f', // колір для помилки
              border: 'none',
              borderRadius: '4px',
              padding: '4px 4px',
              marginRight: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            ПОВТОРИТИ
          </button>
        </div>,
        "error",
        0
        // 10000 // Збільшуємо час відображення до 10 сек, щоб користувач встиг натиснути
      );
    } finally {
      setAddressesLoading(false);
    }
  };

  /* =========================
      🧠 Effects
     ========================= */


  
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    // Очищуємо слухач при закритті модалки або демонтажі компонента
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  
  useEffect(() => {
    if (!isOpen) return;

    if (isManager) {
      if (dealerId) loadAddresses(dealerId);
    } else {
      loadAddresses();
    }
  }, [isOpen, dealerId]);

  const handleAddressSelect = (addr) => {
    setAddressGuid(addr.AddressKindGUID);
    setIsAddressOpen(false);
    const coords = checkAddressCoordinates(addr);
    setDealerCoords(coords);
  };

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
    setDealerCoords(null);
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
    setSubmitError(null);
    
    if (!orderNumber || !file || !itemsCount) {
      addNotification("Заповніть усі поля", "error");
      return;
    }

    if (addressMode === "dealer") {
        if (!addressGuid) {
            addNotification("Оберіть адресу доставки", "error");
            return;
        }
        // // ПЕРЕВІРКА НАЯВНОСТІ КООРДИНАТ
        // if (!dealerCoords) {
        //     addNotification(
        //       <div style={{ lineHeight: "1.4" }}>
        //         <strong>Помилка!</strong> Обрана адреса не має гео-координат. <br />
        //         Будь ласка, оберіть іншу адресу або додайте точку на карті. <br />
        //         <a
        //           href="https://ordersportal.vstg.com.ua/edit-addresses"
        //           target="_blank"
        //           rel="noopener noreferrer"
        //           style={{ color: "#fff", textDecoration: "underline", fontWeight: "bold" }}
        //         >
        //           Додати точку на карті
        //         </a>
        //       </div>,
        //       "warning",
        //       12000
        //     );
        //     return;
        // }
    }

    if (
      addressMode === "client" &&
      (!customAddress.text || !customAddress.lat || !customAddress.lng)
    ) {
      addNotification("Оберіть клієнтську адресу", "error");
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
        ...(isManager && dealerId && { contractor_guid: dealerId }),
        order_number: orderNumber,
        items_count: Number(itemsCount),
        comment,
        file: {
          fileName: file.name,
          fileDataB64: fileBase64,
        },
        ...(addressMode === "dealer"
          ? {
              delivery_address_guid: addressGuid,
              ...(dealerCoords && {
                delivery_address_coordinates: dealerCoords,
              }),
            }
          : {
              client_address: {
                text: customAddress.text,
                lat: customAddress.lat,
                lng: customAddress.lng,

                region: customAddress.region,
                district: customAddress.district,
                city: customAddress.city,
                street: customAddress.street,
                house: customAddress.house,
                apartment: customAddress.apartment,
                entrance: customAddress.entrance,
                floor: customAddress.floor,
                note: customAddress.note,

                full_name: customAddress.fullName,
                phone: customAddress.phone,
                extra_info: customAddress.extraInfo,

                contractor_guid:
                  customAddress.contractor_guid || dealerId || null,
              },
            }),
      };

      const response = await axiosInstance.post(
        "/calculations/create/",
        payload
      );

      addNotification(`Прорахунок №${orderNumber} створено ✅`, "success");
      onSave?.(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      addNotification(
            <div className="flex ai-center jc-space-between gap-5" style={{ minWidth: '250px' }}>
                <div className="column">
                    <strong>Помилка створення: </strong>
                    {/* <span style={{ fontSize: '13px', opacity: 0.9 }}>{serverMessage}</span> */}
                </div>
                <button 
                    onClick={handleSubmit} 
                    style={{
                        background: 'white',
                        color: '#d32f2f',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '5px 10px',
                        marginRight: '7px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    ПОВТОРИТИ
                </button>
            </div>,
            "error",
            10000 // 0 означає, що нотифікація не зникне сама, поки користувач не натисне або не закриє
        );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  
  return (
    <>
      <div className="new-calc-modal-overlay" onClick={onClose}>
        <div
          className="new-calc-modal-window"
          onClick={(e) => e.stopPropagation()}
        >
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

              {addressMode === "dealer" && (
                <div className="new-calc-label-row address-dropdown-wrapper">
                  <span>Адреса доставки:</span>
                  <div
                    className={`address-dropdown ${isAddressOpen ? "open" : ""}`}
                    onClick={() => !addressesLoading && setIsAddressOpen((p) => !p)}
                  >
                    <div className="address-dropdown-selected">
                      <span>
                        {addressesLoading
                          ? "Завантаження адрес..."
                          : addresses.find((a) => a.AddressKindGUID === addressGuid)?.AddressValue || "Оберіть адресу доставки"}
                      </span>
                      <FaChevronDown className={`dropdown-arrow-icon ${isAddressOpen ? "rotated" : ""}`} />
                    </div>

                    {isAddressOpen && (
                      <div className="address-dropdown-menu">
                        {addresses.map((a) => (
                          <div
                            key={a.AddressKindGUID}
                            className="address-dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddressSelect(a);
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

              {addressMode === "client" && (
                <div className="client-address-block">
                  <label className="new-calc-label">
                    <span>Клієнтська адреса:</span>
                    <div style={{ display: "flex", gap: "8px" }}>
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
                        style={{ padding: "0 15px", whiteSpace: "nowrap" }}
                        onClick={() => setIsClientAddressModalOpen(true)}
                      >
                        Обрати
                      </button>
                    </div>
                  </label>
                </div>
              )}

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
                    <button type="button" className="new-calc-clear-file" onClick={handleClearFile}>
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
            <button className="new-calc-btn-cancel" onClick={handleCloseWithReset}>
              <FaTimes /> Відмінити
            </button>
            <button className="new-calc-btn-save" onClick={handleSubmit} disabled={loading}>
              <FaSave /> {loading ? "Створюємо..." : "Зберегти"}
            </button>
          </div>
        </div>
      </div>

      {isClientAddressModalOpen && (
        <ClientAddressModal
  initialValue={{
    ...customAddress,
    contractor_guid: dealerId,
  }}
  contractorGuid={dealerId}
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