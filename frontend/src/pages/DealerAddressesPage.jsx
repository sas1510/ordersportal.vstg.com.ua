// import { useEffect, useState, useCallback, useRef } from "react";
// import axiosInstance from "../api/axios";
// import { useDealerContext } from "../hooks/useDealerContext";
// import { FaPlus, FaSearch } from "react-icons/fa";
// import { useNotification } from "../components/notification/Notifications";

// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   useMapEvents,
//   useMap,
// } from "react-leaflet";

// import "leaflet/dist/leaflet.css";
// import "../utils/leafletFix";
// import "./DealerAddressesPage.css";

// const DEFAULT_CENTER = [48.3794, 31.1656];

// /* ================= MAP HELPERS ================= */
// function ClickHandler({ enabled, onSelect, onAddressFound }) {
//   useMapEvents({
//     async click(e) {
//       if (!enabled) return;
//       const coords = [e.latlng.lat, e.latlng.lng];
//       onSelect(coords);

//       const address = await reverseGeocode(coords[0], coords[1]);
//       onAddressFound(address);
//     },
//   });
//   return null;
// }

// function MapViewUpdater({ center, zoom }) {
//   const map = useMap();
//   useEffect(() => {
//     if (center) map.setView(center, zoom ?? 18);
//   }, [center, zoom, map]);
//   return null;
// }

// /* ================= REVERSE GEOCODE ================= */
// const reverseGeocode = async (lat, lon) => {
//   try {
//     const res = await fetch(
//       `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
//       { headers: { "Accept-Language": "uk" } }
//     );
//     const data = await res.json();
//     return data?.display_name || "";
//   } catch {
//     return "";
//   }
// };

// /* ================= PAGE ================= */
// export default function DealerAddressesPage() {
//   const dealerCtx = useDealerContext?.();
//   const contractorGuid =
//     dealerCtx?.dealerGuid || localStorage.getItem("user_id_1C");

//   const [addresses, setAddresses] = useState([]);
//   const [selectedAddress, setSelectedAddress] = useState(null);
//   const [isNewAddress, setIsNewAddress] = useState(false);

//   const [selectedCoords, setSelectedCoords] = useState(null);
//   const [mapDisplayName, setMapDisplayName] = useState("");
//   const { addNotification } = useNotification();
//   const [formAddr, setFormAddr] = useState({
//     region: "",
//     district: "",
//     city: "",
//     street: "",
//     house: "",
//     apartment: "",
//     entrance: "",
//     floor: "",
//     note: "",
//   });

//   const [search, setSearch] = useState("");
//   const [suggestions, setSuggestions] = useState([]);
//   const [showDragHint, setShowDragHint] = useState(false);

//   // 🆕 ЧИ ТОЧНА АДРЕСА
//   const [isPreciseLocation, setIsPreciseLocation] = useState(false);

//   const [saving, setSaving] = useState(false);

//   const debounceRef = useRef(null);

//   /* ================= HELPERS ================= */
//   const parseCoords = useCallback((coords) => {
//     if (!coords) return null;
//     const p = coords.split(",").map(Number);
//     if (p.length !== 2 || p.some(isNaN)) return null;
//     return Math.abs(p[0]) > 90 ? [p[1], p[0]] : p;
//   }, []);

//   const buildAddressFromForm = (form) => {
//     return [
//       form.region,
//       form.district,
//       form.city,
//       form.street,
//       form.house && `${form.house}`,
//       // form.apartment && ` ${form.apartment}`,
//     ]
//       .filter(Boolean)
//       .join(", ");
//   };

//   const handleFindOnMap = () => {
//     const addressFromForm = buildAddressFromForm(formAddr);

//     if (!addressFromForm) {
//       addNotification("Введіть адресу для пошуку", "warning");
//       return;
//     }

//     setSearch(addressFromForm);
//     triggerSearch(addressFromForm);
//     setSuggestions([]);
//     setShowDragHint(true);
//     setIsPreciseLocation(false);
//   };


//   /* ================= LOAD ADDRESSES ================= */
//   useEffect(() => {
//     if (!contractorGuid) return;
//     axiosInstance
//       .get("/get_dealer_addresses_change/", {
//         params: { contractor: contractorGuid },
//       })
//       .then((res) => setAddresses(res.data.addresses || []));
//   }, [contractorGuid]);

  

//   /* ================= FORM → SEARCH ================= */
//   // useEffect(() => {
//   //   const { city, street, house } = formAddr;
//   //   const combined = [city, street, house].filter(Boolean).join(" ").trim();

//   //   if (combined) {
//   //     setSearch(combined);
//   //     triggerSearch(combined);
//   //   }
//   // }, [formAddr.city, formAddr.street, formAddr.house]);

//   /* ================= ADD NEW ================= */
//   const onAddNewAddress = () => {
//     setIsNewAddress(true);
//     setSelectedAddress(null);
//     setSelectedCoords(null);
//     setMapDisplayName("");
//     setSearch("");
//     setSuggestions([]);
//     setShowDragHint(false);
//     setIsPreciseLocation(false);

//     setFormAddr({
//       region: "",
//       district: "",
//       city: "",
//       street: "",
//       house: "",
//       apartment: "",
//       entrance: "",
//       floor: "",
//       note: "",
//     });
//   };

//   /* ================= SELECT EXISTING ================= */
//   const onSelectAddress = async (addr) => {
//     setIsNewAddress(false);
//     setSelectedAddress(addr);
//     setShowDragHint(false);

//     setFormAddr({
//       region: addr.Region || "",
//       district: addr.District || "",
//       city: addr.City || "",
//       street: addr.Street || "",
//       house: addr.HouseNumber || "",
//       apartment: addr.FlatNumber || "",
//       entrance: "",
//       floor: "",
//       note: addr.Comment || "",
//     });

//     const coords = parseCoords(addr.Coordinates);
//     setSelectedCoords(coords);
//     setSuggestions([]);

//     if (coords) {
//       const name = await reverseGeocode(coords[0], coords[1]);
//       setMapDisplayName(name);
//       setIsPreciseLocation(true);
//     } else {
//       setMapDisplayName("");
//       setIsPreciseLocation(false);
//       setShowDragHint(true);
//     }
//   };

//   /* ================= SEARCH ================= */
//   const triggerSearch = (query) => {
//     if (debounceRef.current) clearTimeout(debounceRef.current);

//     debounceRef.current = setTimeout(async () => {
//       if (query.length < 3) return setSuggestions([]);

//       const params = new URLSearchParams({
//         q: query,
//         format: "json",
//         limit: 5,
//         countrycodes: "ua",
//       });

//       const res = await fetch(
//         `https://nominatim.openstreetmap.org/search?${params}`,
//         { headers: { "Accept-Language": "uk" } }
//       );

//       setSuggestions(await res.json());
//     }, 400);
//   };

//   const onAddressUpdateFromMap = (address) => {
//     setMapDisplayName(address);
//     setSearch(address);
//     setShowDragHint(false);
//     setIsPreciseLocation(true); // ✅ drag або click = точна
//   };

//   const handleMarkerDrag = async (e) => {
//     const { lat, lng } = e.target.getLatLng();
//     setSelectedCoords([lat, lng]);
//     const address = await reverseGeocode(lat, lng);
//     onAddressUpdateFromMap(address);
//   };

//   /* ================= SAVE ================= */
//   const saveCoords = async () => {
//     if (!selectedCoords || !isPreciseLocation) return;

//     setSaving(true);
//     try {
//       if (!isNewAddress && selectedAddress) {
//         await axiosInstance.post("/save_dealer_address_coords/", {
//           contractorGuid,
//           addressKindGUID: selectedAddress.AddressKindGUID,
//           latitude: selectedCoords[0],
//           longitude: selectedCoords[1],
//         });
//       }
//       addNotification("✅ Дані збережено", "success");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="page-container-address">
//       <div className="layout">
//         {/* ===== LEFT ===== */}
//         <div className="address-list">
//           <h3>Адреси: </h3>

//           <button
//             className="btn-save-address"
//             style={{ width: "100%", marginBottom: "10px", marginTop: "10px" }}
//             onClick={onAddNewAddress}
//           >
//             <FaPlus />
//            Додати нову адресу
//           </button>

//           {addresses.map((a) => (
//             <div
//               key={a.AddressKindGUID}
//               className={`address-item ${
//                 selectedAddress?.AddressKindGUID === a.AddressKindGUID
//                   ? "active"
//                   : ""
//               }`}
//               onClick={() => onSelectAddress(a)}
//             >
//               <div className="title">{a.AddressValue}</div>
//               {!parseCoords(a.Coordinates) && (
//                 <div className="warning">📍 Потрібна точка</div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* ===== RIGHT ===== */}
//         <div className="map-column">
//           {(selectedAddress || isNewAddress) && (
//             <>
//               <div className="address-optimizer-form">
//                 <div className="form-grid">
//                   <input placeholder="Область" value={formAddr.region}
//                     onChange={(e) => setFormAddr({ ...formAddr, region: e.target.value })} />
//                   <input placeholder="Район" value={formAddr.district}
//                     onChange={(e) => setFormAddr({ ...formAddr, district: e.target.value })} />
//                   <input placeholder="Місто" value={formAddr.city}
//                     onChange={(e) => setFormAddr({ ...formAddr, city: e.target.value })} />
//                   <input placeholder="Вулиця" value={formAddr.street}
//                     onChange={(e) => setFormAddr({ ...formAddr, street: e.target.value })} />
//                   <input placeholder="Будинок" value={formAddr.house}
//                     onChange={(e) => setFormAddr({ ...formAddr, house: e.target.value })} />
//                   <input placeholder="Квартира" value={formAddr.apartment}
//                     onChange={(e) => setFormAddr({ ...formAddr, apartment: e.target.value })} />
//                   <input placeholder="Підʼїзд" value={formAddr.entrance}
//                     onChange={(e) => setFormAddr({ ...formAddr, entrance: e.target.value })} />
//                   <input placeholder="Поверх" value={formAddr.floor}
//                     onChange={(e) => setFormAddr({ ...formAddr, floor: e.target.value })} />
//                   <input placeholder="Примітка" value={formAddr.note}
//                     onChange={(e) => setFormAddr({ ...formAddr, note: e.target.value })} />
//                 </div>
//                 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
//                   <button
//                     className="btn-save-address"
//                     type="button"
//                     onClick={handleFindOnMap}
//                   >
//                     <FaSearch /> Знайти на карті
//                   </button>
//                 </div>

//               </div>

//               <div className="search-box-address">
//                 <input
//                   className="search-input"
//                   value={search}
//                   onChange={(e) => {
//                     setSearch(e.target.value);
//                     triggerSearch(e.target.value);
//                   }}
//                   placeholder="Пошук адреси на карті..."
//                 />

//                 {suggestions.length > 0 && (
//                   <div className="suggestions-dropdown">
//                     {suggestions.map((s) => {
//                       const precise = Number(s.place_rank) === 30;

//                       return (
//                         <div
//                           key={s.place_id}
//                           className="suggestion-item"
//                           onClick={() => {
//                             setSelectedCoords([+s.lat, +s.lon]);
//                             setMapDisplayName(s.display_name);
//                             setSearch(s.display_name);
//                             setSuggestions([]);
//                             setIsPreciseLocation(precise);
//                             setShowDragHint(!precise);
//                           }}
//                         >
//                           {s.display_name}
//                           {/* {!precise && (
//                             <span className="warning-inline">
//                               неточна
//                             </span>
//                           )} */}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>

//               {showDragHint && (
//                 <div className="warning" style={{ marginBottom: "6px" }}>
//                   Перетягніть точку максимально точно для вашого розташування
//                 </div>
//               )}

//               <div className="map-holder">
//                 <MapContainer center={DEFAULT_CENTER} zoom={6}>
//                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                   <MapViewUpdater center={selectedCoords} />
//                   <ClickHandler
//                     enabled
//                     onSelect={setSelectedCoords}
//                     onAddressFound={onAddressUpdateFromMap}
//                   />
//                   {selectedCoords && (
//                     <Marker
//                       position={selectedCoords}
//                       draggable={true}
//                       eventHandlers={{ dragend: handleMarkerDrag }}
//                     />
//                   )}
//                 </MapContainer>
//               </div>

//               <div className="map-footer">
//                 <div className="compare-box">
//                   <div>
//                     <strong>1С:</strong>{" "}
//                     {selectedAddress
//                       ? selectedAddress.AddressValue
//                       : buildAddressFromForm(formAddr) || "Нова адреса"}
//                   </div>
//                   <div>
//                     <strong>Карта:</strong>{" "}
//                     <span className="blue-highlight">
//                       {mapDisplayName || "Виберіть точку"}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="footer-btns">
//                   <div className="coord-info">

//                     {selectedCoords &&
//                       `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`}
//                   </div>

//                   <button
//                     className="btn-save"
//                     onClick={saveCoords}
//                     disabled={saving || !isPreciseLocation}
//                   >
//                     {!isPreciseLocation
//                       ? "Перевірте правильність точки"
//                       : saving
//                       ? "Збереження..."
//                       : "Зберегти"}
//                   </button>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../api/axios";
import { useDealerContext } from "../hooks/useDealerContext";
import { FaPlus, FaSearch } from "react-icons/fa";
import { useNotification } from "../components/notification/Notifications";
import ConfirmAddressModal from "./ConfirmAddressModal";

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

/* ================= LOCATION LINK PARSER ================= */
function extractCoordsFromText(text) {
  if (!text) return null;

  const patterns = [
    /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,   // Apple Maps, Telegram
    /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,    // Google Maps
    /ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,       // t.me/maps
    /(-?\d+\.\d+),\s*(-?\d+\.\d+)/           // fallback (чисті координати)
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return [+m[1], +m[2]];
  }
  return null;
}



/* ================= PAGE ================= */
export default function DealerAddressesPage() {
  const dealerCtx = useDealerContext?.();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const contractorGuid = dealerCtx?.dealerGuid || localStorage.getItem("user_id_1C");

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [locationLink, setLocationLink] = useState("");


  const [selectedCoords, setSelectedCoords] = useState(null);
  const [mapDisplayName, setMapDisplayName] = useState("");
  const { addNotification } = useNotification();
  const [formAddr, setFormAddr] = useState({
    region: "", district: "", city: "", street: "", house: "",
    apartment: "", entrance: "", floor: "", note: "",
  });

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDragHint, setShowDragHint] = useState(false);
  const [isPreciseLocation, setIsPreciseLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noResults, setNoResults] = useState(false); // 🆕 Стан для порожнього пошуку

  const debounceRef = useRef(null);

  
const notifiedRef = useRef(false);

useEffect(() => {
  if (noResults && search.length >= 3 && !notifiedRef.current) {
    addNotification(
      "Адресу не знайдено. Спробуйте уточнити запит або поставте точку вручну.",
      "warning"
    );
    notifiedRef.current = true; // 🔒 блокуємо повтори
  }

  // якщо користувач змінив запит — дозволяємо нове повідомлення
  if (!noResults) {
    notifiedRef.current = false;
  }
}, [noResults, search, addNotification]);

  /* ================= HELPERS ================= */
  const parseCoords = useCallback((coords) => {
    if (!coords) return null;
    const p = coords.split(",").map(Number);
    if (p.length !== 2 || p.some(isNaN)) return null;
    return Math.abs(p[0]) > 90 ? [p[1], p[0]] : p;
  }, []);

  const buildAddressFromForm = (form) => {
    return [
      form.region, form.district, form.city, form.street, form.house && `${form.house}`,
    ].filter(Boolean).join(", ");
  };

  /* ================= LOAD ADDRESSES ================= */
  const loadAddresses = useCallback(() => {
    if (!contractorGuid) return;
    axiosInstance
      .get("/get_dealer_addresses_change/", { params: { contractor: contractorGuid } })
      .then((res) => setAddresses(res.data.addresses || []));
  }, [contractorGuid]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  /* ================= SEARCH LOGIC ================= */
  const triggerSearch = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Якщо поле очистили — прибираємо підказки
    if (!query.trim() || query.length < 3) {
        setSuggestions([]);
        setNoResults(false);
        return;
    }

    debounceRef.current = setTimeout(async () => {
      const params = new URLSearchParams({
        q: query, format: "json", limit: 5, countrycodes: "ua",
      });

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { "Accept-Language": "uk" } }
        );
        const data = await res.json();
        
        setSuggestions(data);
        setNoResults(data.length === 0); // 🆕 Якщо масив порожній — активуємо повідомлення
      } catch (err) {
        setNoResults(true);
      }
    }, 400);
  };

  const handleFindOnMap = () => {
    const addressFromForm = buildAddressFromForm(formAddr);
    if (!addressFromForm) {
      addNotification("Введіть адресу для пошуку", "warning");
      return;
    }
    setSearch(addressFromForm);
    triggerSearch(addressFromForm);
    setSuggestions([]);
    setShowDragHint(true);
    setIsPreciseLocation(false);
  };

  const handlePasteLocation = async () => {
  const coords = extractCoordsFromText(locationLink);

  if (!coords) {
    addNotification(
      "Не вдалося знайти координати в посиланні. Вставте локацію з Telegram / Viber / Apple / Google Maps.",
      "warning"
    );
    return;
  }

  setSelectedCoords(coords);
  setIsPreciseLocation(true);
  setShowDragHint(false);

  const address = await reverseGeocode(coords[0], coords[1]);
  setMapDisplayName(address || "Локація з повідомлення");
  setSearch(address || "");

  addNotification("📍 Локацію успішно визначено", "success");
};


  /* ================= SAVE LOGIC ================= */
  const handleRequestSave = () => {
    if (!formAddr.house || formAddr.house.trim() === "") {
      addNotification("Помилка: номер будинку обов'язковий!", "error");
      return;
    }
    if (!selectedCoords || !isPreciseLocation) {
      addNotification("Будь ласка, вкажіть точну точку на карті", "warning");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const saveCoords = async () => {
  setIsConfirmModalOpen(false);
  setSaving(true);
  try {
    if (!selectedCoords || !isPreciseLocation) {
      addNotification("Будь ласка, вкажіть точну точку на карті", "warning");
      return;
    }

    // POST для збереження координат
    await axiosInstance.post("/save_dealer_address_coords/", {
      contractorGuid,
      addressKindGUID: selectedAddress?.AddressKindGUID || null,
      latitude: selectedCoords[0],
      longitude: selectedCoords[1],
      house: formAddr.house,
      street: formAddr.street,
      city: formAddr.city,
      region: formAddr.region,
      district: formAddr.district,
      apartment: formAddr.apartment,
      entrance: formAddr.entrance,
      floor: formAddr.floor,
      note: formAddr.note,
    });

    addNotification("✅ Дані успішно оновлено", "success");

    // 🔄 Тепер оновлюємо список адрес із 1С
    await loadAddresses();

    // Опційно: виділяємо останню збережену адресу
    if (selectedCoords) {
      const lastSaved = addresses.find(a => {
        const coords = parseCoords(a.Coordinates);
        return coords && coords[0] === selectedCoords[0] && coords[1] === selectedCoords[1];
      });
      if (lastSaved) setSelectedAddress(lastSaved);
      setIsNewAddress(false);
    }

  } catch (err) {
    console.error(err);
    addNotification("❌ Помилка збереження", "error");
  } finally {
    setSaving(false);
  }
};


  const onAddNewAddress = () => {
    setIsNewAddress(true);
    setSelectedAddress(null);
    setSelectedCoords(null);
    setMapDisplayName("");
    setSearch("");
    setSuggestions([]);
    setNoResults(false);
    setShowDragHint(false);
    setIsPreciseLocation(false);
    setFormAddr({
      region: "", district: "", city: "", street: "", house: "",
      apartment: "", entrance: "", floor: "", note: "",
    });
  };

  const onSelectAddress = async (addr) => {
    setIsNewAddress(false);
    setNoResults(false);
    setSelectedAddress(addr);
    setShowDragHint(false);
    setFormAddr({
      region: addr.Region || "", district: addr.District || "", city: addr.City || "",
      street: addr.Street || "", house: addr.HouseNumber || "", apartment: addr.FlatNumber || "",
      entrance: "", floor: "", note: addr.Comment || "",
    });

    const coords = parseCoords(addr.Coordinates);
    setSelectedCoords(coords);
    if (coords) {
      const name = await reverseGeocode(coords[0], coords[1]);
      setMapDisplayName(name);
      setIsPreciseLocation(true);
    } else {
      setMapDisplayName("");
      setIsPreciseLocation(false);
      setShowDragHint(true);
    }
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

  return (
    <div className="page-container-address">
      <div className="layout">
        <div className="address-list">
          <h3>Адреси: </h3>
          <button className="btn-save-address" onClick={onAddNewAddress} style={{ width: "100%", marginBottom: "10px" }}>
            <FaPlus /> Додати нову адресу
          </button>

          {addresses.map((a) => (
            <div key={a.AddressKindGUID} className={`address-item ${selectedAddress?.AddressKindGUID === a.AddressKindGUID ? "active" : ""}`} onClick={() => onSelectAddress(a)}>
              <div className="title">{a.AddressValue}</div>
              {!parseCoords(a.Coordinates) && <div className="warning">📍 Потрібна точка</div>}
            </div>
          ))}
        </div>

        <div className="map-column">
          {(selectedAddress || isNewAddress) && (
            <>
              <div className="address-optimizer-form">
                <div className="form-grid">
                  <input placeholder="Область" value={formAddr.region} onChange={(e) => setFormAddr({ ...formAddr, region: e.target.value })} />
                  <input placeholder="Район" value={formAddr.district} onChange={(e) => setFormAddr({ ...formAddr, district: e.target.value })} />
                  <input placeholder="Місто" value={formAddr.city} onChange={(e) => setFormAddr({ ...formAddr, city: e.target.value })} />
                  <input placeholder="Вулиця" value={formAddr.street} onChange={(e) => setFormAddr({ ...formAddr, street: e.target.value })} />
                  <input placeholder="Будинок *" style={{ borderColor: !formAddr.house ? "#ffa500" : "" }} value={formAddr.house} onChange={(e) => setFormAddr({ ...formAddr, house: e.target.value })} />
                  <input placeholder="Квартира" value={formAddr.apartment} onChange={(e) => setFormAddr({ ...formAddr, apartment: e.target.value })} />
                  <input placeholder="Підʼїзд" value={formAddr.entrance} onChange={(e) => setFormAddr({ ...formAddr, entrance: e.target.value })} />
                  <input placeholder="Поверх" value={formAddr.floor} onChange={(e) => setFormAddr({ ...formAddr, floor: e.target.value })} />
                  <input placeholder="Примітка" value={formAddr.note} onChange={(e) => setFormAddr({ ...formAddr, note: e.target.value })} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                  <button className="btn-save-address" type="button" onClick={handleFindOnMap}>
                    <FaSearch /> Знайти на карті
                  </button>
                </div>
              </div>
              <div className="location-paste-box">
              {/* <input
                className="search-input"
                placeholder="Вставте локацію (Telegram / Viber / Apple / Google Maps)"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
              />
              <button
                className="btn-save-address"
                type="button"
                onClick={handlePasteLocation}
                style={{ marginTop: "6px", width: "100%" }}
              >
                📍 Використати локацію
              </button> */}
            </div>


              <div className="search-box-address">
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
                          setNoResults(false);
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
                <div className="warning" style={{ marginBottom: "6px" }}>
                  Перетягніть точку максимально точно для вашого розташування
                </div>
              )}

              <div className="map-holder">
                <MapContainer center={DEFAULT_CENTER} zoom={6}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapViewUpdater center={selectedCoords} />
                  <ClickHandler enabled onSelect={setSelectedCoords} onAddressFound={onAddressUpdateFromMap} />
                  {selectedCoords && <Marker position={selectedCoords} draggable={true} eventHandlers={{ dragend: handleMarkerDrag }} />}
                </MapContainer>
              </div>

              <div className="map-footer">
                <div className="compare-box">
                  <div><strong>1С:</strong> {selectedAddress ? selectedAddress.AddressValue : buildAddressFromForm(formAddr) || "Нова адреса"}</div>
                  <div><strong>Карта:</strong> <span className="blue-highlight">{mapDisplayName || "Виберіть точку"}</span></div>
                </div>

                <div className="footer-btns">
                  <div className="coord-info">{selectedCoords && `${selectedCoords[0].toFixed(6)}, ${selectedCoords[1].toFixed(6)}`}</div>
                  <button className="btn-save" onClick={handleRequestSave} disabled={saving || (!isPreciseLocation && !selectedCoords)}>
                    {saving ? "Збереження..." : "Зберегти"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmAddressModal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        onConfirm={saveCoords} 
        addressName={mapDisplayName} 
        coordinates={selectedCoords} 
      />
    </div>
  );
}