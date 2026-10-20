import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from '../../api/axios';
import './FundsTransferForms.css';
import FundsReconciliationStatus from './FundsReconciliationStatus';
import { useAuthGetRole } from '../../hooks/useAuthGetRole';

export default function FundsTransferForms({ contractor, historyOnly = false, sidebar = false, compact = false }) {
  const { role } = useAuthGetRole();
  const canSubmit = !historyOnly && ['customer', 'dealer'].includes(role);
  const [mode, setMode] = useState(''), [amount, setAmount] = useState(''), [currency, setCurrency] = useState('UAH');
  const [comment, setComment] = useState(''), [photo, setPhoto] = useState(null), [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [history, setHistory] = useState([]), [page, setPage] = useState(1), [count, setCount] = useState(0), [historyPhoto, setHistoryPhoto] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [routes, setRoutes] = useState([]), [routeToken, setRouteToken] = useState('');
  const [routesLoading, setRoutesLoading] = useState(false), [routesError, setRoutesError] = useState('');
  const [routesReload, setRoutesReload] = useState(0);
  const dialog = useRef(null);
  useEffect(() => {
    setRoutes([]); setRouteToken(''); setRoutesError('');
    if (mode !== 'create' || !transferDate) { setRoutesLoading(false); return; }
    const controller = new AbortController();
    setRoutesLoading(true);
    axios.get('/payments/funds-transfers/routes/', { params: { contractor, transfer_date: transferDate }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setRoutes(data.routes || []); })
      .catch((err) => { if (!controller.signal.aborted) setRoutesError(err.response?.data?.detail || 'Не вдалося завантажити маршрутизацію.'); })
      .finally(() => { if (!controller.signal.aborted) setRoutesLoading(false); });
    return () => controller.abort();
  }, [contractor, transferDate, mode, routesReload]);
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
    if (!transferDate || !routeToken || routesLoading) { setError('Оберіть дату передачі та підтвердьте, які замовлення приїхали до вас.'); return; }
    if (!photo || photo.size > 10 * 1024 * 1024) { setError('Додайте фото до 10 МБ.'); return; }
    setBusy(true); setError('');
    const body = new FormData(); body.append('contractor', contractor); body.append('amount', amount.replace(',', '.')); body.append('currency', currency); body.append('comment', comment); body.append('photo', photo); body.append('transfer_date', transferDate); body.append('route_confirmation', routeToken);
    try { await axios.post('/payments/funds-transfers/', body); setAmount(''); setComment(''); setPhoto(null); setTransferDate(''); setMode(''); setNotice('Дані подано. Це не підтвердження оплати й не змінює борг автоматично.'); }
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
  const actions = <>{canSubmit && <button type="button" disabled={!validContractor} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); open('create'); }}>Подати кошти</button>}<button type="button" disabled={!validContractor} title={!validContractor ? 'Спочатку оберіть дилера' : ''} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); open('history'); }}>Історія подань</button></>;
  return <div className={`funds-transfer-controls${sidebar ? ' funds-transfer-controls--sidebar' : ''}${compact ? ' funds-transfer-controls--compact' : ''}`}>
    {compact ? <details className="funds-transfer-menu"><summary>Передані кошти ▾</summary><div>{actions}</div></details> : actions}
    {notice && <small role="status">{notice}</small>}
    {mode && createPortal(<div className="funds-transfer-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !busy) { if (historyPhoto) setHistoryPhoto(''); else setMode(''); } }}><section className={`funds-transfer-dialog${mode === 'history' && !historyPhoto ? ' funds-transfer-dialog--history' : ''}${historyPhoto ? ' funds-transfer-dialog--photo' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="funds-transfer-title" onKeyDown={(event) => {
      if (event.key === 'Escape' && !busy) { if (historyPhoto) setHistoryPhoto(''); else setMode(''); }
      if (event.key === 'Tab') { const fields = [...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')]; if (!fields.length) { event.preventDefault(); return; } if (event.shiftKey && document.activeElement === fields[0]) { event.preventDefault(); fields.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === fields.at(-1)) { event.preventDefault(); fields[0].focus(); } }
    }}><header><h3 id="funds-transfer-title">{historyPhoto ? 'Фото подання' : mode === 'create' ? 'Передані кошти' : 'Історія подань'}</h3><button type="button" disabled={busy} className="funds-transfer-close" title="Закрити" aria-label="Закрити" onClick={() => { if (historyPhoto) setHistoryPhoto(''); else setMode(''); }}>×</button></header>{historyPhoto ? <div className="funds-transfer-photo-view"><img className="funds-transfer-photo" src={historyPhoto} alt="Фото подання коштів" /></div> : <><p className="funds-transfer-hint">Подання інформації не є підтвердженням оплати.</p>
      {error && <p role="alert" className="funds-transfer-error">{error}</p>}
      {mode === 'history' && <button type="button" disabled={busy || !count} onClick={exportPdf} className="funds-transfer-export">Завантажити PDF</button>}
      {mode === 'create' ? <form onSubmit={submit}>
        <label>Дата передачі коштів<input type="date" required value={transferDate} onChange={(event) => { setTransferDate(event.target.value); setRouteToken(''); }} disabled={busy} /></label>
        {routesLoading && <p role="status">Пошук маршрутизації…</p>}
        {routesError && <p role="alert" className="funds-transfer-error">{routesError}</p>}
        {transferDate && <button type="button" disabled={busy || routesLoading} onClick={() => setRoutesReload((value) => value + 1)}>Оновити список замовлень</button>}
        {transferDate && !routesLoading && !routesError && !routes.length && <p>На цю дату доставки ваших замовлень не знайдено. Оберіть день, коли замовлення мали приїхати до вас.</p>}
        {routes.length > 0 && <fieldset className="funds-transfer-routes"><legend>Ці номери замовлень приїхали вам?</legend>
          {routes.map((route) => <label key={route.guid} className="funds-transfer-route"><input type="radio" name="routing" value={route.confirmation} checked={routeToken === route.confirmation} disabled={busy || routesLoading} onChange={() => { setRouteToken(route.confirmation); }} /><span>{route.orders.join(', ')}</span></label>)}

        </fieldset>}
        <div className="funds-transfer-amount"><label>Сума<input inputMode="decimal" type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label><label>Валюта<select value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={busy}><option value="UAH">грн</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label></div>
        <label>Фото<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setPhoto(event.target.files[0] || null)} disabled={busy} /></label><small>JPG, PNG або WebP, до 10 МБ.</small>{preview && <img className="funds-transfer-photo" src={preview} alt="Фото переданих коштів" />}
        <label>Додатковий коментар<textarea maxLength={2000} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} disabled={busy} placeholder="Необов’язково" /></label><footer><button type="button" disabled={busy} onClick={() => setMode('')}>Скасувати</button><button type="submit" disabled={busy || routesLoading || !routeToken}>{busy ? 'Подання…' : 'Подати дані'}</button></footer>
      </form> : <><div className="funds-transfer-history funds-transfer-history-table">
        {busy && <p role="status">Завантаження…</p>}
        {!busy && !history.length && !error && <p>Раніше поданих даних немає.</p>}
        {history.length > 0 && <table aria-label="Історія подань коштів"><thead><tr><th>Дата</th><th>Сума</th><th>Статус</th><th>Коментар</th><th>Фото</th></tr></thead><tbody>
          {history.map((item) => <tr key={item.id}>
            <td><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><small>{item.author}</small>{item.transfer_date && <small>Передано {item.transfer_date.split('-').reverse().join('.')}</small>}</td>
            <td className="funds-transfer-history-sum">{Number(item.amount).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} {item.currency === 'UAH' ? 'грн' : item.currency}</td>
            <td><FundsReconciliationStatus item={item} /></td>
            <td><span className="funds-transfer-history-comment">{item.comment || '—'}</span>{item.routing_orders?.length > 0 && <details><summary>Замовлення</summary><small>{item.routing_orders.join(', ')}</small></details>}</td>
            <td><button type="button" className="funds-transfer-photo-link" disabled={busy} onClick={() => viewPhoto(item.id)} aria-label={`Фото подання № ${item.id}`}>Фото</button></td>
          </tr>)}
        </tbody></table>}
      </div>{count > 20 && <footer><button type="button" disabled={busy || page <= 1} onClick={() => setPage((value) => value - 1)}>Назад</button><span>{page} / {Math.max(1, Math.ceil(count / 20))}</span><button type="button" disabled={busy || page * 20 >= count} onClick={() => setPage((value) => value + 1)}>Далі</button></footer>}</>}
    </>} </section></div>, document.body)}
  </div>;
}
