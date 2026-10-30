exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_missing_chat_notification.py',encoding='utf-8-sig').read().split('with connection.cursor()')[0])
from records.models import TelegramPortalLink
from collections import Counter
from datetime import datetime
from zoneinfo import ZoneInfo
kinds=['9B5590B11C14DEB211EFCD97F755CD7A','9B5590B11C14DEB211EFCDAB2A4F3B56','9B5590B11C14DEB211EFCDADC33D7FE0','9CE94CD98F08E56D11F1397E6B478BDB','9CE94CD98F08E56D11F1397E78B02F95']
with connection.cursor() as c:
 c.execute('SELECT Объект,Вид,Представление FROM [oknastyle_biV2].[dbo].[РегистрыСведений.КонтактнаяИнформация] WHERE Вид IN ('+','.join(['%s']*5)+') AND Представление IS NOT NULL AND DATALENGTH(Представление)>0',[bytes.fromhex(k) for k in kinds])
 contacts=c.fetchall()
byguid={}
for guid,kind,value in sorted(contacts,key=lambda r:bytes(r[1])):
 byguid.setdefault(bytes(guid),str(value).strip())
links={}
for link in TelegramPortalLink.objects.all():links.setdefault(link.user_id,[]).append(str(link.telegram_chat_id))
users=[]
for user in CustomUser.objects.select_related('branch').order_by('full_name','username'):
 tg=byguid.get(bytes(user.user_id_1C)) if user.user_id_1C else None
 secure=links.get(user.id,[])
 if tg or secure:
  users.append({'id':user.id,'name':user.full_name or user.username,'login':user.username,'role':user.get_role_display(),'active':'Так' if user.is_active else 'Ні','branch':user.branch.name if user.branch_id else '', 'tg':tg or '', 'secure':', '.join(secure)})
counts=Counter(u['role'] for u in users)
base=Path('/mnt/c/Users/tetiana.flora/.codex/visualizations/2026/10/29/01a1877a-64b5-7030-9288-1fffa362adfd')
output=base/'Користувачі_Telegram_бота_порталу.md'
def esc(v):return str(v).replace('|','/').replace('\n',' ')
lines=['# Користувачі з прив’язкою Telegram-бота порталу','',f"Станом на {datetime.now(ZoneInfo('Europe/Kyiv')):%d.%m.%Y %H:%M} (Київ).",'',f'Користувачів: {len(users)}. Активних облікових записів: {sum(u["active"]=="Так" for u in users)}.','', 'Telegram ID у 1С — адреса для сповіщень, яку обирає процедура GetTelegramID. Прив’язка чату — запис TelegramPortalLink. Це облік збережених прив’язок; поточну доступність бота для кожного користувача не перевірено.','', '| ПІБ / назва | Логін | Роль | Активний | Філіал | Telegram ID у 1С | Прив’язаний чат | ID порталу |','|---|---|---|---|---|---|---|---|']
for u in users:lines.append('| '+' | '.join(esc(u[k]) for k in ['name','login','role','active','branch','tg','secure','id'])+' |')
output.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('TOTAL',len(users),'ACTIVE',sum(u['active']=='Так' for u in users),'ROLES',dict(counts),'SECURE_LINKED_USERS',len(links))
print('REPORT',output)
