from pathlib import Path
p=Path('frontend/src/pages/DealerReconciliationPage.jsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('localDay, activityStart }','localDay, activityStart, statusBreakdown }')
a=s.index('function StatusTable');b=s.index('export default function DealerReconciliationPage',a)
s=s[:a]+'''function StatusTable({ title, rows, compact = false }) {
  const total = rows.reduce((sum, row) => sum + row.documents, 0);
  const quantity = rows.reduce((sum, row) => sum + row.constructions, 0);
  const Heading = compact ? 'h4' : 'h2';
  return <section className={compact ? 'reconcile-status-group' : 'reconcile-panel'}><Heading>{title}</Heading><div className="reconcile-scroll"><table className="reconcile-stack-table"><thead><tr><th>Статус документа</th><th>Замовлень / документів</th><th>Частка документів</th><th>Конструкцій</th><th>Частка конструкцій</th></tr></thead><tbody>{rows.map(row => <tr key={row.guid}><td data-label="Статус">{row.name}</td><td data-label="Документів">{n(row.documents)}</td><td data-label="Частка документів">{percent(row.documents, total)}</td><td data-label="Конструкцій">{n(row.constructions)}</td><td data-label="Частка конструкцій">{percent(row.constructions, quantity)}</td></tr>)}</tbody><tfoot><tr><th data-label="Підсумок">Усього</th><th data-label="Документів">{n(total)}</th><th data-label="Частка документів">{percent(total, total)}</th><th data-label="Конструкцій">{n(quantity)}</th><th data-label="Частка конструкцій">{percent(quantity, quantity)}</th></tr></tfoot></table></div>{!rows.length && <p>Документів у відборі немає.</p>}</section>;
}
function ComparisonTable({ rows, dealer = false, onDealer, onRegion }) {
  const fields = [['applications', 'Заявок / прорахунків'], ['applicationConstructions', 'Конструкцій у заявках'], ['linkedOrders', 'Замовлень із заявок'], ['linkedConstructions', 'Конструкцій у замовленнях'], ['confirmedLinkedOrders', 'Підтверджених замовлень'], ['confirmedLinkedConstructions', 'Підтверджених конструкцій']];
  return <div className="reconcile-scroll"><table className="reconcile-stack-table"><thead><tr><th>{dealer ? 'Дилер' : 'Область / філіал'}</th>{fields.map(([key, label]) => <th key={key}>{label}</th>)}<th>Конверсія в підтвердження</th></tr></thead><tbody>{rows.map(row => <tr key={dealer ? row.guid : row.name}><td data-label={dealer ? 'Дилер' : 'Область / філіал'}><button className="reconcile-link" onClick={() => dealer ? onDealer(row) : onRegion(row.name)}>{row.name}</button></td>{fields.map(([field, label]) => <td key={field} data-label={label}>{n(row[field])}</td>)}<td data-label="Конверсія">{percent(row.convertedApplications, row.applications)}</td></tr>)}</tbody></table></div>;
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
  return <div className="reconcile-applications" ref={listRef}><p>Заявок: <b>{n(rows.length)}</b>. Відкрийте заявку, щоб побачити її замовлення та конструкції за статусами.</p>{rows.slice(page * 20, (page + 1) * 20).map(app => <details key={app.guid} className="reconcile-application"><summary><span className="reconcile-application-title">Заявка № {app.number}<small>{app.date}{app.dealerName ? ' · ' + app.dealerName : ''}</small></span><span className="reconcile-document-state">{app.state}</span><span className="reconcile-application-brief"><b>{n(app.constructions)}</b> констр. у заявці → <b>{n(app.orders.length)}</b> замовлень / <b>{n(app.orderConstructions)}</b> констр.</span></summary><div className="reconcile-application-body"><dl className="reconcile-application-metrics"><div><dt>Конструкцій у заявці</dt><dd>{n(app.constructions)}</dd></div><div><dt>Замовлень із цієї заявки</dt><dd>{n(app.orders.length)}</dd></div><div><dt>Конструкцій у замовленнях</dt><dd>{n(app.orderConstructions)}</dd></div><div><dt>Підтверджених конструкцій</dt><dd>{n(app.confirmedOrderConstructions)}</dd></div></dl>{app.orders.length ? <><StatusTable compact title="Замовлення цієї заявки за статусами" rows={app.orderStatuses || statusBreakdown(app.orders)} /><h4>Номери та кількість конструкцій</h4><OrderTable orders={app.orders} /></> : <p>У цієї заявки ще немає пов’язаних замовлень.</p>}</div></details>)}{pageCount > 1 && <nav className="reconcile-pagination" aria-label="Сторінки заявок"><button disabled={page === 0} onClick={() => changePage(page - 1)}>Назад</button><span>{page + 1} / {pageCount}</span><button disabled={page === pageCount - 1} onClick={() => changePage(page + 1)}>Далі</button></nav>}</div>;
}
function ConstructionsChart({ totals }) {
  const values = [['У заявках / прорахунках', totals.applicationConstructions, 'new'], ['У пов’язаних замовленнях усіх статусів', totals.linkedConstructions, 'linked'], ['Із них у підтверджених замовленнях', totals.confirmedLinkedConstructions, 'confirmed']];
  const max = Math.max(1, ...values.map(value => value[1]));
  return <div className="reconcile-comparison">{values.map(([label, value, color]) => <div key={label}><span>{label}</span><div><i className={`reconcile-${color}`} style={{ width: `${100 * value / max}%` }} /><b>{n(value)}</b></div></div>)}</div>;
}
''' +s[b:]
s=s.replace("const [selected, setSelected] = useState(null);", "const [selected, setSelected] = useState(null);\n  const [applicationSearch, setApplicationSearch] = useState('');")
s=s.replace('closeRef = useRef(null);','closeRef = useRef(null), dialogRef = useRef(null);')
s=s.replace("if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); }", """if (e.key === 'Tab') {
        const focusable = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), summary, input, select, a[href], [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }""")
s=s.replace("async function download(type) {", "async function download(type, dataset = 'documents') {")
s=s.replace('export: type, ...filters','export: type, dataset, ...filters')
s=s.replace('a.download = `Звіт_керівника_${report.period.from}_${report.period.to}.${type}`;', "a.download = `${dataset === 'applications' ? 'Заявки_замовлення' : 'Звіт_керівника'}_${report.period.from}_${report.period.to}.${type}`;")
needle='  if (isLoading) return <p>Завантаження…</p>;'
s=s.replace(needle,"""  const applications = useMemo(() => rows.flatMap(row => row.applicationDetails.map(app => ({ ...app, dealerName: row.name }))).filter(app => !applicationSearch.trim() || [app.number, app.dealerName, ...app.orders.map(order => order.number)].join(' ').toLocaleLowerCase('uk-UA').includes(applicationSearch.trim().toLocaleLowerCase('uk-UA'))), [rows, applicationSearch]);
"""+needle)
s=s.replace('<form className="reconcile-panel reconcile-controls" onSubmit={generate}>','<form className="reconcile-panel reconcile-controls" onSubmit={generate} aria-busy={busy}>')
s=s.replace('<button type="submit" disabled={busy || exporting}>{busy ? \'Формування…\' : \'Сформувати\'}</button>','<button type="submit" className="reconcile-generate" disabled={busy || exporting}>{busy ? \'Формування…\' : \'Сформувати звіт\'}</button>')
s=s.replace('<button disabled={busy || exporting} onClick={() => download(\'csv\')}>Документи · CSV</button>', '<button disabled={busy || exporting} onClick={() => download(\'csv\', \'applications\')}>Заявки та замовлення · CSV</button><button disabled={busy || exporting} onClick={() => download(\'csv\')}>Документи · CSV</button>')
a=s.index('      <section className="reconcile-panel"><h2>Головні показники</h2>');b=s.index('\n      <StatusTable',a)
s=s[:a]+'''      <section className="reconcile-panel"><h2>Із заявок у замовлення</h2><p className="reconcile-result-summary">Із <b>{n(totals.applications)}</b> заявок замовлення мають <b>{n(totals.applicationsWithOrders)}</b>. До них прив’язано <b>{n(totals.linkedOrders)}</b> замовлень.</p><div className="reconcile-stages">{[['Заявки / прорахунки', totals.applications, totals.applicationConstructions], ['Замовлення із цих заявок', totals.linkedOrders, totals.linkedConstructions], ['Із них «Подтверждено»', totals.confirmedLinkedOrders, totals.confirmedLinkedConstructions]].map(([label, count, quantity]) => <article key={label}><h3>{label}</h3><strong>{n(count)} <small>документів</small></strong><span><b>{n(quantity)}</b> конструкцій</span></article>)}</div><ConstructionsChart totals={totals} /><p>Заявок без замовлень: <b>{n(totals.withoutOrders)}</b>. Конверсія заявок у підтверджені замовлення: <b>{totals.conversion.toFixed(1)}%</b>.</p></section>''' +s[b:]
needle='      <section className="reconcile-panel"><h2>Контроль за датою замовлення</h2>'
s=s.replace(needle,'''      <section className="reconcile-panel"><h2>Кожна заявка та її замовлення</h2><label className="reconcile-application-search">Знайти заявку, замовлення або дилера<input type="search" value={applicationSearch} onChange={event => setApplicationSearch(event.target.value)} placeholder="Номер або назва дилера" /></label><ApplicationTable key={filters.region + filters.search + applicationSearch} rows={applications} /></section>
'''+needle,1)
s=s.replace('<section className="reconcile-dialog" role="dialog"','<section ref={dialogRef} className="reconcile-dialog" role="dialog"',1)
a=s.index('<h3>Замовлення за датою документа</h3>');b=s.index('</section></div>}',a)
s=s[:a]+'<h3>Замовлення за датою документа</h3><OrderTable orders={selected.orders} />'+s[b:]
p.write_text(s,encoding='utf-8')
print('Mobile cards, explicit application-to-order totals, paginated per-application status detail and export added.')
