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
import { useNotification } from "../../hooks/useNotification";
import { useTranslation } from "react-i18next";

const DEFAULT_CENTER = [48.3794, 31.1656];


const isValidPhoneUA = (phone) => {
  return /^\+380\d{9}$/.test(phone);
};


const formatPhoneInput = (value) => {
  let digits = value.replace(/[^\d]/g, "");

  if (!digits) return "";

 
  if (digits.startsWith("0")) {
    digits = "38" + digits;
  } else if (digits.startsWith("9")) {
    digits = "380" + digits;
  } else if (digits.startsWith("80")) {
    digits = "3" + digits;
  }

 
  return ("+" + digits).slice(0, 13);
};


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


const buildAddressFromForm = (f) =>
  [f.region, f.district, f.city, f.street, f.house].filter(Boolean).join(", ");


const ClientAddressModal = ({ initialValue, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'ua' ? 'uk' : 'en';


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
        { headers: { "Accept-Language": currentLang } },
      );
      setSuggestions(await res.json());
    }, 400);
  };


const handleFindOnMap = () => {
    const addr = buildAddressFromForm(formAddr);
    if (!addr) {
      addNotification(t("clientAddressModal.errors.fillRequired"), "error");
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


const handleSave = () => {
    // Валідація обов'язкових полів адреси
    for (const k of requiredFields) {
      if (!String(formAddr[k]).trim()) {
        addNotification(
          t("clientAddressModal.errors.requiredField", { field: t(`clientAddressModal.fields.${k}`) }), 
          "error"
        );
        return;
      }
    }

    if (!clientContact.fullName.trim() || clientContact.fullName.trim().split(" ").length < 2) {
      addNotification(t("clientAddressModal.errors.invalidName"), "error");
      return;
    }

    if (!isValidPhoneUA(clientContact.phone)) {
      addNotification(t("clientAddressModal.errors.invalidPhone"), "error");
      return;
    }

    if (!selectedCoords) {
      addNotification(t("clientAddressModal.errors.selectOnMap"), "error");
      return;
    }

    if (!isPreciseLocation) {
      addNotification(t("clientAddressModal.errors.preciseLocation"), "error");
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

    addNotification(t("clientAddressModal.success"), "success");
    onClose();
  };

  return (
    <div className="new-calc-modal-overlay" onClick={onClose}>
      <div
        className="new-calc-modal-window"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="new-calc-modal-border-top">
          <div className="new-calc-modal-header">
            <h3>{t("clientAddressModal.title")}</h3>
            <span
              className="icon icon-cross new-calc-close-btn"
              onClick={onClose}
            />
          </div>
        </div>

        <div className="new-calc-modal-body">
  
          <div className="client-address-form">
            <h4 className="section-title">{t("clientAddressModal.contactSection")}</h4>
            <div className="client-address-grid">
              <input
                placeholder={t("clientAddressModal.fields.fullName")}
                value={clientContact.fullName}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, fullName: e.target.value }))
                }
              />

              <input
                placeholder={t("clientAddressModal.fields.phone")}
                value={clientContact.phone}
                maxLength={13}
                onChange={(e) => {
                  const val = e.target.value;
     
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
                placeholder={t("clientAddressModal.fields.extraInfo")}
                value={clientContact.extraInfo}
                onChange={(e) =>
                  setClientContact((p) => ({ ...p, extraInfo: e.target.value }))
                }
              />
            </div>
          </div>


          <div className="client-address-form">
            <h4 className="section-title">{t("clientAddressModal.addressSection")}</h4>
            <div className="client-address-grid">
              {Object.keys(formAddr).map((k) => (
                <input
                  key={k}
                  placeholder={t(`clientAddressModal.fields.${k}`)}
                  value={formAddr[k]}
                  onChange={(e) => setFormAddr((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              ))}
            </div>
            <button type="button" className="client-address-find-btn" onClick={handleFindOnMap}>
              <FaSearch /> {t("clientAddressModal.findOnMap")}
            </button>
          </div>

  
          <div className="search-container">
            <input
              className="search-input client-address-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                triggerSearch(e.target.value);
              }}
              placeholder={t("clientAddressModal.searchPlaceholder")}
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

          {showDragHint && <div className="warning">{t("clientAddressModal.dragHint")}</div>}

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
            <FaTimes /> {t("clientAddressModal.cancel")}
          </button>
          <button className="new-calc-btn-save" onClick={handleSave}>
            <FaSave /> {t("clientAddressModal.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientAddressModal;
