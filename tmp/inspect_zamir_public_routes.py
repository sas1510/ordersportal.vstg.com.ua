import requests,re
url='https://zamir.viknastyle.com.ua/'
try:
 r=requests.get(url,timeout=15)
 print('HTTP',r.status_code)
 print('SCRIPTS',re.findall(r'<script[^>]+src=["\x27]([^"\x27]+)',r.text))
 print('TITLE',re.findall(r'<title>(.*?)</title>',r.text))
except requests.RequestException as e:print(type(e).__name__)
