from pathlib import Path
import requests,re
js=Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_public_app.js').read_text()
for prefix in ['RequestsPage','AdminRequests','RequestPage']:
 chunks=set(re.findall(prefix+r'-[A-Za-z0-9_-]+\.js',js))
 for chunk in chunks:
  txt=requests.get('https://zamir.viknastyle.com.ua/build/assets/'+chunk,timeout=15).text
  Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_'+chunk).write_text(txt)
  print('CHUNK',chunk)
  for term in ['query','portal_user','dealer_id','user_id','portal_order','portal_calculation','search','measurement_number']:
   for m in list(re.finditer(re.escape(term),txt))[:4]:print(term,txt[max(0,m.start()-80):m.start()+180])
