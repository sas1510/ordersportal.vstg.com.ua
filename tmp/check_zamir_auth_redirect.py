from pathlib import Path
import re,requests
s=Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_public_app.js').read_text()
pos=s.rfind('.beforeEach');print(s[pos:pos+800])
for url in ['https://zamir.viknastyle.com.ua/build/assets/api-C0hcMgQx.js','https://zamir.viknastyle.com.ua/build/assets/LoginPage-BG0DmHYn.js']:
 txt=requests.get(url,timeout=12).text
 for term in ['zamir:login','redirect','return_to']:
  for m in list(re.finditer(re.escape(term),txt))[:3]:print(term,txt[max(0,m.start()-100):m.start()+400])
