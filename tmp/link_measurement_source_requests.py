from pathlib import Path
p=Path('/var/www/html/ordersportal.vstg.com.ua/backend/records/calculation_metadata.py');s=p.read_text(encoding='utf-8-sig');s=s.replace('from uuid import UUID','import re\nfrom urllib.parse import urlencode\nfrom uuid import UUID')
s=s.replace("        calc['measurementUrl']=None", "        calc['measurementUrl']=None\n        calc['measurementDealerId']=None\n        calc['measurementNumber']=None",1)
s=s.replace('    numbers={};sources={}', '    if not ids:\n        return calculations\n    numbers={};sources={}')
s=s.replace("JSON_VALUE(ResponseBody, '$._measurement_telegram.payload.measurement_order_url')", "JSON_VALUE(ResponseBody, '$._measurement_telegram.payload.order_number'),\n                JSON_VALUE(ResponseBody, '$._measurement_telegram.payload.user_id')")
s=s.replace('            for guid,url in cursor.fetchall():sources[str(guid).lower()]=url', '''            for guid,number,dealer_id in cursor.fetchall():
                try:
                    key=str(UUID(str(guid)))
                except (ValueError,TypeError,AttributeError):
                    continue
                sources[key]=(str(number or '').strip(),str(dealer_id or '').strip())''')
s=s.replace("        calc['measurementUrl']=sources.get(key)", '''        if key in sources:
            number,dealer_id=sources[key]
            calc['measurementNumber']=number or None
            calc['measurementDealerId']=int(dealer_id) if dealer_id.isdigit() and int(dealer_id)>0 else None
            match=re.fullmatch(r'zamir-(\d+)',number,re.IGNORECASE)
            if match and int(match.group(1))>0 and calc['measurementDealerId']:
                calc['measurementUrl']='/zamir?'+urlencode({'request_id':int(match.group(1)),'dealer_id':calc['measurementDealerId']})''')
p.write_text(s,encoding='utf-8')
p=Path('/var/www/html/ordersportal.vstg.com.ua/frontend/src/pages/ZamirPage.jsx');s=p.read_text(encoding='utf-8-sig');s="import { useSearchParams } from 'react-router-dom';\n"+s;s=s.replace('  const frameRef = useRef(null);', '''  const [linkParams] = useSearchParams();
  const requestedId = linkParams.get('request_id') || '';
  const requestedDealer = linkParams.get('dealer_id') || '';
  const validRequest = /^[1-9]\\d*$/.test(requestedId);
  const frameUrl = validRequest
    ? `${ZAMIR_ORIGIN}/requests/${encodeURIComponent(requestedId)}${/^[1-9]\\d*$/.test(requestedDealer) ? `?portal_user_id=${encodeURIComponent(requestedDealer)}` : ''}`
    : `${ZAMIR_ORIGIN}/`;
  const frameRef = useRef(null);''');s=s.replace('src={`${ZAMIR_ORIGIN}/`}', 'src={frameUrl}');p.write_text(s,encoding='utf-8')
# Show the source link beneath the displayed calculation number.
for name,anchor in [('OrderComponents.jsx','''        № {calc.number} 
      </div>'''),('CalculationItemMobile.jsx','''        № {calc.number}
      </div>''')]:
 p=Path('/var/www/html/ordersportal.vstg.com.ua/frontend/src/components/Orders')/name;s=p.read_text(encoding='utf-8-sig')
 assert anchor in s,name
 link='''
      {calc.fromMeasurement && calc.measurementUrl && <a
        href={calc.measurementUrl} target="_blank" rel="noopener noreferrer"
        className="measurement-source-link" onClick={event => event.stopPropagation()}
        style={{ display: 'inline-block', marginTop: 4, fontSize: 12, textDecoration: 'underline', color: 'inherit' }}
      >Відкрити в замірнику ↗</a>}'''
 s=s.replace(anchor,anchor+link,1);p.write_text(s,encoding='utf-8')
