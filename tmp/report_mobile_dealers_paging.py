from pathlib import Path
p=Path('frontend/src/pages/DealerReconciliationPage.jsx');s=p.read_text(encoding='utf-8-sig')
a=s.index('function ComparisonTable');b=s.index('\nfunction OrderTable',a)
chunk=s[a:b]
needle="  return <div className=\"reconcile-scroll\">"
assert needle in chunk
chunk=chunk.replace(needle,"""  const [requestedPage, setPage] = useState(0);
  const panelRef = useRef(null);
  const pageCount = dealer ? Math.max(1, Math.ceil(rows.length / 20)) : 1;
  const page = Math.min(requestedPage, pageCount - 1);
  const visible = dealer ? rows.slice(page * 20, (page + 1) * 20) : rows;
  function changePage(next) {
    setPage(next);
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  return <div ref={panelRef}>{dealer && <p>Дилерів: {n(rows.length)}</p>}<div className="reconcile-scroll">""",1)
chunk=chunk.replace('rows.map(row => <tr key={dealer','visible.map(row => <tr key={dealer',1)
chunk=chunk.replace('</tbody></table></div>;','</tbody></table></div>{dealer && pageCount > 1 && <nav className="reconcile-pagination" aria-label="Сторінки дилерів"><button disabled={page === 0} onClick={() => changePage(page - 1)}>Назад</button><span>{page + 1} / {pageCount}</span><button disabled={page === pageCount - 1} onClick={() => changePage(page + 1)}>Далі</button></nav>}</div>;',1)
s=s[:a]+chunk+s[b:]
s=s.replace('<ComparisonTable rows={rows} dealer onDealer={setSelected} />','<ComparisonTable key={filters.region + filters.search} rows={rows} dealer onDealer={setSelected} />')
p.write_text(s,encoding='utf-8')
