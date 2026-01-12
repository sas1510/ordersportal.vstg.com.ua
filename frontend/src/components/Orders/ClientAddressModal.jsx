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
import { useNotification } from "../../components/notification/Notifications";

/* ================= CONSTANTS ================= */
const DEFAULT_CENTER = [48.3794, 31.1656];

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
      { headers: { "Accept-Language": "uk" } }
    );
    const data = await res.json();
    return data?.display_name || "";
  } catch {
    return "";
  }
};

/* ================= HELPERS ================= */
const buildAddressFromForm = (f) =>
  [f.region, f.district, f.city, f.street, f.house]
    .filter(Boolean)
    .join(", ");

const isValidPhone = (phone) =>
  /^\+?\d[\d\s\-()]{8,}$/.test(phone);

/* ================= COMPONENT ================= */
const ClientAddressModal = ({ initialValue, onClose, onSave }) => {
  const { addNotification } = useNotification();

  /* ===== ADDRESS FORM ===== */
  const [formAddr, setFormAddr] = useState({
    region: "",
    district: "",
    city: "",
    street: "",
    house: "",
    apartment: "",
    entrance: "",
    floor: "",
    note: "",
  });

  /* ===== CLIENT CONTACT FORM ===== */
  const [clientContact, setClientContact] = useState({
    fullName: initialValue?.fullName || "",
    phone: initialValue?.phone || "",
    extraInfo: initialValue?.extraInfo || "",
  });

  /* ===== MAP STATE ===== */
  const [selectedCoords, setSelectedCoords] = useState(
    initialValue?.lat && initialValue?.lng
      ? [initialValue.lat, initialValue.lng]
      : null
  );

  const [mapDisplayName, setMapDisplayName] = useState(
    initialValue?.text || ""
  );

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDragHint, setShowDragHint] = useState(false);
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);

  const debounceRef = useRef(null);

  /* ================= REQUIRED FIELDS ================= */
  const requiredFields = useMemo(
    () => ["region", "district", "city", "street", "house"],
    []
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
        { headers: { "Accept-Language": "uk" } }
      );

      setSuggestions(await res.json());
    }, 400);
  };

  /* ================= FORM → MAP ================= */
  const handleFindOnMap = () => {
    const addr = buildAddressFromForm(formAddr);

    if (!addr) {
      addNotification(
        "Заповніть обовʼязкові поля адреси",
        "warning"
      );
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
        addNotification("Заповніть усі обовʼязкові поля адреси", "error");
        return;
      }
    }

    if (!clientContact.fullName.trim()) {
      addNotification("Вкажіть ПІБ клієнта", "error");
      return;
    }

    if (!isValidPhone(clientContact.phone)) {
      addNotification("Вкажіть коректний номер телефону", "error");
      return;
    }

    if (!selectedCoords) {
      addNotification("Оберіть точку на карті", "warning");
      return;
    }

    if (!isPreciseLocation) {
      addNotification(
        "Уточніть точку: перетягніть маркер або клацніть точніше",
        "warning"
      );
      return;
    }

    onSave({
      text: mapDisplayName || buildAddressFromForm(formAddr),
      lat: selectedCoords[0],
      lng: selectedCoords[1],

      ...formAddr,

      fullName: clientContact.fullName.trim(),
      phone: clientContact.phone.trim(),
      extraInfo: clientContact.extraInfo.trim(),
    });

    addNotification("Адресу та контакти збережено ✅", "success");
    onClose();
  };

  return (
    <div className="new-calc-modal-overlay" onClick={onClose}>
      <div className="new-calc-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="new-calc-modal-border-top">
          <div className="new-calc-modal-header">
            <h3>Адреса та контакти клієнта</h3>
            <span className="icon icon-cross new-calc-close-btn" onClick={onClose} />
          </div>
        </div>


        <div className="new-calc-modal-body">
            {/* ===== CLIENT CONTACT FORM ===== */}
          <div className="client-address-form">
            <h4 className="section-title-address">Контакти клієнта</h4>

            <div className="client-address-grid">
              <input
                placeholder="ПІБ клієнта *"
                value={clientContact.fullName}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, fullName: e.target.value }))
                }
              />
              <input
                placeholder="Номер телефону *"
                value={clientContact.phone}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, phone: e.target.value }))
                }
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
            <h4 className="section-title-address">Адреса</h4>

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

            <div className="client-address-actions">
              <button
                type="button"
                className="client-address-find-btn"
                onClick={handleFindOnMap}
              >
                <FaSearch /> Знайти на карті
              </button>
            </div>
          </div>

          

          {/* ===== SEARCH ===== */}
          <div className="search-box-address client-address-search-wrap">
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
                      setIsPreciseLocation(Number(s.place_rank) === 30);
                      setShowDragHint(Number(s.place_rank) !== 30);
                    }}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showDragHint && (
            <div className="warning">Перетягніть точку максимально точно</div>
          )}

          {/* ===== MAP ===== */}
          <div className="map-holder">
            <MapContainer center={DEFAULT_CENTER} zoom={6}>
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
            <FaTimes /> Відмінити
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
