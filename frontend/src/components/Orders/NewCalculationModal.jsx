import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axios.js";
import { useNotification } from "../../hooks/useNotification";
import "./NewCalculationModal.css";
import DealerSelect from "../../pages/DealerSelect";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaSave,
  FaUpload,
  FaTrash,
  FaUserAlt,
  FaChevronDown,
  FaCamera, // Додали іконку для фотографій
} from "react-icons/fa";

import ClientAddressModal from "./ClientAddressModal";
import { useAuthGetRole } from "../../hooks/useAuthGetRole";

const NewCalculationModal = ({
  isOpen,
  onClose,
  onSave,
  initialCalculation = null,
}) => {
  const { addNotification } = useNotification();
  const { t, i18n } = useTranslation();
  const isEditMode = Boolean(initialCalculation?.id);
  const [orderNumber, setOrderNumber] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(t("orders.newOrderModal.error_message_2"));
  const [itemsCount, setItemsCount] = useState(1);
  const [comment, setComment] = useState("");
  const [_submitError, setSubmitError] = useState(null);
  const [dealerId, setDealerId] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [addressGuid, setAddressGuid] = useState("");
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [addressMode, setAddressMode] = useState("dealer"); // dealer | client

  const [dealerCoords, setDealerCoords] = useState(null); // { lat, lng }

  const [customAddress, setCustomAddress] = useState({
    text: "",
    lat: null,
    lng: null,
  });

  const [isClientAddressModalOpen, setIsClientAddressModalOpen] =
    useState(false);
  const [orderNumberTouched, setOrderNumberTouched] = useState(false);
  const [itemsCountTouched, setItemsCountTouched] = useState(false);
  const [commentTouched, setCommentTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [fileTouched, setFileTouched] = useState(false);
  const [photosTouched, setPhotosTouched] = useState(false);

  // 📸 Стейт для зберігання масиву обраних фотографій
  const [photos, setPhotos] = useState([]);

  const { role } = useAuthGetRole();
  const isManager = ["manager", "region_manager", "admin"].includes(role);
  const resolvedLanguage = (i18n.resolvedLanguage || i18n.language || "uk")
    .toLowerCase()
    .split("-")[0];

  useEffect(() => {
    if (!isOpen) return;

    setOrderNumber(
      initialCalculation?.webNumber ||
        initialCalculation?.number ||
        "",
    );
    setFile(null);
    setFileName(
      initialCalculation?.fileName ||
        t("orders.newOrderModal.error_message_2"),
    );
    setItemsCount(
      initialCalculation?.constructionsCount ??
        initialCalculation?.constructionsQTY ??
        1,
    );
    setComment(initialCalculation?.sourceComment || "");
    setDealerId(initialCalculation?.dealerId || "");
    setAddresses([]);
    setAddressGuid("");
    setDealerCoords(null);
    setIsAddressOpen(false);
    setAddressMode("dealer");
    setCustomAddress({
      text: "",
      lat: null,
      lng: null,
    });
    setPhotos([]);
    setOrderNumberTouched(false);
    setItemsCountTouched(false);
    setCommentTouched(false);
    setAddressTouched(false);
    setFileTouched(false);
    setPhotosTouched(false);
    setSubmitError(null);
  }, [isOpen, initialCalculation, t]);

  const extractCoordinates = (addressObj) => {
    if (!addressObj) return null;
    let lat = null;
    let lng = null;

    if (typeof addressObj.Coordinates === "string") {
      const [latStr, lngStr] = addressObj.Coordinates.split(",");
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    }

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
          <strong>{t("orders.newOrderModal.coord_message_1")}</strong> <br />
          {t("orders.newOrderModal.coord_message_2")}{" "}
          <br />
          {t("orders.newOrderModal.coord_message_3")}
        </div>,
        "warning",
        10000,
      );
    }
    return coords;
  };

  const translateAddressesForLanguage = useCallback(
    async (items = []) => {
      if (resolvedLanguage === "uk") {
        return items;
      }

      return Promise.all(
        items.map(async (item) => {
          try {
            const response = await fetch(
              `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.AddressValue || "")}&langpair=uk|${resolvedLanguage}`,
            );
            const data = await response.json();
            const translatedText = data?.responseData?.translatedText?.trim();

            return {
              ...item,
              AddressValue: translatedText || item.AddressValue,
            };
          } catch {
            return item;
          }
        }),
      );
    },
    [resolvedLanguage],
  );

  const loadAddresses = async (contractorGuid = null) => {
    setAddressesLoading(true);
    setAddresses([]);
    setAddressGuid("");
    setDealerCoords(null);

    try {
      const res = await axiosInstance.get("/dealer-addresses/", {
        params: contractorGuid ? { contractor: contractorGuid } : {},
      });

      const list = res.data?.addresses || [];
      const deliveryAddresses = list.filter(
        (a) =>
          typeof a.AddressKind === "string" &&
          a.AddressKind.toLowerCase().includes("достав"),
      );

      const translatedAddresses =
        await translateAddressesForLanguage(deliveryAddresses);

      setAddresses(translatedAddresses);

      const selectedSourceAddressText =
        initialCalculation?.deliveryAddresses?.trim() || "";
      const initialAddressIndex = deliveryAddresses.findIndex(
        (address) =>
          String(address?.AddressValue || "").trim() ===
          selectedSourceAddressText,
      );

      const initialAddressByGuid = translatedAddresses.find(
        (address) =>
          address.AddressKindGUID ===
          initialCalculation?.deliveryAddressGuid,
      );

      const initialAddressByText =
        initialAddressIndex >= 0
          ? translatedAddresses[initialAddressIndex]
          : null;

      const def = translatedAddresses.find(
        (a) =>
          a.IsDefault === "\u0001" || a.IsDefault === 1 || a.IsDefault === true,
      );

      const preselectedAddress =
        initialAddressByGuid ||
        initialAddressByText ||
        def;

      if (preselectedAddress) {
        setAddressGuid(preselectedAddress.AddressKindGUID);
        const coords = checkAddressCoordinates(preselectedAddress);
        setDealerCoords(coords);
      }
    } catch (err) {
      console.error(err);
      addNotification(
        <div className="flex ai-center jc-space-between gap-5" style={{ minWidth: "250px" }}>
          <span>{t("orders.newOrderModal.error_message_1")}</span>
          <button
            onClick={() => loadAddresses(contractorGuid)}
            style={{
              background: "white",
              color: "#d32f2f",
              border: "none",
              borderRadius: "4px",
              padding: "4px 4px",
              marginRight: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            {t("orders.newOrderModal.repeat")}
          </button>
        </div>,
        "error",
        0,
      );
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (isManager) {
      if (dealerId) loadAddresses(dealerId);
    } else {
      loadAddresses();
    }
  }, [isOpen, dealerId, isManager, resolvedLanguage]);

  const handleAddressSelect = (addr) => {
    setAddressGuid(addr.AddressKindGUID);
    setIsAddressOpen(false);
    const coords = checkAddressCoordinates(addr);
    setDealerCoords(coords);
    setAddressTouched(true);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setFileTouched(Boolean(selected));
    setFileName(
      selected
        ? selected.name
        : initialCalculation?.fileName ||
            t("orders.newOrderModal.error_message_2"),
    );
  };

  const handleClearFile = () => {
    setFile(null);
    setFileTouched(false);
    setFileName(
      initialCalculation?.fileName ||
        t("orders.newOrderModal.error_message_2"),
    );
    const input = document.getElementById("new-calc-file");
    if (input) input.value = "";
  };

  // 📸 Хендлер вибору фотографій (дозволяє додавати декілька)
  const handlePhotosChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Додаємо нові файли до вже існуючих у стейті
    setPhotos((prevPhotos) => [...prevPhotos, ...selectedFiles]);
    if (selectedFiles.length > 0) {
      setPhotosTouched(true);
    }
  };

  // 📸 Хендлер видалення окремого фото з масиву
  const handleRemovePhoto = (indexToRemove) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setOrderNumber("");
    setFile(null);
    setFileName(t("orders.newOrderModal.error_message_2"));
    setItemsCount(1);
    setComment("");
    setDealerId("");
    setAddresses([]);
    setAddressGuid("");
    setDealerCoords(null);
    setIsAddressOpen(false);
    setAddressMode("dealer");
    setCustomAddress({ text: "", lat: null, lng: null });
    setPhotos([]); // Очищуємо фото
    setOrderNumberTouched(false);
    setItemsCountTouched(false);
    setCommentTouched(false);
    setAddressTouched(false);
    setFileTouched(false);
    setPhotosTouched(false);
  };

  const handleCloseWithReset = () => {
    resetForm();
    onClose();
  };

  // Хелпер для конвертації файлу в Base64 string
  const fileToBase64 = (fileObject) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(fileObject);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if ((!file && !isEditMode) || !itemsCount) {
      addNotification(t("orders.newOrderModal.error_message_3"), "error");
      return;
    }

    if (addressMode === "dealer" && !addressGuid) {
      addNotification(t("orders.newOrderModal.error_message_4"), "error");
      return;
    }

    if (
      addressMode === "client" &&
      (!customAddress.text || !customAddress.lat || !customAddress.lng)
    ) {
      addNotification(t("orders.newOrderModal.error_message_5"), "error");
      return;
    }

    setLoading(true);

    try {
      // 1. Конвертуємо основний файл розрахунку
      const mainFileBase64 = file
        ? await fileToBase64(file)
        : null;

      // 2. Асинхронно конвертуємо весь масив фотографій у формат [{ fileName, fileDataB64 }, ...]
      const convertedPhotos = await Promise.all(
        photos.map(async (photoFile) => {
          const b64Data = await fileToBase64(photoFile);
          return {
            fileName: photoFile.name,
            fileDataB64: b64Data,
          };
        })
      );

      // 3. Формуємо фінальний JSON payload
      const payload = isEditMode
        ? {
            ...(isManager && dealerId && { contractor_guid: dealerId }),
            ...(orderNumberTouched && {
              order_number: orderNumber,
            }),
            ...(itemsCountTouched && {
              items_count: Number(itemsCount),
            }),
            ...(commentTouched && {
              comment,
            }),
            ...(photosTouched && convertedPhotos.length > 0 && {
              photos: convertedPhotos,
            }),
            ...(addressTouched &&
              (addressMode === "dealer"
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
                      contractor_guid: customAddress.contractor_guid || dealerId || null,
                    },
                  })),
          }
        : {
            ...(isManager && dealerId && { contractor_guid: dealerId }),
            order_number: orderNumber,
            items_count: Number(itemsCount),
            comment,
            photos: convertedPhotos,
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
                    contractor_guid: customAddress.contractor_guid || dealerId || null,
                  },
                }),
          };

      if (file && mainFileBase64) {
        payload.file = {
          fileName: file.name,
          fileDataB64: mainFileBase64,
        };
      }

      const endpoint = isEditMode
        ? `/calculations/${initialCalculation.id}/update/`
        : "/calculations/create/";

      const response = await axiosInstance.post(endpoint, payload);

      if (response.data?.success === false) {
        throw new Error(
          response.data?.error ||
            "1C returned an update error",
        );
      }

      addNotification(
        isEditMode
          ? t("orders.newOrderModal.order_updated", { orderNumber: orderNumber || initialCalculation?.number || "" })
          : t("orders.newOrderModal.order_created", { orderNumber: orderNumber }),
        "success",
      );
      onSave?.(response.data);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      addNotification(
        <div className="flex ai-center jc-space-between gap-5" style={{ minWidth: "250px" }}>
          <div className="column">
            <strong>
              {isEditMode
                ? t("orders.newOrderModal.error_message_8")
                : t("orders.newOrderModal.error_message_6")}
            </strong>
            {isEditMode && error?.message ? (
              <span style={{ marginTop: "4px", fontSize: "12px" }}>
                {error.message}
              </span>
            ) : null}
          </div>
          <button
            onClick={handleSubmit}
            style={{
              background: "white",
              color: "#d32f2f",
              border: "none",
              borderRadius: "4px",
              padding: "5px 10px",
              marginRight: "7px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {t("orders.newOrderModal.repeat")}
          </button>
        </div>,
        "error",
        10000,
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="new-calc-modal-overlay" onClick={onClose}>
        <div className="new-calc-modal-window" onClick={(e) => e.stopPropagation()}>
          <div className="new-calc-modal-border-top">
            <div className="new-calc-modal-header">
              <span className="icon icon-calculator" />
              <h3>
                {isEditMode
                  ? t("orders.newOrderModal.order_edit")
                  : t("orders.newOrderModal.order_create")}
              </h3>
              <span className="icon icon-cross new-calc-close-btn" onClick={handleCloseWithReset} />
            </div>
          </div>

          <div className="new-calc-modal-body">
            <form className="new-calc-form" onSubmit={handleSubmit}>
             <label className="new-calc-label">
                <div className="new-calc-label-row new-calc-label-row--order-number">
  <span className="new-calc-field-title">
    {t("orders.newOrderModal.order_number_label")}
  </span>

  <input
    type="text"
    value={orderNumber}
    onChange={(e) => {
      setOrderNumber(e.target.value);
      setOrderNumberTouched(true);
    }}
    className="new-calc-input"
    placeholder={t("orders.newOrderModal.order_number_placeholder")}
  />
</div>

                <small className="new-calc-field-hint">
                  {t("orders.newOrderModal.order_number_hint")}
                </small>
              </label>

              {isManager && (
                <div className="new-calc-label-row">
                  <span className="flex items-center gap-2">
                    <FaUserAlt />
                    <span>{t("orders.newOrderModal.dealer")}</span>
                  </span>
                  <DealerSelect value={dealerId} onChange={setDealerId} />
                </div>
              )}
              
              <div className="address-mode-switch">
                <label>
                  <input
                    type="radio"
                    checked={addressMode === "dealer"}
                    onChange={() => {
                      setAddressMode("dealer");
                      setAddressTouched(true);
                    }}
                  />
                  {t("orders.newOrderModal.myAddress")}
                </label>
                <label>
                  <input
                    type="radio"
                    checked={addressMode === "client"}
                    onChange={() => {
                      setAddressMode("client");
                      setAddressTouched(true);
                    }}
                  />
                  {t("orders.newOrderModal.clientAddress")}
                </label>
              </div>

              {addressMode === "dealer" && (
                <div className="new-calc-label-row address-dropdown-wrapper">
                  <span>{t("orders.newOrderModal.address")}</span>
                  <div
                    className={`address-dropdown ${isAddressOpen ? "open" : ""}`}
                    onClick={() => !addressesLoading && setIsAddressOpen((p) => !p)}
                  >
                    <div className="address-dropdown-selected">
                      <span>
                        {addressesLoading
                          ? t("orders.newOrderModal.loadingOfAddress")
                          : addresses.find((a) => a.AddressKindGUID === addressGuid)?.AddressValue || t("orders.newOrderModal.error_message_4")}
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
                    <span>{t("orders.newOrderModal.clientAddress")}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="new-calc-input"
                        readOnly
                        value={customAddress.text || ""}
                        placeholder={t("orders.newOrderModal.error_message_7")}
                        onClick={() => setIsClientAddressModalOpen(true)}
                      />
                      <button
                        type="button"
                        className="new-calc-btn-save"
                        style={{ padding: "0 15px", whiteSpace: "nowrap" }}
                        onClick={() => setIsClientAddressModalOpen(true)}
                      >
                        {t("orders.newOrderModal.choose")}
                      </button>
                    </div>
                  </label>
                </div>
              )}

     
              <div className="new-calc-file-upload">
                <label htmlFor="new-calc-file" className="new-calc-upload-label">
                  <FaUpload size={20} />
                  <span>{t("orders.newOrderModal.downloadZKZ")}</span>
                  <input
                    type="file"
                    id="new-calc-file"
                    // accept=".zkz"
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

              {/* 📸 2. НОВИЙ БЛОК: Завантаження додаткових фотографій */}
              <div className="new-calc-file-upload" style={{ marginTop: "15px" }}>
                <label htmlFor="new-calc-photos" className="new-calc-upload-label" style={{ backgroundColor: "#76b448" }}>
                  <FaCamera className="text-white" size={20} />
                  <span className="text-white">{t("orders.newOrderModal.addImages")}</span>
                  <input
                    type="file"
                    id="new-calc-photos"
                    accept="image/*"
                    multiple // дозволяє виділити кілька файлів одночасно
                    onChange={handlePhotosChange}
                    hidden
                  />
                </label>
                
                {/* Список обраних зображень */}
                <div className="new-calc-photos-list" style={{ marginTop: "10px", width: "100%" }}>
                  {photos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="new-calc-file-name" 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "6px 10px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        marginBottom: "5px"
                      }}
                    >
                      <span style={{ fontSize: "13px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "85%" }}>
                        {photo.name} ({(photo.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        className="new-calc-clear-file"
                        style={{ color: "#d32f2f", background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="new-calc-label-row">
                <span>{t("orders.newOrderModal.numberOfConstruction")}</span>
                <input
                  type="number"
                  min="1"
                  value={itemsCount}
                  onChange={(e) => {
                    setItemsCount(e.target.value);
                    setItemsCountTouched(true);
                  }}
                  className="new-calc-input-number"
                />
              </label>

              <label className="new-calc-label">
                <span>{t("orders.newOrderModal.comment")}</span>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value);
                    setCommentTouched(true);
                  }}
                  className="new-calc-textarea"
                />
              </label>
            </form>
          </div>

          <div className="new-calc-modal-footer">
            <button className="new-calc-btn-cancel" onClick={handleCloseWithReset}>
              <FaTimes /> {t("orders.newOrderModal.cancel")}
            </button>
            <button className="new-calc-btn-save" onClick={handleSubmit} disabled={loading}>
              <FaSave /> {loading
                ? isEditMode
                  ? t("orders.newOrderModal.updating")
                  : t("orders.newOrderModal.creating")
                : t("orders.newOrderModal.save")}
            </button>
          </div>
        </div>
      </div>

      {isClientAddressModalOpen && (
        <ClientAddressModal
          initialValue={{ ...customAddress, contractor_guid: dealerId }}
          contractorGuid={dealerId}
          onClose={() => setIsClientAddressModalOpen(false)}
          onSave={(addr) => {
            setCustomAddress(addr);
            setAddressTouched(true);
            setIsClientAddressModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default NewCalculationModal;
