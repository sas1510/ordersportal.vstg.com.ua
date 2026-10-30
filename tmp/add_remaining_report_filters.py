from pathlib import Path
r=Path('/var/www/html/ordersportal.vstg.com.ua')
for name in ['OrdersReportPage.jsx','OrdersStatusAttentionReportPage.jsx']:
 p=r/'frontend/src/pages'/name;s=p.read_text(encoding='utf-8-sig')
 s='import DealerSelectWithAll from "./DealerSelectWithAll";\nimport { dealerGroupForSelection, DEALER_REPORT_GROUP_OPTIONS } from "../utils/dealerReportGroups";\nimport { belongsToDealerGroup } from "../utils/reportDataset";\n'+s
 if name=='OrdersReportPage.jsx':s='import { useDealerContext } from "../hooks/useDealerContext";\n'+s
 s=s.replace('  const [calculations, setCalculations] = useState([]);','''  const [allCalculations, setCalculations] = useState([]);
  const [selection, setSelection] = useState("__ALL__");
  const calculations = useMemo(() => allCalculations.filter(calc => selection === "__ALL__" || (dealerGroupForSelection(selection) ? belongsToDealerGroup(calc, dealerGroupForSelection(selection)) : String(calc.dealerId || '').toLowerCase() === selection.toLowerCase())), [allCalculations, selection]);''')
 if name=='OrdersReportPage.jsx':s=s.replace('  const [dateFrom, setDateFrom]', '  const { isAdmin, role } = useDealerContext();\n  const [dateFrom, setDateFrom]')
 condition='isAdmin' if name=='OrdersReportPage.jsx' else 'canUseDealerGroups'
 s=s.replace('<div className="orders-report__filters">','<div className="orders-report__filters">\n          {'+condition+' && <div><span>Дилер / філіал</span><DealerSelectWithAll value={selection} onChange={setSelection} extraOptions={'+ ('["admin", "director"].includes(role) ? DEALER_REPORT_GROUP_OPTIONS : []' if name=='OrdersReportPage.jsx' else '[]')+'} /></div>}',1)
 p.write_text(s,encoding='utf-8')
print('Legacy and attention report dealer filters added')
