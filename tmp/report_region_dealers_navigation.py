from pathlib import Path
p=Path('frontend/src/pages/OrdersReportDashboardPage.jsx');s=p.read_text(encoding='utf-8-sig')
needle='  const [selectedRegionName, setSelectedRegionName] = useState(ALL_REGIONS_VALUE);'
assert needle in s
s=s.replace(needle,needle+'''
  const allDealersPanelRef = useRef(null);
  const openRegionDealers = useCallback(function (regionName) {
    setSelectedRegionName(normalizeRegionName(regionName));
    window.requestAnimationFrame(function () {
      allDealersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);''',1)
needle='<Pie data={regionChartData} dataKey="turnover" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={56} paddingAngle={2}>'
assert needle in s
s=s.replace(needle,'<Pie data={regionChartData} dataKey="turnover" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={56} paddingAngle={2} onClick={function (entry) { if (entry?.name) openRegionDealers(entry.name); }} style={{ cursor: "pointer" }}>',1)
needle='<div key={item.name} className="orders-dashboard__legend-item">'
assert needle in s
s=s.replace(needle,'<button type="button" key={item.name} className="orders-dashboard__legend-item orders-dashboard__region-link" onClick={function () { openRegionDealers(item.name); }} aria-label={"Показати дилерів: " + item.name}>',1)
start=s.index('className="orders-dashboard__legend-item orders-dashboard__region-link"')
end=s.index('</div>',start)
s=s[:end]+s[end:].replace('</div>','</button>',1)
needle='<td>{normalizeRegionName(item.region_name) || "—"}</td>'
# The region aggregate table is distinct from the dealer rows, which wrap the cell in hideDealerRegions.
start=s.index('{activeRegions.length ? activeRegions.map')
end=s.index('}) : (',start)
chunk=s[start:end]
assert needle in chunk
chunk=chunk.replace(needle,'''<td><button type="button" className="dealer-reports-link" onClick={function () { openRegionDealers(item.region_name); }} aria-label={"Показати дилерів: " + normalizeRegionName(item.region_name)}>{normalizeRegionName(item.region_name) || "—"}</button></td>''',1)
s=s[:start]+chunk+s[end:]
needle='<section className="dealer-reports-panel dealer-reports-panel--full orders-dashboard__all-dealers-panel">'
assert needle in s
s=s.replace(needle,'<section ref={allDealersPanelRef} className="dealer-reports-panel dealer-reports-panel--full orders-dashboard__all-dealers-panel" style={{ scrollMarginTop: "100px" }}>',1)
needle='<h3>Всі дилери</h3>\n                    <span>Повний список доступних дилерів у вибраному періоді</span>'
assert needle in s
s=s.replace(needle,'''<h3>{selectedRegionName === ALL_REGIONS_VALUE ? "Всі дилери" : "Дилери — " + selectedRegionName}</h3>
                    <span>{selectedRegionName === ALL_REGIONS_VALUE ? "Повний список доступних дилерів у вибраному періоді" : "Лише дилери вибраної області"}</span>
                    {selectedRegionName !== ALL_REGIONS_VALUE && <button type="button" className="dealer-reports-link" onClick={function () { setSelectedRegionName(ALL_REGIONS_VALUE); }}>Всі області</button>}''',1)
p.write_text(s,encoding='utf-8')
p=Path('frontend/src/pages/OrdersReportDashboardPage.css');s=p.read_text(encoding='utf-8')
s+='\n.orders-dashboard__region-link{border:0;background:transparent;padding:0;font:inherit;text-align:left;cursor:pointer}.orders-dashboard__region-link:hover{text-decoration:underline}.orders-dashboard__region-link:focus-visible{outline:2px solid var(--header-accent,#6b98bf);outline-offset:4px;border-radius:3px}\n'
p.write_text(s,encoding='utf-8')
print('Region clicks select the existing scoped filter and scroll to that region’s dealer list; reset added.')
