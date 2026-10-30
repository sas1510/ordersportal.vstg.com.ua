from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
def edit(path,fn):
 p=r/path;s=p.read_text(encoding='utf-8-sig');p.write_text(fn(s),encoding='utf-8')
# Expose the existing, authoritative folder classification without widening access.
def groups(s):
 s=s.replace('    try:\n        return str(UUID(str(value)))',"    if isinstance(value, str) and value.upper().startswith('0X') and len(value)==34:\n        value = bin_to_guid_1c(bytes.fromhex(value[2:]))\n    try:\n        return str(UUID(str(value)))")
 start=s.index('def filter_report_dealer_group(');end=s.index('\n\ndef dealer_folder_regions',start)
 block=s[start:end]
 body=block[block.index('    ids ='):block.index('    return [row')]
 helper='def dealer_group_map(rows, contractor_field):\n'+body+'    return classes\n\n\n'
 filtered="def filter_report_dealer_group(rows, group, contractor_field):\n    if not group or not rows:\n        return rows\n    classes = dealer_group_map(rows, contractor_field)\n"+block[block.index('    return [row'):]
 return s[:start]+helper+filtered+s[end:]
edit('backend/records/dealer_groups.py',groups)
edit('backend/users/views.py',lambda s:s.replace('        rows = get_accessible_dealer_rows(request.user)','''        rows = get_accessible_dealer_rows(request.user)
        if request.GET.get('report_groups') == '1':
            from records.dealer_groups import dealer_group_map, normalized_contractor
            classes = dealer_group_map(rows, 'ContractorID')
            rows = [{**dict(row), 'DealerGroup': classes.get(normalized_contractor(row.get('ContractorID')), 'Інше')} for row in rows]'''))
edit('backend/records/dealer_reconciliation.py',lambda s:s.replace("    report['generatedAt']=timezone.now().isoformat()", "    from .dealer_groups import dealer_group_map, normalized_contractor\n    classes=dealer_group_map(report['rows'],'guid')\n    for row in report['rows']:\n        row['dealerGroup']=classes.get(normalized_contractor(row['guid']),'Інше')\n    report['generatedAt']=timezone.now().isoformat()").replace("def filter_report(report,region='',search=''):","def filter_report(report,region='',search='',dealer_group='',contractor=''):").replace("if (not region or row['region']==region) and (not search", "if (not dealer_group or row.get('dealerGroup')==dealer_group) and (not contractor or row['guid']==contractor) and (not region or row['region']==region) and (not search"))
edit('backend/records/dealer_reconciliation_views.py',lambda s:s.replace("report=filter_report(report,region,request.GET.get('search','').strip())", "report=filter_report(report,region,request.GET.get('search','').strip(),request.GET.get('group',''),request.GET.get('contractor',''))"))
edit('frontend/src/utils/dealerReconciliation.js',lambda s:s.replace("(!filters.region || row.region === filters.region)","(!filters.group || row.dealerGroup === filters.group) && (!filters.contractor || row.guid === filters.contractor) && (!filters.region || row.region === filters.region)"))
def recon(s):
 s=s.replace("{ region: '', search: '' }","{ region: '', search: '', group: '', contractor: '' }")
 anchor='<label>Область / філіал<select'
 controls='''<label>Група<select value={filters.group} onChange={e => setFilters({ ...filters, group: e.target.value, region: '', contractor: '' })}><option value="">Усі групи</option>{[...new Set(report.rows.map(row => row.dealerGroup).filter(Boolean))].sort().map(group => <option key={group}>{group}</option>)}</select></label>
        <label>Дилер / філіал<select value={filters.contractor} onChange={e => setFilters({ ...filters, contractor: e.target.value })}><option value="">Усі</option>{report.rows.filter(row => (!filters.group || row.dealerGroup === filters.group) && (!filters.region || row.region === filters.region)).map(row => <option key={row.guid} value={row.guid}>{row.name}</option>)}</select></label>
        '''
 return s.replace(anchor,controls+anchor).replace("setFilters({ ...filters, region: e.target.value })","setFilters({ ...filters, region: e.target.value, contractor: '' })")
edit('frontend/src/pages/DealerReconciliationPage.jsx',recon)
edit('frontend/src/pages/OrdersReportDashboardPage.jsx',lambda s:"import { DEALER_REPORT_GROUP_OPTIONS } from '../utils/dealerReportGroups';\n"+s.replace('extraOptions={[]}','extraOptions={canUseDealerGroups ? DEALER_REPORT_GROUP_OPTIONS : []}'))
def dealer_reports(s):
 s='import DealerSelectWithAll from "./DealerSelectWithAll";\nimport { DEALER_REPORT_GROUP_OPTIONS, dealerGroupForSelection } from "../utils/dealerReportGroups";\n'+s
 s=s.replace('  const [loading, setLoading]', '  const [selection, setSelection] = useState("__ALL__");\n  const [loading, setLoading]')
 s=s.replace('date_to: searchParams.to,','date_to: searchParams.to,\n            dealer_group: dealerGroupForSelection(selection) || undefined,\n            contractor_guid: selection !== "__ALL__" && !dealerGroupForSelection(selection) ? selection : undefined,',1)
 s=s.replace('[contextLoading, isAdmin, searchParams]','[contextLoading, isAdmin, searchParams, selection]')
 s=s.replace('<section className="dealer-reports-toolbar">','<section className="dealer-reports-toolbar">\n        <div><span>Дилер / група</span><DealerSelectWithAll value={selection} onChange={setSelection} extraOptions={["admin", "director"].includes(role) ? DEALER_REPORT_GROUP_OPTIONS : []} /></div>',1)
 return s
edit('frontend/src/pages/DealerReportsPage.jsx',dealer_reports)
# A single-dealer report keeps its single-dealer semantics, narrowing its picker by group.
def picker(s):
 s=s.replace('({ value, onChange })','({ value, onChange, showGroupFilter = false })')
 s=s.replace('  const [dealers, setDealers] = useState([]);','  const [dealers, setDealers] = useState([]);\n  const [group, setGroup] = useState("");')
 s=s.replace('axiosInstance.get("/dealer-portal-users/")','axiosInstance.get("/dealer-portal-users/", { params: showGroupFilter ? { report_groups: 1 } : {} })')
 s=s.replace('  }, [t]);','  }, [t, showGroupFilter]);')
 s=s.replace('    d.ContractorName?.toLowerCase().includes(search.toLowerCase()),','    (!group || d.DealerGroup === group) && d.ContractorName?.toLowerCase().includes(search.toLowerCase()),')
 s=s.replace('<div className="dealer-select" ref={wrapperRef}>','''<div className="dealer-select" ref={wrapperRef}>
      {showGroupFilter && <select aria-label="Група дилерів" value={group} onChange={e => { setGroup(e.target.value); onChange(""); setOpen(false); }} style={{ width: '100%', minHeight: 40, marginBottom: 8 }}><option value="">Усі групи</option>{[...new Set(dealers.map(d => d.DealerGroup).filter(Boolean))].sort().map(g => <option key={g}>{g}</option>)}</select>}''')
 return s
edit('frontend/src/pages/DealerSelect.jsx',picker)
edit('frontend/src/pages/ProductionStatisticsPage.jsx',lambda s:s.replace('<DealerSelect value={dealerGuid}', '<DealerSelect showGroupFilter value={dealerGuid}'))
print('Report group controls and scoped classification added')
