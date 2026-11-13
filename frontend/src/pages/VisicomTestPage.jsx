import { getVisicomSessionKey, setVisicomSessionKey } from "../utils/visicomOrders";
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../api/axios';
import { useDealerContext } from '../hooks/useDealerContext';
import './VisicomTestPage.css';

function MapPoint({ point, onPoint }) {
  const map = useMap();
  useEffect(() => { if (point) map.setView([point.lat, point.lng], 18); }, [point, map]);
  useMapEvents({ click(event) { onPoint(event.latlng); } });
  return point ? <CircleMarker center={[point.lat, point.lng]} radius={8} pathOptions={{ color: '#1976d2', fillOpacity: 0.7 }} /> : null;
}
export default function VisicomTestPage() {
  const { role, isLoading } = useDealerContext();
  const [keyInput, setKeyInput] = useState('');
  const [key, setKey] = useState(getVisicomSessionKey());
  const [text, setText] = useState('Чернівецька область, Банилів, Гостинець, 1д');
  const [features, setFeatures] = useState([]);
  const [point, setPoint] = useState(null);
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tileError, setTileError] = useState(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  const label = feature => {
    const p = feature.properties || {};
    return p.address || [p.settlement, p.street_type, p.street, p.name].filter(Boolean).join(', ');
  };
  const choose = feature => {
    const coords = feature.geo_centroid?.coordinates || feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite)) { setError('У результаті немає координат точки.'); return; }
    setPoint({ lat: coords[1], lng: coords[0] }); setAddress(label(feature));
  };
  async function query(payload) {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError('');
    try {
      const { data } = await axios.post('/integrations/visicom-test/geocode/', { key, ...payload }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setFeatures(data.features || []);
      if (payload.mode === 'reverse') {
        setAddress(data.features?.length ? label(data.features[0]) : 'Адресу біля вибраної точки не знайдено');
      } else if (!data.features?.length) setError('Адресу не знайдено. Спробуйте без номера будинку.');
    } catch (err) {
      if (!controller.signal.aborted) setError(err.response?.data?.error || 'Не вдалося виконати пошук.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }
  if (isLoading) return <p>Завантаження…</p>;
  if (role !== 'admin') return <p role="alert">Тест доступний лише адміністратору.</p>;
  return <main className="visicom-test-page">
    <h1>Visicom — тест вибору адреси</h1>
    <p>Окрема тестова форма. Вибір адреси тут не створює замовлення й не змінює адреси дилерів.</p>
    <form onSubmit={event => { event.preventDefault(); request.current?.abort(); setBusy(false); setVisicomSessionKey(keyInput); setKey(keyInput.trim()); setKeyInput(''); setFeatures([]); setPoint(null); setAddress(''); setError(''); setTileError(false); }}>
      <label>API-ключ Visicom<input type="password" value={keyInput} onChange={event => setKeyInput(event.target.value)} autoComplete="off" placeholder={key ? 'Ввести інший ключ' : 'Ключ з доступом до Data API та Tiles'} /></label>
      <button disabled={!keyInput.trim()}>Підключити Visicom</button>
    </form>
    <p>Ключ не записується в базу або сховище браузера. Після перезавантаження введіть його знову.</p>
    {key && <>
      <form onSubmit={event => { event.preventDefault(); query({text}); }}>
        <label>Адреса<input value={text} onChange={event => setText(event.target.value)} /></label>
        <button disabled={busy || text.trim().length < 3}>Знайти адресу</button>
      </form>
      {busy && <p role="status">Пошук…</p>}
      {error && <p role="alert">{error}</p>}
      <ul>{features.map(feature => <li key={feature.id}><button onClick={() => choose(feature)}>{label(feature)}</button></li>)}</ul>
      {tileError && <p role="alert">Карта не завантажилась. Перевірте доступ ключа до Visicom Tiles.</p>}
      <p>Натисніть на карту, щоб уточнити точку доставки та перевірити визначення адреси.</p>
      <MapContainer key={key} center={[48.350816,25.323917]} zoom={13} className="visicom-test-map">
        <TileLayer url={'https://tms{s}.visicom.ua/2.0.0/planet3/base/{z}/{x}/{y}.png?key=' + encodeURIComponent(key)} subdomains="123" tms maxZoom={19} attribution={'Дані карт © АТ «<a href="https://api.visicom.ua/">Візіком</a>»'} eventHandlers={{tileerror: () => setTileError(true)}} />
        <MapPoint point={point} onPoint={value => { setPoint({lat:value.lat,lng:value.lng}); setAddress(''); query({mode:'reverse', lat:value.lat,lng:value.lng}); }} />
      </MapContainer>
      {point && <section><h2>Вибрана адреса</h2><p>{address || 'Точку вибрано на карті'}</p><p>Координати: <strong>{point.lat},{point.lng}</strong></p><pre>{JSON.stringify({addressName:address,addressCoordinates:point},null,2)}</pre></section>}
    </>}
  </main>;
}
