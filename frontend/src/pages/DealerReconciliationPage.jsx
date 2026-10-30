import { useEffect, useMemo, useRef, useState } from 'react';
import axios from '../api/axios';
import { useDealerContext } from '../hooks/useDealerContext';
import { summarizeReconciliation, filterReconciliation, localDay, activityStart, statusBreakdown } from '../utils/dealerReconciliation';
import './DealerReconciliationPage.css';

const number = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });
const n = value => number.format(value || 0);
const percent = (value, total) => `${total ? (100 * value / total).toFixed(1) : '0.0'}%`;
function StatusTable({ title, rows, compact = false }) {
  const total = rows.reduce((sum, row) => sum + row.documents, 0);
  const quantity = rows.reduce((sum, row) => sum + row.constructions, 0);
  const Heading = compact ? 'h4' : 'h2';
  return <section className={compact ? 'reconcile-status-group' : 'reconcile-panel'}><Heading>{title}</Heading><div className="reconcile-scroll"><table className="reconcile-stack-table"><thead><tr><th>Статус документа</th><th>Замовлень / документів</th><th>Частка документів</th><th>Конструкцій</th><th>Частка конструкцій</th></tr></thead><tbody>{rows.map(row => <tr key={row.guid}><td data-label="Статус">{row.name}</td><td data-label="Документів">{n(row.documents)}</td><td data-label="Частка документів">{percent(row.documents, total)}</td><td data-label="Конструкцій">{n(row.constructions)}</td><td data-label="Частка конструкцій">{percent(row.constructions, quantity)}</td></tr>)}</tbody><tfoot><tr><th data-label="Підсумок">Усього</th><th data-label="Документів">{n(total)}</th><th data-label="Частка документів">{percent(total, total)}</th><th data-label="Конструкцій">{n(quantity)}</th><th data-label="Частка конструкцій">{percent(quantity, quantity)}</th></tr></tfoot></table></div>{!rows.length && <p>Документів у відборі немає.</p>}</section>;
}
function ComparisonTable({ rows, dealer = false, onDealer, onRegion }) {
  const fields = [['applications', 'Заявок / прорахунків'], ['applicationConstructions', 'Конструкцій у заявках'], ['linkedOrders', 'Замовлень із заявок'], ['linkedConstructions', 'Конструкцій у замовленнях'], ['confirmedLinkedOrders', 'Підтверджених замовлень'], ['confirmedLinkedConstructions', 'Підтверджених конструкцій']];
  const [requestedPage, setPage] = useState(0);
  const panelRef = useRef(null);
  const pageCount = dealer ? Math.max(1, Math.ceil(rows.length / 20)) : 1;
  const page = Math.min(requestedPage, pageCount - 1);
  const visible = dealer ? rows.slice(page * 20, (page + 1) * 20) : rows;
  function changePage(next) {
    setPage(next);
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  return <div ref={panelRef}>{dealer && <p>Дилерів: {n(rows.length)}</p>}<div className="reconcile-scroll"><table className="reconcile-stack-table"><thead><tr><th>{dealer ? 'Дилер' : 'Область / філіал'}</th>{fields.map(([key, label]) => <th key={key}>{label}</th>)}<th>Конверсія в підтвердження</th></tr></thead><tbody>{visible.map(row => <tr key={dealer ? row.guid : row.name}><td data-label={dealer ? 'Дилер' : 'Область / філіал'}><button className="reconcile-link" onClick={() => dealer ? onDealer(row) : onRegion(row.name)}>{row.name}</button></td>{fields.map(([field, label]) => <td key={field} data-label={label}>{n(row[field])}</td>)}<td data-label="Конверсія">{percent(row.convertedApplications, row.applications)}</td></tr>)}</tbody></table></div>{dealer && pageCount > 1 && <nav className="reconcile-pagination" aria-label="Сторінки дилерів"><button disabled={page === 0} onClick={() => changePage(page - 1)}>Назад</button><span>{page + 1} / {pageCount}</span><button disabled={page === pageCount - 1} onClick={() => changePage(page + 1)}>Далі</button></nav>}</div>;
}
function OrderTable({ orders }) {
  return <div className="reconcile-scroll"><table className="reconcile-stack-table"><thead><tr><th>Замовлення</th><th>Дата</th><th>Статус</th><th>Конструкцій</th></tr></thead><tbody>{orders.map(order => <tr key={order.guid}><td data-label="Замовлення">{order.number}</td><td data-label="Дата">{order.date}</td><td data-label="Статус">{order.state}</td><td data-label="Конструкцій">{n(order.constructions)}</td></tr>)}</tbody></table></div>;
}
function ApplicationTable({ rows }) {
  const [requestedPage, setPage] = useState(0);
  const listRef = useRef(null);
  const pageCount = Math.max(1, Math.ceil(rows.length / 20));
  const page = Math.min(requestedPage, pageCount - 1);
  function changePage(next) {
    setPage(next);
    window.requestAnimationFrame(() => listRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  return <div className="reconcile-applications" ref={listRef}><p>Заявок: <b>{n(rows.length)}</b>. Відкрийте заявку, щоб побачити її замовлення та конструкції за статусами.</p><p>Якщо замовлення пов’язане з кількома заявками, у загальному підсумку воно враховане один раз.</p>{rows.slice(page * 20, (page + 1) * 20).map(app => <details key={app.guid} className="reconcile-application"><summary><span className="reconcile-application-title">Заявка № {app.number}<small>{app.date}{app.dealerName ? ' · ' + app.dealerName : ''}</small></span><span className="reconcile-document-state">{app.state}</span><span className="reconcile-application-brief"><b>{n(app.constructions)}</b> констр. у заявці → замовлень: <b>{n(app.orders.length)}</b> / констр.: <b>{n(app.orderConstructions)}</b></span></summary><div className="reconcile-application-body"><dl className="reconcile-application-metrics"><div><dt>Конструкцій у заявці</dt><dd>{n(app.constructions)}</dd></div><div><dt>Замовлень із цієї заявки</dt><dd>{n(app.orders.length)}</dd></div><div><dt>Конструкцій у замовленнях</dt><dd>{n(app.orderConstructions)}</dd></div><div><dt>Підтверджених конструкцій</dt><dd>{n(app.confirmedOrderConstructions)}</dd></div></dl>{app.orders.length ? <><StatusTable compact title="Замовлення цієї заявки за статусами" rows={app.orderStatuses || statusBreakdown(app.orders)} /><h4>Номери та кількість конструкцій</h4><OrderTable orders={app.orders} /></> : <p>У цієї заявки ще немає пов’язаних замовлень.</p>}</div></details>)}{pageCount > 1 && <nav className="reconcile-pagination" aria-label="Сторінки заявок"><button disabled={page === 0} onClick={() => changePage(page - 1)}>Назад</button><span>{page + 1} / {pageCount}</span><button disabled={page === pageCount - 1} onClick={() => changePage(page + 1)}>Далі</button></nav>}</div>;
}
function ConstructionsChart({ totals }) {
  const values = [['У заявках / прорахунках', totals.applicationConstructions, 'new'], ['У пов’язаних замовленнях усіх статусів', totals.linkedConstructions, 'linked'], ['Із них у підтверджених замовленнях', totals.confirmedLinkedConstructions, 'confirmed']];
  const max = Math.max(1, ...values.map(value => value[1]));
  return <div className="reconcile-comparison">{values.map(([label, value, color]) => <div key={label}><span>{label}</span><div><i className={`reconcile-${color}`} style={{ width: `${100 * value / max}%` }} /><b>{n(value)}</b></div></div>)}</div>;
}
export default function DealerReconciliationPage() {
  const { isSuperAdmin, isLoading } = useDealerContext();
  const today = localDay(new Date());
  const [dates, setDates] = useState({ date_from: today.slice(0, 8) + '01', date_to: today, activity_from: activityStart(today) });
  const [report, setReport] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [exporting, setExporting] = useState(false), [filters, setFilters] = useState({ region: '', search: '', group: '', contractor: '' });
  const [selected, setSelected] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState('');
  const controller = useRef(null), closeRef = useRef(null), dialogRef = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!selected) return;
    const before = document.activeElement;
    closeRef.current?.focus();
    const key = e => {
      if (e.key === 'Escape') setSelected(null);
      if (e.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), summary, input, select, a[href], [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
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
      if (!active.signal.aborted) { setReport(data); setFilters({ region: '', search: '', group: '', contractor: '' }); }
    } catch (err) {
      if (!active.signal.aborted) setError(err.response?.data?.detail || 'Не вдалося сформувати звіт. Спробуйте ще раз.');
    } finally { if (!active.signal.aborted) setBusy(false); }
  }
  async function download(type, dataset = 'documents') {
    setExporting(true); setError('');
    try {
      const response = await axios.get('/dealer-reconciliation/', { params: { snapshot: report.snapshot, export: type, dataset, ...filters }, responseType: 'blob', timeout: 180000 });
      const href = URL.createObjectURL(response.data), a = document.createElement('a');
      a.href = href; a.download = `${dataset === 'applications' ? 'Заявки_замовлення' : 'Звіт_керівника'}_${report.period.from}_${report.period.to}.${type}`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (err) {
      let message = 'Не вдалося завантажити файл.';
      try { message = JSON.parse(await err.response.data.text()).detail || message; } catch { /* Network response may have no body. */ }
      setError(message);
    } finally { setExporting(false); }
  }
  const rows = useMemo(() => filterReconciliation(report?.rows || [], filters), [report, filters]);
  const totals = useMemo(() => summarizeReconciliation(rows), [rows]);
  const regions = useMemo(() => [...new Set(rows.map(row => row.region))].sort().map(name => ({ name, ...summarizeReconciliation(rows.filter(row => row.region === name)) })), [rows]);
  const applications = useMemo(() => rows.flatMap(row => row.applicationDetails.map(app => ({ ...app, dealerName: row.name }))).filter(app => !applicationSearch.trim() || [app.number, app.dealerName, ...app.orders.map(order => order.number)].join(' ').toLocaleLowerCase('uk-UA').includes(applicationSearch.trim().toLocaleLowerCase('uk-UA'))), [rows, applicationSearch]);
  if (isLoading) return <p>Завантаження…</p>;
  if (!isSuperAdmin) return <p role="alert">Звіт усіх дилерів доступний лише адміністратору.</p>;
  return <main className="reconcile-page">
    <header><p className="reconcile-eyebrow">Аналітика · Новий портал</p><h1>Звіт керівника: заявки, замовлення, статуси</h1><p>Заявки (прорахунки) нового порталу, пов’язані замовлення та кількість конструкцій за статусами.</p></header>
    <form className="reconcile-panel reconcile-controls" onSubmit={generate} aria-busy={busy}>
      <label>Звіт з<input type="date" required min="2000-01-01" max={dates.date_to} value={dates.date_from} onChange={e => setDates({ ...dates, date_from: e.target.value })} /></label>
      <label>По<input type="date" required min={dates.date_from} max={today} value={dates.date_to} onChange={e => setDates({ ...dates, date_to: e.target.value, activity_from: activityStart(e.target.value) })} /></label>
      <label>Активність дилерів з<input type="date" required min="2000-01-01" max={dates.date_from} value={dates.activity_from} onChange={e => setDates({ ...dates, activity_from: e.target.value })} /></label>
      <button type="submit" className="reconcile-generate" disabled={busy || exporting}>{busy ? 'Формування…' : 'Сформувати звіт'}</button>
    </form>
    {error && <p className="reconcile-error" role="alert">{error}</p>}
    {report && <>
      <div className="reconcile-toolbar"><span>Сформовано {new Date(report.generatedAt).toLocaleString('uk-UA')} · {report.period.from} — {report.period.to} · Усі статуси документів</span><button disabled={busy || exporting} onClick={() => download('pdf')}>{exporting ? 'Підготовка…' : 'Завантажити PDF'}</button><button disabled={busy || exporting} onClick={() => download('csv', 'applications')}>Заявки та замовлення · CSV</button><button disabled={busy || exporting} onClick={() => download('csv')}>Документи · CSV</button></div>
      <p>Статуси актуальні на момент формування. Документи з позначкою видалення не враховано; непроведені документи включено.</p>
      <div className="reconcile-panel reconcile-controls">
        <label>Група<select value={filters.group} onChange={e => setFilters({ ...filters, group: e.target.value, region: '', contractor: '' })}><option value="">Усі групи</option>{[...new Set(report.rows.map(row => row.dealerGroup).filter(Boolean))].sort().map(group => <option key={group}>{group}</option>)}</select></label>
        <label>Дилер / філіал<select value={filters.contractor} onChange={e => setFilters({ ...filters, contractor: e.target.value })}><option value="">Усі</option>{report.rows.filter(row => (!filters.group || row.dealerGroup === filters.group) && (!filters.region || row.region === filters.region)).map(row => <option key={row.guid} value={row.guid}>{row.name}</option>)}</select></label>
        <label>Область / філіал<select value={filters.region} onChange={e => setFilters({ ...filters, region: e.target.value, contractor: '' })}><option value="">Усі</option>{report.regions.map(region => <option key={region.name}>{region.name}</option>)}</select></label>
        <label>Дилер<input type="search" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Назва або GUID" /></label><button onClick={() => setFilters({ region: '', search: '', group: '', contractor: '' })}>Скинути</button>
      </div>
      <section className="reconcile-panel"><h2>Із заявок у замовлення</h2><p className="reconcile-result-summary">Заявок: <b>{n(totals.applications)}</b>. Із замовленнями: <b>{n(totals.applicationsWithOrders)}</b>. Пов’язаних замовлень: <b>{n(totals.linkedOrders)}</b>.</p><div className="reconcile-stages">{[['Заявки / прорахунки', totals.applications, totals.applicationConstructions], ['Замовлення із цих заявок', totals.linkedOrders, totals.linkedConstructions], ['Із них «Подтверждено»', totals.confirmedLinkedOrders, totals.confirmedLinkedConstructions]].map(([label, count, quantity]) => <article key={label}><h3>{label}</h3><strong>{n(count)} <small>документів</small></strong><span><b>{n(quantity)}</b> конструкцій</span></article>)}</div><ConstructionsChart totals={totals} /><p>Заявок без замовлень: <b>{n(totals.withoutOrders)}</b>. Конверсія заявок у підтверджені замовлення: <b>{totals.conversion.toFixed(1)}%</b>.</p></section>
      <StatusTable title="Заявки / прорахунки за статусами" rows={totals.applicationStatuses} />
      <StatusTable title="Пов’язані замовлення за статусами" rows={totals.orderStatuses} /><p>Власний статус заявки та статуси її замовлень зберігаються окремо; їхні підсумки можуть відрізнятися.</p>
      <section className="reconcile-panel"><h2>Області та філіал</h2><ComparisonTable rows={regions} onRegion={region => setFilters({ ...filters, region })} /></section>
      <section className="reconcile-panel"><h2>Порівняння за дилерами</h2><p>Натисніть дилера для перегляду статусів заявок і кожного пов’язаного замовлення.</p><ComparisonTable key={filters.region + filters.search} rows={rows} dealer onDealer={setSelected} />{!rows.length && <p>За цим відбором дилерів немає.</p>}</section>
      <section className="reconcile-panel"><h2>Кожна заявка та її замовлення</h2><label className="reconcile-application-search">Знайти заявку, замовлення або дилера<input type="search" value={applicationSearch} onChange={event => setApplicationSearch(event.target.value)} placeholder="Номер або назва дилера" /></label><ApplicationTable key={filters.region + filters.search + applicationSearch} rows={applications} /></section>
      <section className="reconcile-panel"><h2>Контроль за датою замовлення</h2><p>Усі документи замовлень у 1С: <b>{n(totals.total)}</b> / <b>{n(totals.orderConstructions)}</b> констр. Із них «Подтверждено»: <b>{n(totals.confirmedOrders)}</b> / <b>{n(totals.confirmedConstructions)}</b> констр.</p><p>Віднесено до нового порталу: <b>{n(totals.newOrders)}</b> / <b>{n(totals.newConstructions)}</b> констр. Тут відбір за датою замовлення; головні показники вище — за датою заявки.</p><StatusTable compact title="Усі замовлення за статусами за обраний період" rows={totals.periodOrderStatuses} /></section>
    </>}
    {selected && <div className="reconcile-overlay" onClick={() => setSelected(null)}><section ref={dialogRef} className="reconcile-dialog" role="dialog" aria-modal="true" aria-label={selected.name} onClick={e => e.stopPropagation()}><button ref={closeRef} className="reconcile-close" onClick={() => setSelected(null)}>Закрити</button><h2>{selected.name}</h2><p>{selected.path}</p><p>GUID: {selected.guid}</p><h3>Заявки / прорахунки та замовлення</h3><p>У підсумках кожне замовлення враховане один раз, навіть якщо воно пов’язане з кількома заявками.</p><ApplicationTable rows={selected.applicationDetails} />{!selected.applicationDetails.length && <p>Немає заявок нового порталу за звітний період.</p>}<h3>Замовлення за датою документа</h3><StatusTable compact title="Усі замовлення дилера за статусами" rows={statusBreakdown(selected.orders)} /><OrderTable orders={selected.orders} /></section></div>}
  </main>;
}

