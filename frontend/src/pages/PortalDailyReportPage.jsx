import reportLogo from '../assets/icons/logo-vst.svg';
import { useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import { useDealerContext } from '../hooks/useDealerContext';
import './DealerReconciliationPage.css';
import './PortalDailyReportPage.css';

const zone = 'Europe/Kyiv';
const dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: zone });
const timeFormat = new Intl.DateTimeFormat('uk-UA', { timeZone: zone, dateStyle: 'long', timeStyle: 'medium' });
const clockFormat = new Intl.DateTimeFormat("uk-UA", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const processingStatus = "0XA267AAA90D55301D4E455425612DA59E";

const orderStatusLabels = {
  'Подтверждено': 'Підтверджені',
  'Ждем подтверждения': 'Очікують підтвердження',
  'Ждем оплати': 'Очікують оплату',
  'Ждем оплаты': 'Очікують оплату',
};

export default function PortalDailyReportPage() {
  const { isLoading, isSuperAdmin } = useDealerContext();
  const today = dayFormat.format(new Date());
  const [dates, setDates] = useState(() => ({ from: today, to: today }));
  const [period, setPeriod] = useState(dates);
  const [loadingReport, setLoadingReport] = useState(true);

  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const reportElement = useRef(null);
  const [detail, setDetail] = useState(null);
  const dialog = useRef(null);
  useEffect(() => { if (detail) dialog.current?.showModal(); }, [detail]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    const controller = new AbortController();
    setLoadingReport(true);
    setReport(null);
    setDetail(null);
    setError('');
    setDownloadError('');
    axios.get('/dealer-reconciliation/', {
      params: { date_from: period.from, date_to: period.to, daily: 1 },
      signal: controller.signal,
      timeout: 180000,
    }).then(({ data }) => {
      if (!controller.signal.aborted) setReport(data);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.response?.data?.detail || 'Не вдалося сформувати денний звіт.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoadingReport(false);
    });
    return () => controller.abort();
  }, [isSuperAdmin, period]);

  if (isLoading) return <p>Завантаження…</p>;
  if (!isSuperAdmin) return <p role="alert">Звіт доступний лише адміністратору.</p>;

  const totals = report?.totals;

  const applications = report?.rows.flatMap(row => row.applicationDetails.map(app => ({
    ...app,
    dealer: row.name,
  }))) ?? [];
  const orderTimes = new Map();
  for (const app of applications) {
    for (const [guid, minutes] of Object.entries(app.orderProcessingMinutes ?? {})) {
      orderTimes.set(guid, Math.min(orderTimes.get(guid) ?? minutes, minutes));
    }
  }
  const averageOrderTime = orderTimes.size
    ? Math.round([...orderTimes.values()].reduce((sum, minutes) => sum + minutes, 0) / orderTimes.size)
    : null;
  const averageOrderLabel = 'Середній час оформлення замовлення';

  const mismatches = applications.filter(app => app.orders.length > 0 && app.constructions !== app.orderConstructions);
  const processingWithoutPostedOrders = applications.filter(app =>
    app.stateGuid === processingStatus && !app.orders.some(order => order.posted)
  );

  const newProcessingApplications = processingWithoutPostedOrders.filter(app => app.orders.length === 0);
  const overnightLabel = "Подані вчора — оформлені сьогодні";
  const overnight = report?.overnightApplications ?? [];
  const pendingLabel = 'З учора без замовлень';
  const refusedLabel = 'Автовідхилено за період';
  const movement = report?.dailyMovements;
  const matches = detail ? (detail.label === overnightLabel ? overnight : detail.label === pendingLabel ? report.previousDayPendingApplications ?? [] : detail.label === refusedLabel ? report.autoRefusedOrders ?? [] : applications.filter(detail.filter)) : [];
  const newApplicationConstructions = applications.reduce((sum, app) => sum + (app.orders.length === 0 ? app.constructions : 0), 0);

  async function downloadPdf() {
    setDownloading(true);
    setDownloadError('');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const copy = reportElement.current.cloneNode(true);
      copy.classList.add('daily-pdf-export');
      copy.querySelector('dialog')?.remove();

      await html2pdf().set({
        margin: 12,
        filename: 'Портал-за-день-' + [...new Set([report.period.from, report.period.to])].join('_') + '.pdf',
        jsPDF: { unit: 'mm', format: 'a4' },
        html2canvas: { scale: 2, backgroundColor: '#fff' },
        pagebreak: { avoid: ['.daily-print-flow', '.daily-print-chart'] },
      }).from(copy).save();
    } catch {
      setDownloadError('Не вдалося завантажити PDF.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main ref={reportElement} className="reconcile-page portal-daily-report">
      <img className="daily-pdf-logo" src={reportLogo} alt="Вікна Стиль" />
      <span className="reconcile-eyebrow">Звіти · Новий портал</span>
      <h1>Портал за день</h1>
      <form className="daily-report-filters portal-daily-print" onSubmit={event => {
        event.preventDefault();
        setPeriod({ ...dates });
      }}>
        <label>З<input type="date" required max={dates.to || today} value={dates.from} onChange={event => setDates({ ...dates, from: event.target.value })} /></label>
        <label>По<input type="date" required min={dates.from} max={today} value={dates.to} onChange={event => setDates({ ...dates, to: event.target.value })} /></label>
        <button type="submit" disabled={loadingReport || downloading}>Сформувати звіт</button>
      </form>
      {report && <div className="daily-report-actions portal-daily-print"><button type="button" onClick={() => window.print()}>Друк</button> <button type="button" onClick={downloadPdf} disabled={downloading}>{downloading ? "Готуємо PDF…" : "Завантажити PDF"}</button></div>}
      {downloadError && <p className="portal-daily-print" role="alert">{downloadError}</p>}
      {error && <p role="alert">{error}</p>}
      {!error && !report && <p role="status">Формуємо денний звіт…</p>}
      {report && <>
        <p><strong>Період</strong> {report.period.from.split("-").reverse().join(".")} 00:00:00 — {report.period.to.split("-").reverse().join(".")} {report.period.to === dayFormat.format(new Date(report.generatedAt)) ? clockFormat.format(new Date(report.generatedAt)) : "23:59:59"} · за Києвом</p>
        <p>Станом на {timeFormat.format(new Date(report.generatedAt))}</p>
        <section className="reconcile-panel">
          <h2>Основні показники</h2>
          <dl className="reconcile-application-metrics">
            {[
              ['Дилери із заявками', report.rows.filter(row => row.applications > 0).length],
              ['Заявки / прорахунки', totals.applications],
              ['Конструкції в заявках', totals.applicationConstructions, app => app.constructions > 0],
              ['Заявки без замовлень', totals.withoutOrders, app => !app.orders.length],
              [averageOrderLabel, averageOrderTime === null ? '—' : averageOrderTime + ' хв', app => Object.entries(app.orderProcessingMinutes ?? {}).some(([guid, minutes]) => orderTimes.get(guid) === minutes)],
              ['Пов’язані замовлення', totals.linkedOrders, app => app.orders.length > 0],
              ['Конструкції в замовленнях', totals.linkedConstructions, app => app.orders.some(order => order.constructions > 0)],
              ['Підтверджені замовлення', totals.confirmedLinkedOrders, app => app.orders.some(order => order.confirmed)],
              ['Конструкції в підтверджених замовленнях', totals.confirmedLinkedConstructions, app => app.orders.some(order => order.confirmed && order.constructions > 0)],
            ].map(([label, value, filter = () => true]) => (
              <div key={label} className={label === averageOrderLabel || label === overnightLabel || label === "Дилери із заявками" ? undefined : "daily-screen-metric"}>
                <dt>{label}</dt><dd><button type="button" className="daily-metric" aria-expanded={detail?.label === label} aria-controls={detail?.label === label ? 'daily-metric-details' : undefined} onClick={() => setDetail(current => current?.label === label ? null : { label, filter })} aria-label={label + " · " + value}>{value}</button></dd>
              </div>
            ))}
          </dl>
        </section>
        {detail && <dialog ref={dialog} id="daily-metric-details" className="reconcile-dialog daily-metric-details" aria-labelledby="daily-detail-title" onClose={() => setDetail(null)}><button className="reconcile-close" type="button" onClick={() => dialog.current.close()}>Закрити</button>
          <h2 id="daily-detail-title">{detail.label} · {matches.length} {detail.label === refusedLabel ? 'замовлень' : 'заявок'}</h2>
          {detail.label === refusedLabel ? <div className="reconcile-scroll"><table>
            <thead><tr><th>Дилер</th><th>Замовлення</th><th>Конструкцій</th><th>Заявки</th><th>Дата відхилення</th><th>Менеджер</th><th>Причина</th></tr></thead>
            <tbody>{matches.map(order => <tr key={order.guid}><td>{order.dealer}</td><td>{order.number}</td><td>{order.constructions}</td><td>{order.applications.map(app => app.number + ' · ' + app.date.slice(0, 10)).join(', ')}</td><td>{order.events.map(event => event.date).join(', ')}</td><td>{[...new Set(order.events.map(event => event.manager || '—'))].join(', ')}</td><td>{[...new Set(order.events.map(event => event.reason))].join('; ')}</td></tr>)}</tbody>
          </table></div> : <div className="reconcile-scroll">
            <table>
              <thead><tr><th>Дилер</th><th>№ заявки / дата подання</th><th>Конструкцій у заявці</th><th>Пов’язані замовлення</th><th>Менеджер</th><th>{detail.label === averageOrderLabel ? "Час оформлення за замовленнями" : "Час до останнього замовлення"}</th></tr></thead>
              <tbody>{matches.map(app => <tr key={app.guid}>
                <td>{app.dealer}</td><td>{app.number}<br />{app.date}</td><td>{app.constructions}</td>
                <td>{app.orders.map(order => order.number + (order.createdAt ? ' · ' + order.createdAt : '')).join(', ') || '—'}</td>
                <td>{[...new Set(app.orders.map(order => order.manager).filter(Boolean))].join(', ') || '—'}</td>
                <td>{detail.label === averageOrderLabel ? app.orders.filter(order => Number.isFinite(app.orderProcessingMinutes?.[order.guid]) && orderTimes.get(order.guid) === app.orderProcessingMinutes[order.guid]).map(order => order.number + ' · ' + Math.round(app.orderProcessingMinutes[order.guid]) + ' хв').join(', ') : Number.isFinite(app.processingMinutes) ? Math.round(app.processingMinutes) + ' хв' : '—'}</td>
              </tr>)}</tbody>
            </table>
          </div>}
          {!matches.length && <p>Документів за цим показником немає.</p>}
        </dialog>}
        <section className="reconcile-panel daily-screen-status">
          <h2>Пов’язані замовлення за статусами</h2>
          <table>
            <thead><tr><th scope="col">Статус</th><th scope="col">Замовлень</th><th scope="col">Конструкцій</th></tr></thead>
            <tbody>{totals.orderStatuses.map(row => <tr key={row.guid}><td>{orderStatusLabels[row.name] ?? row.name}</td><td>{row.documents}</td><td>{row.constructions}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Усього</th><td>{totals.linkedOrders}</td><td>{totals.linkedConstructions}</td></tr></tfoot>
          </table>
        </section>
        <section className="reconcile-panel daily-screen-status">
          <h2>Розбіжності в конструкціях · {mismatches.length}</h2>
          {mismatches.length ? <div className="reconcile-scroll"><table>
            <thead><tr><th>Дилер</th><th>№ заявки</th><th>У заявці</th><th>У замовленнях</th><th>Різниця (замовлення − заявка)</th><th>Пов’язані замовлення</th></tr></thead>
            <tbody>{mismatches.map(app => <tr key={app.guid}>
              <td>{app.dealer}</td><td>{app.number}</td><td>{app.constructions}</td><td>{app.orderConstructions}</td>
              <td className="reconcile-quantity-mismatch">{app.orderConstructions - app.constructions}</td>
              <td>{app.orders.map(order => order.number).join(', ')}</td>
            </tr>)}</tbody>
          </table></div> : <p>Розбіжностей серед заявок із замовленнями немає.</p>}
        </section>
        <section className="reconcile-panel daily-screen-status">
          <h2>Заявки в обробці без проведених замовлень · {processingWithoutPostedOrders.length}</h2>
          {processingWithoutPostedOrders.length ? <div className="reconcile-scroll"><table>
            <thead><tr><th>Дилер</th><th>№ заявки</th><th>Конструкцій</th><th>Що видно у звіті</th><th>Пов’язані замовлення</th></tr></thead>
            <tbody>{processingWithoutPostedOrders.map(app => <tr key={app.guid}>
              <td>{app.dealer}</td><td>{app.number}</td><td>{app.constructions}</td>
              <td>{app.orders.length ? 'Пов’язані замовлення не проведені' : 'Пов’язаних замовлень немає'}</td>
              <td>{app.orders.map(order => order.number).join(', ') || '—'}</td>
            </tr>)}</tbody>
          </table></div> : <p>Таких заявок немає.</p>}
        </section>
      </>}
      {report && <div className="daily-print-details">
        <section className="daily-print-flow" aria-label="Розподіл заявок">
          <div className="daily-print-root"><strong>{totals.applications}</strong> заявок · <strong>{totals.applicationConstructions}</strong> конструкцій</div>
          <div className="daily-print-branches">
            <section className="daily-print-new">
              <h3>Неопрацьовані заявки</h3>
              <p><strong>{totals.withoutOrders}</strong> заявок · <strong>{newApplicationConstructions}</strong> конструкцій</p>
              <p>Без пов’язаних замовлень</p>
              <p>З них в обробці · <strong>{newProcessingApplications.length}</strong> заявок · <strong>{newProcessingApplications.reduce((sum, app) => sum + app.constructions, 0)}</strong> конструкцій</p>
            </section>
            <section className="daily-print-formed">
              <h3>Оформлені заявки</h3>
              <p><strong>{totals.applicationsWithOrders}</strong> заявок · <strong>{totals.applicationConstructions - newApplicationConstructions}</strong> конструкцій у заявках</p>
              <p><strong>{totals.linkedOrders}</strong> замовлень · <strong>{totals.linkedConstructions}</strong> конструкцій</p>
              <section className="daily-print-chart">
                <h4>Розбивка замовлень за статусами</h4>
                {[...totals.orderStatuses].sort((a, b) => (b.documents ?? 0) - (a.documents ?? 0)).map(row => <div key={row.guid}>
                  <span>{orderStatusLabels[row.name] ?? row.name}</span>
                  <span className="daily-print-bar" aria-hidden="true"><i style={{ width: 100 * (row.documents ?? 0) / Math.max(1, ...totals.orderStatuses.map(status => status.documents ?? 0)) + "%" }} /></span>
                  <span>{row.documents ?? 0} зам. · {row.constructions ?? 0} констр.</span>
                </div>)}
              </section>
            </section>
          </div>
        </section>

      </div>}
      {report && <>
        <section className="reconcile-panel daily-movements">
          <h2>Рух заявок за період</h2>
          {movement ? <div className="daily-movement-grid">
            <article><h3>{refusedLabel}</h3>
              <button type="button" className="daily-metric" onClick={() => setDetail({ label: refusedLabel })}>{movement.autoRefused.orders} замовлень · {movement.autoRefused.orderConstructions} конструкцій</button>
              <p>{movement.autoRefused.applications} пов’язаних заявок · {movement.autoRefused.applicationConstructions} конструкцій у заявках</p>
              {movement.autoRefused.reasons.map(reason => <p key={reason.name}>{reason.name}: {reason.orders}</p>)}
            </article>
            <article><h3>{overnightLabel}</h3>
              <button type="button" className="daily-metric" onClick={() => setDetail({ label: overnightLabel })}>{movement.overnight.applications} заявок · {movement.overnight.applicationConstructions} конструкцій</button>
              <p>{movement.overnight.orders} замовлень · {movement.overnight.orderConstructions} конструкцій у замовленнях</p>
            </article>
            <article><h3>{pendingLabel}</h3>
              <button type="button" className="daily-metric" onClick={() => setDetail({ label: pendingLabel })}>{movement.previousDayPending.applications} заявок · {movement.previousDayPending.applicationConstructions} конструкцій</button>
              {!!report.previousDayPendingApplications?.length && <ul className="daily-carryover-list">{report.previousDayPendingApplications.map(app => <li key={app.guid}><strong>№ {app.number}</strong> · {app.dealer} · {app.constructions} констр.</li>)}</ul>}
            </article>
          </div> : <p role="status">Оновіть звіт, щоб завантажити рух заявок.</p>}

        </section>

      </>}
    </main>
  );
}




