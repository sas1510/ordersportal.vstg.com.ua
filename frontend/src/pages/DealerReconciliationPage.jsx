import { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axios';
import { useDealerContext } from '../hooks/useDealerContext';
import { summarizeReconciliation, filterReconciliation, localDay, activityStart } from '../utils/dealerReconciliation';
import './DealerReconciliationPage.css';

const number = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
const n = value => number.format(value || 0);
const share = (value, total) => `${n(value)} (${total ? (100 * value / total).toFixed(1) : '0.0'}%)`;
function ConstructionsChart({ totals }) {
  const values = [['Заявки: конструкції', totals.applicationConstructions, 'new'], ['Пов’язані замовлення: конструкції', totals.linkedConstructions, 'linked']];
  const max = Math.max(1, ...values.map(v => v[1]));
  return <div className="reconcile-comparison">{values.map(([label, value, color]) => <div key={label}><span>{label}</span><div><i className={`reconcile-${color}`} style={{ width: `${100 * value / max}%` }} /><b>{n(value)}</b></div></div>)}</div>;
}
function ComparisonTable({ rows, dealer = false, onDealer, onRegion }) {
  return <div className="reconcile-scroll"><table><thead><tr>{[dealer ? 'Дилер' : 'Область / філіал', 'Заявок', 'Конструкцій у заявках', 'Пов’язаних замовлень', 'Конструкцій у замовленнях', 'Різниця конструкцій', 'Конверсія заявок'].map(v => <th key={v}>{v}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={dealer ? r.guid : r.name}><td><button className="reconcile-link" onClick={() => dealer ? onDealer(r) : onRegion(r.name)}>{r.name}</button></td><td>{n(r.applications)}</td><td>{n(r.applicationConstructions)}</td><td>{n(r.linkedOrders)}</td><td>{n(r.linkedConstructions)}</td><td>{n(r.applicationConstructions - r.linkedConstructions)}</td><td>{(r.applications ? 100 * r.convertedApplications / r.applications : 0).toFixed(1)}%</td></tr>)}</tbody></table></div>;
}
function ApplicationTable({ rows }) {
  return <div className="reconcile-scroll"><table><thead><tr><th>Заявка</th><th>Дата</th><th>Конструкцій у заявці</th><th>Підтверджені замовлення</th><th>Конструкцій у замовленнях</th><th>Різниця</th></tr></thead><tbody>{rows.map(a => <tr key={a.guid}><td>{a.number}</td><td>{a.date}</td><td>{n(a.constructions)}</td><td>{a.orders.map(o => `${o.number} (${n(o.constructions)})`).join(', ') || 'Немає'}</td><td>{n(a.orderConstructions)}</td><td>{n(a.constructions - a.orderConstructions)}</td></tr>)}</tbody></table></div>;
}
export default function DealerReconciliationPage() {
  const { isSuperAdmin, isLoading } = useDealerContext();
  const today = localDay(new Date());
  const [dates, setDates] = useState({ date_from: today.slice(0, 8) + '01', date_to: today, activity_from: activityStart(today) });
  const [report, setReport] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [exporting, setExporting] = useState(false), [filters, setFilters] = useState({ region: '', search: '' });
  const [selected, setSelected] = useState(null);
  const controller = useRef(null), closeRef = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!selected) return;
    const before = document.activeElement;
    closeRef.current?.focus();
    const key = e => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); before?.focus(); };
  }, [selected]);
  async function generate(e) {
    e.preventDefault(); controller.current?.abort();
    const active = new AbortController(); controller.current = active;
    setBusy(true); setError(''); setSelected(null);
    try {
      const { data } = await axios.get('/dealer-reconciliation/', { params: dates, signal: active.signal, timeout: 180000 });
      if (!active.signal.aborted) { setReport(data); setFilters({ region: '', search: '' }); }
    } catch (err) {
      if (!active.signal.aborted) setError(err.response?.data?.detail || 'Не вдалося сформувати звіт. Спробуйте ще раз.');
    } finally { if (!active.signal.aborted) setBusy(false); }
  }
  async function download(type) {
    setExporting(true); setError('');
    try {
      const response = await axios.get('/dealer-reconciliation/', { params: { snapshot: report.snapshot, export: type, ...filters }, responseType: 'blob', timeout: 180000 });
      const href = URL.createObjectURL(response.data), a = document.createElement('a');
      a.href = href; a.download = `Новий_портал_конструкції_${report.period.from}_${report.period.to}.${type}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (err) {
      let message = 'Не вдалося завантажити файл.';
      try { message = JSON.parse(await err.response.data.text()).detail || message; } catch { /* Network response may have no body. */ }
      setError(message);
    } finally { setExporting(false); }
  }
  const rows = useMemo(() => filterReconciliation(report?.rows || [], filters), [report, filters]);
  const totals = useMemo(() => summarizeReconciliation(rows), [rows]);
  const regions = useMemo(() => [...new Set(rows.map(r => r.region))].sort().map(name => ({ name, ...summarizeReconciliation(rows.filter(r => r.region === name)) })), [rows]);
  if (isLoading) return <p>Завантаження…</p>;
  if (!isSuperAdmin) return <p role="alert">Звіт усіх дилерів доступний лише адміністратору.</p>;
  return <main className="reconcile-page">
    <header><p className="reconcile-eyebrow">Аналітика · Вікна Стиль</p><h1>Новий портал: заявки та конструкції</h1><p>Від заявки до підтвердженого замовлення: кількість конструкцій, конверсія та різниця.</p></header>
    <form className="reconcile-panel reconcile-controls" onSubmit={generate}>
      <label>Звіт з<input type="date" required min="2000-01-01" max={dates.date_to} value={dates.date_from} onChange={e => setDates({ ...dates, date_from: e.target.value })} /></label>
      <label>По<input type="date" required min={dates.date_from} max={today} value={dates.date_to} onChange={e => setDates({ ...dates, date_to: e.target.value, activity_from: activityStart(e.target.value) })} /></label>
      <label>Активність дилерів з<input type="date" required min="2000-01-01" max={dates.date_from} value={dates.activity_from} onChange={e => setDates({ ...dates, activity_from: e.target.value })} /></label>
      <button type="submit" disabled={busy || exporting}>{busy ? 'Формування…' : 'Сформувати'}</button>
    </form>
    {error && <p className="reconcile-error" role="alert">{error}</p>}
    {report && <>
      <div className="reconcile-toolbar"><span>Сформовано {new Date(report.generatedAt).toLocaleString('uk-UA')} · {report.period.from} — {report.period.to} · Замовлення лише «Подтверждено»</span><button disabled={busy || exporting} onClick={() => download('pdf')}>{exporting ? 'Підготовка…' : 'Завантажити PDF'}</button><button disabled={busy || exporting} onClick={() => download('csv')}>Заявки → замовлення · CSV</button></div>
      <div className="reconcile-panel reconcile-controls">
        <label>Область / філіал<select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value })}><option value="">Усі</option>{report.regions.map(r => <option key={r.name}>{r.name}</option>)}</select></label>
        <label>Дилер<input type="search" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Назва або GUID" /></label><button onClick={() => setFilters({ region: '', search: '' })}>Скинути</button>
      </div>
      <div className="reconcile-cards">{[['Заявок нового порталу', n(totals.applications)], ['Конструкцій у заявках', n(totals.applicationConstructions)], ['Конструкцій у пов’язаних замовленнях', n(totals.linkedConstructions)], ['Конверсія заявок', `${totals.conversion.toFixed(1)}%`], ['Різниця конструкцій', n(totals.difference)], ['На новому порталі / усіх дилерів у 1С', share(totals.onPortal, totals.dealers)]].map(([label, value]) => <section className="reconcile-panel" key={label}><span>{label}</span><strong>{value}</strong></section>)}</div>
      <section className="reconcile-panel"><h2>Заявки → підтверджені замовлення</h2><p>Порівнюємо заявки, створені у звітному періоді, з пов’язаними замовленнями до кінцевої дати відбору. Конверсія — частка заявок із хоча б одним підтвердженим замовленням.</p><ConstructionsChart totals={totals} /><p>Різниця конструкцій — показник для порівняння, вона не означає відмову клієнта.</p></section>
      <section className="reconcile-panel"><h2>Заявки й конструкції за областями</h2><ComparisonTable rows={regions} onRegion={region => setFilters({ ...filters, region })} /></section>
      <section className="reconcile-panel"><h2>Дилери за областями</h2><p>Кількість дилерів у поточному відборі та частка на новому порталі.</p><div className="reconcile-scroll"><table><thead><tr><th>Область / філіал</th><th>Усього у 1С</th><th>Новий портал</th></tr></thead><tbody>{regions.map(g => <tr key={g.name}><td>{g.name}</td><td>{g.dealers}</td><td>{share(g.onPortal, g.dealers)}</td></tr>)}</tbody></table></div></section>
      <section className="reconcile-panel"><h2>Порівняння за дилерами</h2><p>Натисніть дилера, щоб побачити його заявки, номери пов’язаних замовлень і кількість конструкцій.</p><ComparisonTable rows={rows} dealer onDealer={setSelected} />{!rows.length && <p>За цим відбором дилерів немає.</p>}</section>
      <section className="reconcile-panel"><h2>Замовлення за датою замовлення</h2><p>Усі підтверджені у 1С: <b>{n(totals.total)}</b> замовлень / <b>{n(totals.orderConstructions)}</b> конструкцій. Із нового порталу: <b>{n(totals.newOrders)}</b> замовлень / <b>{n(totals.newConstructions)}</b> конструкцій.</p><p>Тут врахована дата замовлення. У порівнянні вище — дата заявки, тому підсумки можуть відрізнятися.</p></section>
    </>}
    {selected && <div className="reconcile-overlay" onClick={() => setSelected(null)}><section className="reconcile-dialog" role="dialog" aria-modal="true" aria-label={selected.name} onClick={e => e.stopPropagation()}><button ref={closeRef} className="reconcile-close" onClick={() => setSelected(null)}>Закрити</button><h2>{selected.name}</h2><p>{selected.path}</p><p>GUID: {selected.guid}</p><h3>Заявки та пов’язані замовлення</h3><p>Кожне замовлення враховане у підсумках один раз, навіть якщо воно пов’язане з кількома заявками.</p><ApplicationTable rows={selected.applicationDetails} />{!selected.applicationDetails.length && <p>Немає заявок нового порталу за звітний період.</p>}<h3>Усі підтверджені замовлення звітного періоду</h3><div className="reconcile-scroll"><table><thead><tr><th>Номер 1С</th><th>Дата</th><th>Конструкцій</th><th>Новий портал</th></tr></thead><tbody>{selected.orders.map(o => <tr key={o.guid}><td>{o.number}</td><td>{o.date}</td><td>{n(o.constructions)}</td><td>{o.newPortal ? 'Так' : 'Не віднесено'}</td></tr>)}</tbody></table></div></section></div>}
  </main>;
}
