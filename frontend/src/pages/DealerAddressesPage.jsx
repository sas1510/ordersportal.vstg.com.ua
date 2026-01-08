import { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../api/axios";
import { useDealerContext } from "../hooks/useDealerContext";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "../utils/leafletFix";
import "./DealerAddressesPage.css";

const DEFAULT_CENTER = [48.3794, 31.1656];

/* ================= MAP HELPERS ================= */
function ClickHandler({ enabled, onSelect, onAddressFound }) {
  useMapEvents({
    async click(e) {
      if (!enabled) return;
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

/* ================= PAGE ================= */
export default function DealerAddressesPage() {
  const dealerCtx = useDealerContext?.();
  const contractorGuid =
    dealerCtx?.dealerGuid || localStorage.getItem("user_id_1C");

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapDisplayName, setMapDisplayName] = useState("");

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

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDragHint, setShowDragHint] = useState(false);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef(null);

  /* ================= HELPERS ================= */
  const parseCoords = useCallback((coords) => {
    if (!coords) return null;
    const p = coords.split(",").map(Number);
    if (p.length !== 2 || p.some(isNaN)) return null;
    return Math.abs(p[0]) > 90 ? [p[1], p[0]] : p;
  }, []);

  const buildAddressFromForm = (form) => {
    return [
      form.region,
      form.district,
      form.city,
      form.street,
      form.house && `буд. ${form.house}`,
      form.apartment && `кв. ${form.apartment}`,
    ]
      .filter(Boolean)
      .join(", ");
  };

  /* ================= LOAD ADDRESSES ================= */
  useEffect(() => {
    if (!contractorGuid) return;
    axiosInstance
      .get("/get_dealer_addresses_change/", {
        params: { contractor: contractorGuid },
      })
      .then((res) => setAddresses(res.data.addresses || []));
  }, [contractorGuid]);

  /* ================= FORM → SEARCH ================= */
  useEffect(() => {
    const { city, street, house } = formAddr;
    const combined = [city, street, house].filter(Boolean).join(" ").trim();

    if (combined) {
      setSearch(combined);
      triggerSearch(combined);
    }
  }, [formAddr.city, formAddr.street, formAddr.house]);

  /* ================= ADD NEW ================= */
  const onAddNewAddress = () => {
    setIsNewAddress(true);
    setSelectedAddress(null);
    setSelectedCoords(null);
    setMapDisplayName("");
    setSearch("");
    setSuggestions([]);
    setShowDragHint(false);

    setFormAddr({
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
  };

  /* ================= SELECT EXISTING ================= */
  const onSelectAddress = async (addr) => {
    setIsNewAddress(false);
    setSelectedAddress(addr);
    setShowDragHint(false);

    setFormAddr({
      region: addr.Region || "",
      district: addr.District || "",
      city: addr.City || "",
      street: addr.Street || "",
      house: addr.HouseNumber || "",
      apartment: addr.FlatNumber || "",
      entrance: "",
      floor: "",
      note: addr.Comment || "",
    });

    const coords = parseCoords(addr.Coordinates);
    setSelectedCoords(coords);
    setSuggestions([]);

    if (coords) {
      const name = await reverseGeocode(coords[0], coords[1]);
      setMapDisplayName(name);
    } else {
      setMapDisplayName("");
    }
  };

  /* ================= SEARCH ================= */
  const triggerSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (query.length < 3) return setSuggestions([]);

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

  const onAddressUpdateFromMap = (address) => {
    setMapDisplayName(address);
    setSearch(address);
    setShowDragHint(false);
  };

  const handleMarkerDrag = async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setSelectedCoords([lat, lng]);
    const address = await reverseGeocode(lat, lng);
    onAddressUpdateFromMap(address);
  };

  /* ================= SAVE ================= */
  const saveCoords = async () => {
    if (!selectedCoords) return;

    setSaving(true);
    try {
      if (!isNewAddress && selectedAddress) {
        await axiosInstance.post("/save_dealer_address_coords/", {
          contractorGuid,
          addressKindGUID: selectedAddress.AddressKindGUID,
          latitude: selectedCoords[0],
          longitude: selectedCoords[1],
        });
      }
      alert("✅ Дані збережено");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container-address">
      <div className="layout">
        {/* ===== LEFT ===== */}
        <div className="address-list">
          <h3>Адреси: </h3>

          <button
            className="btn-save"
            style={{ width: "100%", marginBottom: "10px", marginTop : "10px" }}
            onClick={onAddNewAddress}
          >
            ➕ Додати нову адресу
          </button>

          {addresses.map((a) => (
            <div
              key={a.AddressKindGUID}
              className={`address-item ${
                selectedAddress?.AddressKindGUID === a.AddressKindGUID
                  ? "active"
                  : ""
              }`}
              onClick={() => onSelectAddress(a)}
            >
              <div className="title">{a.AddressValue}</div>
              {!parseCoords(a.Coordinates) && (
                <div className="warning">📍 Потрібна точка</div>
              )}
            </div>
          ))}
        </div>

        {/* ===== RIGHT ===== */}
        <div className="map-column">
          {(selectedAddress || isNewAddress) && (
            <>
              <div className="address-optimizer-form">
                <div className="form-grid">
                  <input placeholder="Область" value={formAddr.region}
                    onChange={(e) => setFormAddr({ ...formAddr, region: e.target.value })} />
                  <input placeholder="Район" value={formAddr.district}
                    onChange={(e) => setFormAddr({ ...formAddr, district: e.target.value })} />
                  <input placeholder="Місто" value={formAddr.city}
                    onChange={(e) => setFormAddr({ ...formAddr, city: e.target.value })} />
                  <input placeholder="Вулиця" value={formAddr.street}
                    onChange={(e) => setFormAddr({ ...formAddr, street: e.target.value })} />
                  <input placeholder="Будинок" value={formAddr.house}
                    onChange={(e) => setFormAddr({ ...formAddr, house: e.target.value })} />
                  <input placeholder="Квартира" value={formAddr.apartment}
                    onChange={(e) => setFormAddr({ ...formAddr, apartment: e.target.value })} />
                  <input placeholder="Підʼїзд" value={formAddr.entrance}
                    onChange={(e) => setFormAddr({ ...formAddr, entrance: e.target.value })} />
                  <input placeholder="Поверх" value={formAddr.floor}
                    onChange={(e) => setFormAddr({ ...formAddr, floor: e.target.value })} />
                  <input placeholder="Примітка" value={formAddr.note}
                    onChange={(e) => setFormAddr({ ...formAddr, note: e.target.value })} />
                </div>
              </div>

              <div className="search-box">
                <input
                  className="search-input"
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
                          setShowDragHint(true);
                        }}
                      >
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showDragHint && (
                <div className="warning" style={{ marginBottom: "6px" }}>
                  👉 Перетягніть точку максимально точно для вашого розташування
                </div>
              )}

              <div className="map-holder">
                <MapContainer center={DEFAULT_CENTER} zoom={6}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapViewUpdater center={selectedCoords} />
                  <ClickHandler
                    enabled
                    onSelect={setSelectedCoords}
                    onAddressFound={onAddressUpdateFromMap}
                  />
                  {selectedCoords && (
                    <Marker
                      position={selectedCoords}
                      draggable={true}
                      eventHandlers={{ dragend: handleMarkerDrag }}
                    />
                  )}
                </MapContainer>
              </div>

              <div className="map-footer">
                <div className="compare-box">
                  <div>
                    <strong>1С:</strong>{" "}
                    {selectedAddress
                      ? selectedAddress.AddressValue
                      : buildAddressFromForm(formAddr) || "Нова адреса"}
                  </div>
                  <div>
                    <strong>Карта:</strong>{" "}
                    <span className="blue-highlight">
                      {mapDisplayName || "Виберіть точку"}
                    </span>
                  </div>
                </div>

                <div className="footer-btns">
                  <div className="coord-info">
                    {selectedCoords &&
                      `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`}
                  </div>

                  <button
                    className="btn-save"
                    onClick={saveCoords}
                    disabled={saving}
                  >
                    {saving ? "Збереження..." : "Зберегти"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
