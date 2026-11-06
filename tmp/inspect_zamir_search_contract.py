import requests,re,json
from pathlib import Path
html=requests.get('https://zamir.viknastyle.com.ua/',timeout=15).text
for needle in ['data-page','Ziggy','routes','/login']:
 i=html.find(needle);print(needle,html[max(0,i-120):i+550] if i>=0 else 'missing')
url=re.findall(r'<script[^>]+src=["\x27]([^"\x27]+)',html)[0]
js=requests.get(url,timeout=15).text
Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_public_app.js').write_text(js)
for term in ['dealer_id','user_id','measurement','order_number','filter','searchParams']:
 matches=[m.start() for m in re.finditer(re.escape(term),js)]
 print('TERM',term,len(matches))
 for i in matches[:3]:print(js[max(0,i-90):i+180])
