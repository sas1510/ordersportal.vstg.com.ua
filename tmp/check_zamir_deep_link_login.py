from pathlib import Path
s=Path('/var/www/html/ordersportal.vstg.com.ua/tmp/zamir_public_app.js').read_text()
for term in ['beforeEach','zamir:login','redirect']:
 pos=s.find(term);print(term,s[max(0,pos-80):pos+650])
