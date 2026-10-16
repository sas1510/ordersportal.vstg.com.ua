import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../api/axios';
import './FundsTransferForms.css';
import { useAuthGetRole } from '../../hooks/useAuthGetRole';

export default function FundsTransferForms({ contractor, historyOnly = false, sidebar = false, compact = false }) {
  const { role } = useAuthGetRole();
  const canSubmit = !historyOnly && ['customer', 'dealer'].includes(role);
  const [mode, setMode] = useState(''), [amount, setAmount] = useState(''), [currency, setCurrency] = useState('UAH');
  const [comment, setComment] = useState(''), [photo, setPhoto] = useState(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]), [page, setPage] = useState(1), [count, setCount] = useState(0), [historyPhoto, setHistoryPhoto] = useState('');
  const dialog = useRef(null);
  const validContractor = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contractor || '');
  useEffect(() => { setMode(''); setHistory([]); setError(''); setNotice(''); setHistoryPhoto(''); }, [contractor]);
  useEffect(() => { if (!photo) { setPreview(''); return; } const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url); }, [photo]);
  useEffect(() => () => { if (historyPhoto) URL.revokeObjectURL(historyPhoto); }, [historyPhoto]);
  useEffect(() => { if (!mode) return; const previous = document.activeElement; dialog.current?.querySelector('input,button')?.focus(); return () => previous?.focus?.(); }, [mode]);
  useEffect(() => {
    if (mode !== 'history') return;
    const controller = new AbortController(); setBusy(true); setError('');
    axios.get('/payments/funds-transfers/', { params: { contractor, page }, signal: controller.signal }).then(({ data }) => { setHistory(data.results); setCount(data.count); }).catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.detail || 'Не вдалося завантажити історію.'); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [mode, contractor, page]);
  const open = (value) => { setError(''); setNotice(''); setHistoryPhoto(''); setPage(1); setMode(value); };
  const submit = async (event) => {
    event.preventDefault(); if (busy || !canSubmit) return;
    if (!photo || photo.size > 10 * 1024 * 1024) { setError('Додайте фото до 10 МБ.'); return; }
    setBusy(true); setError('');
    const body = new FormData(); body.append('contractor', contractor); body.append('amount', amount.replace(',', '.')); body.append('currency', currency); body.append('comment', comment); body.append('photo', photo);
    try { await axios.post('/payments/funds-transfers/', body); setAmount(''); setComment(''); setPhoto(null); setMode(''); setNotice('Дані подано. Це не підтвердження оплати й не змінює борг автоматично.'); }
    catch (err) { setError(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Не вдалося подати дані.'); }
    finally { setBusy(false); }
  };
  const viewPhoto = async (id) => {
    if (busy) return; setBusy(true); setError('');
    try { const { data } = await axios.get(`/payments/funds-transfers/${id}/photo/`, { params: { contractor }, responseType: 'blob' }); setHistoryPhoto(URL.createObjectURL(data)); }
    catch { setError('Не вдалося відкрити фото.'); } finally { setBusy(false); }
  };
  const exportPdf = async () => {
    if (busy) return; setBusy(true); setError('');
    try {
      const { data } = await axios.get('/payments/funds-transfers/export-pdf/', { params: { contractor }, responseType: 'blob' });
      const url = URL.createObjectURL(data), link = document.createElement('a');
      link.href = url; link.download = 'Передані кошти.pdf'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { setError('Не вдалося завантажити PDF.'); } finally { setBusy(false); }
  };
  const actions = <>{canSubmit && <button type="button" disabled={!validContractor} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); open('create'); }}>{compact ? 'Подати дані' : 'Передані кошти'}</button>}<button type="button" disabled={!validContractor} title={!validContractor ? 'Спочатку оберіть дилера' : ''} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); open('history'); }}>Історія подань</button></>;
  return <div className={`funds-transfer-controls${sidebar ? ' funds-transfer-controls--sidebar' : ''}${compact ? ' funds-transfer-controls--compact' : ''}`}>
    {compact ? <details className="funds-transfer-menu"><summary>Передані кошти ▾</summary><div>{actions}</div></details> : actions}
    {notice && <small role="status">{notice}</small>}
    {mode && createPortal(<div className="funds-transfer-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busy) { if (historyPhoto) setHistoryPhoto(''); else setMode(''); } }}><section className="funds-transfer-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="funds-transfer-title" onKeyDown={(event) => {
      if (event.key === 'Escape' && !busy) { if (historyPhoto) setHistoryPhoto(''); else setMode(''); }
      if (event.key === 'Tab') { const fields = [...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')]; if (!fields.length) { event.preventDefault(); return; } if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0].focus(); } }
    }}><header><h3 id="funds-transfer-title">{historyPhoto ? 'Фото подання' : mode === 'create' ? 'Передані кошти' : 'Раніше подані дані'}</h3><button type="button" disabled={busy} aria-label="Закрити" onClick={() => { if (historyPhoto) setHistoryPhoto(''); else setMode(''); }}>×</button></header>{historyPhoto ? <div className="funds-transfer-photo-view"><img className="funds-transfer-photo" src={historyPhoto} alt="Фото подання коштів" /><button type="button" autoFocus onClick={() => setHistoryPhoto('')}>Назад до історії</button></div> : <><p className="funds-transfer-hint">Подання інформації не є підтвердженням оплати.</p>
      {error && <p role="alert" className="funds-transfer-error">{error}</p>}
      {mode === 'history' && <button type="button" disabled={busy || !count} onClick={exportPdf}>Завантажити PDF · усі подання</button>}
      {mode === 'create' ? <form onSubmit={submit}><div className="funds-transfer-amount"><label>Сума<input inputMode="decimal" type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label><label>Валюта<select value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={busy}><option value="UAH">грн</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label></div>
        <label>Фото<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setPhoto(event.target.files[0] || null)} disabled={busy} /></label><small>JPG, PNG або WebP, до 10 МБ.</small>{preview && <img className="funds-transfer-photo" src={preview} alt="Фото переданих коштів" />}
        <label>Додатковий коментар<textarea maxLength={2000} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} disabled={busy} placeholder="Необов’язково" /></label><footer><button type="button" disabled={busy} onClick={() => setMode('')}>Скасувати</button><button type="submit" disabled={busy}>{busy ? 'Подання…' : 'Подати дані'}</button></footer>
      </form> : <><div className="funds-transfer-history">{busy && <p role="status">Завантаження…</p>}{!busy && !history.length && !error && <p>Раніше поданих даних немає.</p>}{history.map((item) => <article key={item.id}><div><strong>{Number(item.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {item.currency === 'UAH' ? 'грн' : item.currency}</strong><small>{new Date(item.created_at).toLocaleString('uk-UA')}</small></div><small>Подав: {item.author}</small>{item.comment && <p>{item.comment}</p>}<button type="button" disabled={busy} onClick={() => viewPhoto(item.id)}>Переглянути фото</button></article>)}</div><footer><button type="button" disabled={busy || page <= 1} onClick={() => setPage((value) => value - 1)}>Назад</button><span>{page} / {Math.max(1, Math.ceil(count / 20))}</span><button type="button" disabled={busy || page * 20 >= count} onClick={() => setPage((value) => value + 1)}>Далі</button></footer></>}
    </>} </section></div>, document.body)}
  </div>;
}
