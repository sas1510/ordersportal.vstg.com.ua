import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [48.3794, 31.1656];

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

export default function AddressMap({ value, onChange }) {
  const center =
    value.lat && value.lng ? [value.lat, value.lng] : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={value.lat ? 14 : 6}
      style={{ height: 300, borderRadius: 8 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler
        onSelect={(latlng) =>
          onChange(prev => ({
            ...prev,
            lat: latlng.lat,
            lng: latlng.lng
          }))
        }
      />

      {value.lat && value.lng && (
        <Marker position={[value.lat, value.lng]} />
      )}
    </MapContainer>
  );
}
