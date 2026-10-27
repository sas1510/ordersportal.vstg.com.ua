import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axios';
import { useAuthGetRole } from '../hooks/useAuthGetRole';
import './MeasurementTestPage.css';

function createRequestKey() {
  if (crypto.randomUUID) return crypto.randomUUID();
  // randomUUID requires HTTPS; getRandomValues also works on local HTTP hosts.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ fileName: file.name, fileDataB64: String(reader.result).split(',')[1] });
    reader.onerror = () => reject(new Error(`Не вдалося прочитати ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export default function MeasurementTestPage() {
  const { isAdmin } = useAuthGetRole();
  const [config, setConfig] = useState(null);
  const [userId, setUserId] = useState('');
  const [count, setCount] = useState(1);
  const [number, setNumber] = useState('');
  const [comment, setComment] = useState('');
  const [pdf, setPdf] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const keyRef = useRef('');
  const sentRef = useRef(false);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    axiosInstance.get('/integrations/measurement/test/').then(({ data }) => {
      if (active) setConfig(data);
    }).catch((error) => {
      if (active) setResult({ status: error.response?.status, data: error.response?.data || error.message });
    });
    return () => { active = false; };
  }, [isAdmin]);

  const resetKey = () => { keyRef.current = ''; sentRef.current = false; };
  const newRequest = () => { resetKey(); setResult(null); };
  const submit = async (event) => {
    event.preventDefault();
    if (busy || sentRef.current) return;
    if (!pdf || pdf.size > 20 * 1024 * 1024 || !pdf.name.toLowerCase().endsWith('.pdf')) {
      setResult({ data: 'Оберіть PDF до 20 МіБ.' }); return;
    }
    if (photos.length > 10 || photos.some((file) => file.size > 10 * 1024 * 1024)) {
      setResult({ data: 'Дозволено до 10 фото, кожне до 10 МіБ.' }); return;
    }
    setBusy(true);
    try {
      if (!keyRef.current) keyRef.current = createRequestKey();
      const payload = {
        user_id: Number(userId), items_count: Number(count), comment,
        ...(number.trim() ? { order_number: number.trim() } : {}),
        file: await readBase64(pdf),
        ...(photos.length ? { photos: await Promise.all(photos.map(readBase64)) } : {}),
      };
      const response = await axiosInstance.post('/integrations/measurement/test/', payload, {
        headers: { 'Idempotency-Key': keyRef.current }, timeout: 120000,
      });
      sentRef.current = response.data?.success === true;
      setResult({ status: response.status, data: response.data });
    } catch (error) {
      setResult({ status: error.response?.status, data: error.response?.data || error.message });
    } finally { setBusy(false); }
  };

  if (!isAdmin) return <main className="measurement-test"><p>Доступ лише адміністратору.</p></main>;
  return <main className="measurement-test">
    <h1>Тест інтеграції замірника</h1>
    <p className="measurement-test-warning">Надсилання створює справжню заявку в робочій 1С.</p>
    <p>Адреса 1С: <code>{config?.one_c_url || 'Завантаження…'}</code></p>
    {config && !config.configured && <p role="alert">Додайте MEASUREMENT_API_KEY у backend/.env та перезапустіть Django.</p>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || sentRef.current}>
        <label>ID дилера з portal_db.dbo.User<input required type="number" min="1" step="1" value={userId} onChange={(e) => { setUserId(e.target.value); resetKey(); }} /></label>
        <label>Кількість конструкцій<input required type="number" min="1" step="1" value={count} onChange={(e) => { setCount(e.target.value); resetKey(); }} /></label>
        <label>Номер замовлення (необов’язково)<input value={number} onChange={(e) => { setNumber(e.target.value); resetKey(); }} /></label>
        <label>Коментар<textarea value={comment} onChange={(e) => { setComment(e.target.value); resetKey(); }} /></label>
        <label>PDF — до 20 МіБ<input required type="file" accept=".pdf,application/pdf" onChange={(e) => { setPdf(e.target.files[0] || null); resetKey(); }} /></label>
        <label>Фото — до 10 файлів по 10 МіБ (необов’язково)<input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { setPhotos(Array.from(e.target.files)); resetKey(); }} /></label>
      </fieldset>
      <div className="measurement-test-actions">
        <button type="submit" disabled={busy || !config?.configured || sentRef.current}>{busy ? 'Надсилання…' : sentRef.current ? 'Заявку створено' : 'Створити заявку'}</button>
        <button type="button" disabled={busy} onClick={newRequest}>Нова заявка / новий UUID</button>
      </div>
    </form>
    <p>При повторі без зміни полів UUID зберігається. Після помилки зв’язку спочатку перевірте результат у 1С.</p>
    {result && <section aria-live="polite"><h2>Результат {result.status ? `— HTTP ${result.status}` : ''}</h2><pre>{JSON.stringify(result.data, null, 2)}</pre></section>}
  </main>;
}
