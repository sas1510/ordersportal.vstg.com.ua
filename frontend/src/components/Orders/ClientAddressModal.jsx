import { exactVisicomAddress } from "../../utils/visicomAddress";
import { Icon } from "leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { getVisicomSessionKey, setVisicomSessionKey, searchVisicom, reverseVisicom, visicomConfig } from "../../utils/visicomOrders";
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
const deliveryMarkerIcon = new Icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


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


function ClickHandler({ onPoint }) {
  useMapEvents({ click(event) { onPoint(event.latlng); } });
  return null;
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? 18);
  }, [center, zoom, map]);
  return null;
}


const buildAddressFromForm = (f) =>
  [f.region, f.district, f.city, f.street, f.house].filter(Boolean).join(", ");

const ENGLISH_ADDRESS_FIELDS = {
  region: "Region",
  district: "District",
  city: "City",
  street: "Street",
  house: "Building",
  apartment: "Apartment",
  entrance: "Entrance",
  floor: "Floor",
  note: "Note",
};
const isLatinAddress = (address) => {
  const value = [address.city, address.street, address.house].filter(Boolean).join(" ");
  return /[A-Za-z]/.test(value) && !/[\u0400-\u052F]/.test(value);
};


const ClientAddressModal = ({ initialValue, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const [tileKey, setTileKey] = useState(getVisicomSessionKey());
  const [keyInput, setKeyInput] = useState("");
  const [geocodeReady, setGeocodeReady] = useState(!!getVisicomSessionKey());
  const [mapError, setMapError] = useState("");
  const searchRequest = useRef(null);
  const reverseRequest = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    visicomConfig(controller.signal).then(config => {
      setTileKey(config.tile_key || getVisicomSessionKey());
      setGeocodeReady(config.geocode_configured || !!getVisicomSessionKey());
    }).catch(error => { if (!controller.signal.aborted) setMapError(error.response?.data?.error || "Не вдалося отримати налаштування Visicom."); });
    return () => { controller.abort(); clearTimeout(debounceRef.current); searchRequest.current?.abort(); reverseRequest.current?.abort(); };
  }, []);

  const { t, i18n } = useTranslation();
  const currentLang = (i18n.resolvedLanguage || i18n.language || "uk")
    .toLowerCase()
    .split("-")[0];


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


  const addressLanguage = useMemo(
    () => (isLatinAddress(formAddr) ? "en" : currentLang),
    [formAddr, currentLang],
  );

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
    () => ["region", "district", "city"],
    [],
  );


  const selectSuggestion = suggestion => {
    clearTimeout(debounceRef.current);
    searchRequest.current?.abort();
    reverseRequest.current?.abort();
    setMapError("");
    setFormAddr(previous => ({...previous, ...Object.fromEntries(Object.entries(suggestion.fields || {}).filter(([,value]) => value))}));
    setSelectedCoords([suggestion.lat, suggestion.lon]);
    setMapDisplayName(suggestion.display_name);
    setSearch(suggestion.display_name);
    setSuggestions([]);
    setIsPreciseLocation(true);
    setShowDragHint(false);
  };

  const triggerSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchRequest.current?.abort();
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    searchRequest.current?.abort();
    if (!geocodeReady) { setMapError("Підключіть ключ Visicom для пошуку адреси."); return; }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController(); searchRequest.current = controller;
      setMapError("");
      try {
        const results = await searchVisicom(query, addressLanguage, controller.signal);
        if (!controller.signal.aborted) {
          const exact = exactVisicomAddress(results, query);
          if (exact) selectSuggestion(exact);
          else setSuggestions(results);
          if (!results.length) setMapError("Адресу не знайдено. Спробуйте уточнити населений пункт або знайти без номера будинку.");
        }
      } catch(error) { if (!controller.signal.aborted) { setSuggestions([]); setMapError(error.response?.data?.error || "Не вдалося виконати пошук Visicom."); } }
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

  const handleMapPoint = async ({lat, lng}) => {
    searchRequest.current?.abort();
    setSuggestions([]);
    setMapError("");
    setSelectedCoords([lat, lng]);
    reverseRequest.current?.abort();
    const controller = new AbortController(); reverseRequest.current = controller;
    try {
      const result = await reverseVisicom(lat, lng, addressLanguage, controller.signal);
      if (!controller.signal.aborted) {
        onAddressUpdateFromMap(result?.display_name || buildAddressFromForm(formAddr));
        if (!result) setMapError("Адресу біля вибраної точки не знайдено. Перевірте заповнені поля адреси.");
      }
    } catch(error) { if (!controller.signal.aborted) setMapError(error.response?.data?.error || "Не вдалося визначити адресу Visicom."); }
  };


const handleSave = () => {
    // Валідація обов'язкових полів адреси
    for (const k of requiredFields) {
      if (!String(formAddr[k] ?? "").trim()) {
        addNotification(
          t("clientAddressModal.errors.requiredField", { field: t(`clientAddressModal.fields.${k}`) }), 
          "error"
        );
        return;
      }
    }

    if (!clientContact.fullName.trim()) {
      addNotification(t("clientAddressModal.errors.invalidName"), "error");
      return;
    }

    if (!isValidPhoneUA(clientContact.phone)) {
      addNotification(t("clientAddressModal.errors.invalidPhone"), "error");
      return;
    }

    onSave({
      text: mapDisplayName || buildAddressFromForm(formAddr),
      lat: selectedCoords?.[0] ?? null,
      lng: selectedCoords?.[1] ?? null,
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
                  placeholder={ENGLISH_ADDRESS_FIELDS[k] && addressLanguage === "en" ? ENGLISH_ADDRESS_FIELDS[k] : t("clientAddressModal.fields." + k)}
                  value={formAddr[k]}
                  onChange={(e) => setFormAddr((prev) => ({ ...prev, [k]: e.target.value }))}
                />
              ))}
            </div>
            <button type="button" className="client-address-find-btn" onClick={handleFindOnMap}>
              <FaSearch /> {t("clientAddressModal.findOnMap")}
            </button>
          </div>

  
          {(!tileKey || !geocodeReady) && <div className="client-address-visicom-key">
            <label>Ключ Visicom для локального тестування<input type="password" autoComplete="off" value={keyInput} onChange={event => setKeyInput(event.target.value)} /></label>
            <button type="button" disabled={!keyInput.trim()} onClick={() => { setVisicomSessionKey(keyInput); setTileKey(keyInput.trim()); setGeocodeReady(true); setKeyInput(""); setMapError(""); }}>Підключити Visicom</button>
          </div>}
          {mapError && <p role="alert" className="warning">{mapError}</p>}
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
                    onClick={() => selectSuggestion(s)}
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* ===== MAP ===== */}
          <div className="map-holder-modal">
            {tileKey && <MapContainer
              key={tileKey}
              center={DEFAULT_CENTER}
              zoom={6}
              style={{ height: "300px", borderRadius: "8px" }}
            >
              <TileLayer url={"https://tms{s}.visicom.ua/2.0.0/planet3/base/{z}/{x}/{y}.png?key=" + encodeURIComponent(tileKey)} subdomains="123" tms maxZoom={19} attribution={'Дані карт © АТ «<a href="https://api.visicom.ua/">Візіком</a>»'} eventHandlers={{tileerror: () => setMapError("Не вдалося завантажити карту Visicom. Перевірте доступ ключа до Tiles.")}} />
              <MapViewUpdater center={selectedCoords} />
              <ClickHandler onPoint={handleMapPoint} />
              {selectedCoords && (
                <Marker
                  position={selectedCoords}
                  icon={deliveryMarkerIcon}
                  draggable
                  eventHandlers={{ dragend: event => handleMapPoint(event.target.getLatLng()) }}
                />
              )}
            </MapContainer>}
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





