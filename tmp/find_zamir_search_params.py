from pathlib import Path
import requests,re
js=Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_public_app.js').read_text()
for m in re.finditer('path:',js):
 piece=js[m.start():m.start()+240]
 if 'component:' in piece:print(piece)
for chunk in sorted(set(re.findall(r'(?:\./)?([A-Z][A-Za-z]+Page-[A-Za-z0-9_-]+\.js)',js))):
 if any(word in chunk.lower() for word in ['order','measurement','project','dashboard','home']):
  txt=requests.get('https://zamir.viknastyle.com.ua/build/assets/'+chunk,timeout=15).text
  Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_'+chunk).write_text(txt)
  print('CHUNK',chunk)
  for term in ['route.query','query.','dealer','portal_user','user_id','search','number']:
   matches=list(re.finditer(re.escape(term),txt))
   for match in matches[:3]:print(term,txt[max(0,match.start()-80):match.start()+180])
