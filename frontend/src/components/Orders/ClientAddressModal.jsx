import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { FaTimes, FaSave, FaSearch } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import "./ClientAddressModal.css";
// Якщо ви створили файл useNotification.js у папці hooks:
import { useNotification } from "../../hooks/useNotification";

/* ================= CONSTANTS ================= */
const DEFAULT_CENTER = [48.3794, 31.1656];

/* ================= HELPERS ================= */

// Валідація: рівно 13 символів, формат +380...
const isValidPhoneUA = (phone) => {
  return /^\+380\d{9}$/.test(phone);
};

// Розумне форматування телефону під час введення
const formatPhoneInput = (value) => {
  let digits = value.replace(/[^\d]/g, ""); // тільки цифри

  if (!digits) return "";

  // Авто-підстановка коду країни
  if (digits.startsWith("0")) {
    digits = "38" + digits;
  } else if (digits.startsWith("9")) {
    digits = "380" + digits;
  } else if (digits.startsWith("80")) {
    digits = "3" + digits;
  }

  // Завжди додаємо плюс на початок і обмежуємо довжину до 13 символів (+380...)
  return ("+" + digits).slice(0, 13);
};

/* ================= MAP HELPERS ================= */
function ClickHandler({ onSelect, onAddressFound }) {
  useMapEvents({
    async click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      onSelect(coords);

      const address = await reverseGeocode(coords[0], coords[1]);
      onAddressFound(address);
    },
  });
  return null;
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? 18);
  }, [center, zoom, map]);
  return null;
}

/* ================= REVERSE GEOCODE ================= */
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "uk" } },
    );
    const data = await res.json();
    return data?.display_name || "";
  } catch {
    return "";
  }
};

/* ================= BUILD ADDRESS ================= */
const buildAddressFromForm = (f) =>
  [f.region, f.district, f.city, f.street, f.house].filter(Boolean).join(", ");

/* ================= COMPONENT ================= */
const ClientAddressModal = ({ initialValue, onClose, onSave }) => {
  const { addNotification } = useNotification();

  /* ===== ADDRESS FORM ===== */
  const [formAddr, setFormAddr] = useState({
    region: initialValue?.region || "",
    district: initialValue?.district || "",
    city: initialValue?.city || "",
    street: initialValue?.street || "",
    house: initialValue?.house || "",
    apartment: initialValue?.apartment || "",
    entrance: initialValue?.entrance || "",
    floor: initialValue?.floor || "",
    note: initialValue?.note || "",
  });

  /* ===== CONTACT FORM ===== */
  const [clientContact, setClientContact] = useState({
    fullName: initialValue?.fullName || "",
    phone: initialValue?.phone || "",
    extraInfo: initialValue?.extraInfo || "",
  });

  const [selectedCoords, setSelectedCoords] = useState(
    initialValue?.lat && initialValue?.lng
      ? [initialValue.lat, initialValue.lng]
      : null,
  );

  const [mapDisplayName, setMapDisplayName] = useState(
    initialValue?.text || "",
  );

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDragHint, setShowDragHint] = useState(false);
  const [isPreciseLocation, setIsPreciseLocation] = useState(
    !!initialValue?.lat,
  );

  const debounceRef = useRef(null);

  const requiredFields = useMemo(
    () => ["region", "district", "city", "street", "house"],
    [],
  );

  /* ================= SEARCH ================= */
  const triggerSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: 5,
        countrycodes: "ua",
      });

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        { headers: { "Accept-Language": "uk" } },
      );

      setSuggestions(await res.json());
    }, 400);
  };

  /* ================= FORM → MAP ================= */
  const handleFindOnMap = () => {
    const addr = buildAddressFromForm(formAddr);

    if (!addr) {
      addNotification("Заповніть обовʼязкові поля адреси", "error");
      return;
    }

    setSearch(addr);
    triggerSearch(addr);
    setSuggestions([]);
    setShowDragHint(true);
    setIsPreciseLocation(false);
  };

  const onAddressUpdateFromMap = (address) => {
    setMapDisplayName(address);
    setSearch(address);
    setShowDragHint(false);
    setIsPreciseLocation(true);
  };

  const handleMarkerDrag = async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setSelectedCoords([lat, lng]);
    const address = await reverseGeocode(lat, lng);
    onAddressUpdateFromMap(address);
  };

  /* ================= SAVE ================= */
  const handleSave = () => {
    for (const k of requiredFields) {
      if (!String(formAddr[k]).trim()) {
        addNotification(`Заповніть обовʼязкове поле: ${k}`, "error");
        return;
      }
    }

    // Валідація ПІБ (мінімум 2 слова)
    if (
      !clientContact.fullName.trim() ||
      clientContact.fullName.trim().split(" ").length < 2
    ) {
      addNotification("Вкажіть ПІБ клієнта (Прізвище та Ім'я)", "error");
      return;
    }

    // Валідація телефону
    if (!isValidPhoneUA(clientContact.phone)) {
      addNotification("Некоректний формат телефону (+380XXXXXXXXX)", "error");
      return;
    }

    if (!selectedCoords) {
      addNotification("Оберіть точку на карті", "error");
      return;
    }

    if (!isPreciseLocation) {
      addNotification(
        "Уточніть точку: перетягніть маркер або клацніть точніше",
        "error",
      );
      return;
    }

    onSave({
      /* ===== GEO ===== */
      text: mapDisplayName || buildAddressFromForm(formAddr),
      lat: selectedCoords[0],
      lng: selectedCoords[1],

      /* ===== ADDRESS ===== */
      ...formAddr,

      /* ===== CLIENT ===== */
      fullName: clientContact.fullName.trim(),
      phone: clientContact.phone.trim(),
      extraInfo: clientContact.extraInfo.trim(),

      /* ===== CONTRACTOR ===== */
      // contractor_guid: contractorGuid || initialValue?.contractor_guid || null,
    });

    addNotification("Дані про адресу клієнта успішно збережено ✅", "success");
    onClose();
  };

  /* ================= UI ================= */
  return (
    <div className="new-calc-modal-overlay" onClick={onClose}>
      <div
        className="new-calc-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-calc-modal-border-top">
          <div className="new-calc-modal-header">
            <h3>🏠 Клієнтська адреса</h3>
            <span
              className="icon icon-cross new-calc-close-btn"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="new-calc-modal-body">
          {/* ===== CONTACT FORM ===== */}
          <div className="client-address-form">
            <h4 className="section-title">Контакти клієнта</h4>
            <div className="client-address-grid">
              <input
                placeholder="ПІБ клієнта (Прізвище та Ім'я) *"
                value={clientContact.fullName}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, fullName: e.target.value }))
                }
              />

              <input
                placeholder="Телефон (+380...) *"
                value={clientContact.phone}
                maxLength={13}
                onChange={(e) => {
                  const val = e.target.value;
                  // Дозволяємо видалення символів без авто-дописування
                  if (e.nativeEvent.inputType === "deleteContentBackward") {
                    setClientContact((p) => ({ ...p, phone: val }));
                  } else {
                    setClientContact((p) => ({
                      ...p,
                      phone: formatPhoneInput(val),
                    }));
                  }
                }}
              />

              <input
                placeholder="Додаткова інформація"
                value={clientContact.extraInfo}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, extraInfo: e.target.value }))
                }
              />
            </div>
          </div>

          {/* ===== ADDRESS FORM ===== */}
          <div className="client-address-form">
            <h4 className="section-title">Адреса доставки</h4>

            <div className="client-address-grid">
              {[
                ["region", "Область *"],
                ["district", "Район *"],
                ["city", "Місто *"],
                ["street", "Вулиця *"],
                ["house", "Будинок *"],
                ["apartment", "Квартира"],
                ["entrance", "Підʼїзд"],
                ["floor", "Поверх"],
                ["note", "Примітка"],
              ].map(([k, p]) => (
                <input
                  key={k}
                  placeholder={p}
                  value={formAddr[k]}
                  onChange={(e) =>
                    setFormAddr((prev) => ({ ...prev, [k]: e.target.value }))
                  }
                />
              ))}
            </div>

            <button
              type="button"
              className="client-address-find-btn"
              onClick={handleFindOnMap}
            >
              <FaSearch /> Знайти на карті
            </button>
          </div>

          {/* ===== SEARCH ===== */}
          <div className="search-container">
            <input
              className="search-input client-address-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                triggerSearch(e.target.value);
              }}
              placeholder="Пошук адреси на карті..."
            />

            {suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((s) => (
                  <div
                    key={s.place_id}
                    className="suggestion-item"
                    onClick={() => {
                      setSelectedCoords([+s.lat, +s.lon]);
                      setMapDisplayName(s.display_name);
                      setSearch(s.display_name);
                      setSuggestions([]);
                      setIsPreciseLocation(true);
                      setShowDragHint(false);
                    }}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showDragHint && (
            <div className="warning">
              Перетягніть маркер для уточнення точки
            </div>
          )}

          {/* ===== MAP ===== */}
          <div className="map-holder-modal">
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={6}
              style={{ height: "300px", borderRadius: "8px" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewUpdater center={selectedCoords} />
              <ClickHandler
                onSelect={setSelectedCoords}
                onAddressFound={onAddressUpdateFromMap}
              />
              {selectedCoords && (
                <Marker
                  position={selectedCoords}
                  draggable
                  eventHandlers={{ dragend: handleMarkerDrag }}
                />
              )}
            </MapContainer>
          </div>
        </div>

        <div className="new-calc-modal-footer">
          <button className="new-calc-btn-cancel" onClick={onClose}>
            <FaTimes /> Скасувати
          </button>
          <button className="new-calc-btn-save" onClick={handleSave}>
            <FaSave /> Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAddressModal;
