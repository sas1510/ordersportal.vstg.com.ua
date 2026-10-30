"""Replay a saved old-portal export; read-only plan by default, --apply commits it."""
import os,sys,json,hashlib
from pathlib import Path
from collections import defaultdict,Counter
from datetime import datetime
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'));os.chdir(root/'backend');os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django;django.setup()
from django.db import connection,transaction
from users.models import CustomUser
from utils.GuidToBin1C import guid_to_1c_bin
from utils.BinToGuid1C import bin_to_guid_1c
folder=root/'backups/comments_jan_jul_2026_20261030'
source=json.loads((folder/'source.json').read_text(encoding='utf-8-sig'))
messages=source['messages'];assert len({r['oldMessageId'] for r in messages})==len(messages)
def norm(v):
 s=str(v or '').strip().lower().replace('\xa0','').replace(' ','')
 return (s.lstrip('0') or '0') if s.isdigit() else s
def guid(v):
 try:
  b=guid_to_1c_bin(str(v));return b if b and any(b) else None
 except (ValueError,TypeError):return None
def dt(v):return datetime.fromisoformat(str(v)[:26]).replace(tzinfo=None)
def msgkey(obj,stamp,text):
 # SQL datetime uses 1/300-second ticks; tolerate equivalent .333333/.333 precision.
 ticks=(stamp.toordinal()*86400+stamp.hour*3600+stamp.minute*60+stamp.second)*300+round(stamp.microsecond*300/1000000)
 return bytes(obj).hex(),ticks,str(text or '').strip()
def rows(c):return [dict(zip([d[0] for d in c.description],r)) for r in c.fetchall()]
users=defaultdict(set)
for u in CustomUser.objects.exclude(old_portal_id__isnull=True).exclude(user_id_1C__isnull=True):users[str(u.old_portal_id).lower()].add(bytes(u.user_id_1C))
managers={str(m['oldUserId']).lower():guid(m['guid']) for m in source['managers']}
# Legacy Managers.Guid may be empty; exact unique portal logins are a second verified identity key.
login_users=defaultdict(set)
for u in CustomUser.objects.exclude(user_id_1C__isnull=True):
 if u.user_id_1C and any(bytes(u.user_id_1C)):
  login_users[u.username.strip().lower()].add(bytes(u.user_id_1C))
identity_audit=[]
for old_user in source.get('users',[]):
 oldid=str(old_user['oldUserId']).lower();matches=login_users.get(str(old_user['login']).strip().lower(),set())
 if len(matches)==1:
  identity=next(iter(matches))
  if not users.get(oldid):users[oldid].add(identity)
  if not managers.get(oldid):
   managers[oldid]=identity
   identity_audit.append({'oldId':oldid,'login':old_user['login'],'guid':bin_to_guid_1c(identity),'method':'exact_unique_portal_login'})
(folder/'identity_matches.json').write_text(json.dumps(identity_audit,ensure_ascii=False,indent=2),encoding='utf-8')
contract_codes=defaultdict(set)
with connection.cursor() as c:
 c.execute('SELECT Ссылка,Код FROM [oknastyle_biV2].[dbo].[Справочники.Контрагенты] WHERE ПометкаУдаления=0x00')
 for g,code in c.fetchall():contract_codes[norm(code)].add(bytes(g))
resolved={};exceptions=[]
for m in messages:
 old=str(m['oldCustomerId']).lower();candidates=contract_codes.get(norm(m['contractorCode']),set());account=users.get(old,set())
 if len(account)==1 and (not candidates or account<=candidates):resolved[old]=next(iter(account))
 elif len(candidates)==1:resolved[old]=next(iter(candidates))
contractors=sorted(set(resolved.values()));direct=defaultdict(dict);links=defaultdict(set);appdates={}
with connection.cursor() as c:
 for start in range(0,len(contractors),400):
  chunk=contractors[start:start+400];params=','.join(['%s']*len(chunk))
  c.execute('SELECT Ссылка,НомерДилера,Контрагент,Дата FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] WHERE ПометкаУдаления=0x00 AND Контрагент IN ('+params+')',chunk)
  for g,num,contractor,date in c.fetchall():
   g=bytes(g);contractor=bytes(contractor);direct[(contractor,norm(num))][g]=date;appdates[g]=date
  c.execute('''SELECT L.Ссылка,O.Номер,O.Контрагент FROM [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет_ЗаказыПокупателей] L JOIN [oknastyle_biV2].[dbo].[Документы.ЗаказПокупателя] O ON O.Ссылка=L.ЗаказПокупателя JOIN [oknastyle_biV2].[dbo].[ЗаявкаНаПросчет] A ON A.Ссылка=L.Ссылка AND A.Контрагент=O.Контрагент WHERE A.ПометкаУдаления=0x00 AND O.Контрагент IN ('''+params+')',chunk)
  for g,num,contractor in c.fetchall():links[(bytes(contractor),norm(num))].add(bytes(g))
 c.execute('SELECT id,RelatedObjectId,Timestamp,Text FROM dbo.ChatMessage WHERE Timestamp>=%s AND Timestamp<%s AND IsNotification=0',[datetime(2026,1,1),datetime(2026,8,1)])
 existing=rows(c)
existing_keys={msgkey(m['RelatedObjectId'],m['Timestamp'],m['Text']) for m in existing if m['RelatedObjectId']}
plan=[];counts=Counter();seen=set()
for m in messages:
 old=str(m['oldCustomerId']).lower();contractor=resolved.get(old)
 reason=None;target=None
 if not contractor:reason='contractor_not_unique_or_missing'
 else:
  candidates=set(direct.get((contractor,norm(m['orderNumber'])),{}))
  linked=set()
  for num in str(m.get('linkedOrderNumbers') or '').split(','):linked|=links.get((contractor,norm(num)),set())
  if len(linked)==1:target=next(iter(linked))
  elif len(candidates)==1:target=next(iter(candidates))
  elif candidates:
   same_day=[g for g in candidates if str(appdates[g])[:10]==str(m['orderCreated'])[:10]]
   if len(same_day)==1:target=same_day[0]
  if not target:reason='application_ambiguous' if candidates or linked else 'application_not_found'
 if reason:
  counts[reason]+=1;exceptions.append({**m,'reason':reason});continue
 stamp=dt(m['timestamp']);key=msgkey(target,stamp,m['text'])
 if key in existing_keys:counts['already_present']+=1;continue
 if key in seen:counts['source_duplicate']+=1;continue
 order_manager=managers.get(str(m['oldManagerId']).lower())
 if str(m['oldWriterId']).lower()==old:author=contractor;recipient=order_manager
 else:
  author=managers.get(str(m['oldWriterId']).lower())
  if not author:
   matches=users.get(str(m['oldWriterId']).lower(),set());author=next(iter(matches)) if len(matches)==1 else None
  recipient=contractor
 if not author or not recipient:
  counts['author_or_recipient_missing']+=1;exceptions.append({**m,'reason':'author_or_recipient_missing'});continue
 seen.add(key)
 plan.append({'oldMessageId':m['oldMessageId'],'oldOrderId':m['oldOrderId'],'orderNumber':str(m['orderNumber']),'oldCustomerId':old,'chatId':'1_'+bin_to_guid_1c(target),'relatedObjectId':target.hex(),'timestamp':stamp.isoformat(),'text':m['text'],'authorId':author.hex(),'recipientId':recipient.hex()})
counts['source']=len(messages);counts['ready']=len(plan)
(folder/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
(folder/'exceptions.json').write_text(json.dumps(exceptions,ensure_ascii=False,indent=2),encoding='utf-8')
(folder/'summary.json').write_text(json.dumps(counts,ensure_ascii=False,indent=2),encoding='utf-8')
print('PLAN',dict(counts),flush=True)
print('5549',[p for p in plan if p['oldMessageId']==294850],flush=True)
if '--apply' not in sys.argv:sys.exit(0)
assert '--apply' in sys.argv and not (folder/'inserted.json').exists(),'Migration already committed; inspect receipt before replay'
inserted=[]
with transaction.atomic():
 with connection.cursor() as c:
  for p in plan:
   g=bytes.fromhex(p['relatedObjectId']);stamp=dt(p['timestamp'])
   # Lock the target message range and repeat the dedup check at write time.
   c.execute('SELECT id,Timestamp,Text FROM dbo.ChatMessage WITH (UPDLOCK,HOLDLOCK) WHERE ChatId=%s AND RelatedObjectId=%s AND IsNotification=0 AND Timestamp>=%s AND Timestamp<%s',[p['chatId'],g,datetime(stamp.year,stamp.month,stamp.day),datetime.fromordinal(stamp.toordinal()+1)])
   present={msgkey(g,t,text) for _,t,text in c.fetchall()}
   if msgkey(g,stamp,p['text']) in present:continue
   c.execute('''INSERT dbo.ChatMessage (ChatId,Timestamp,Text,IsRead,IsSentVtg,IsNotification,EventType,RelatedObjectId,TransactionTypeID,AuthorId,RecipientId,NotificationReadAt)
    OUTPUT INSERTED.id VALUES (%s,%s,%s,1,1,0,'1',%s,1,%s,%s,NULL)''',[p['chatId'],stamp,p['text'],g,bytes.fromhex(p['authorId']),bytes.fromhex(p['recipientId'])])
   inserted.append({'id':c.fetchone()[0],**p})
  (folder/'inserted.pending.json').write_text(json.dumps(inserted,ensure_ascii=False,indent=2),encoding='utf-8')
(folder/'inserted.pending.json').rename(folder/'inserted.json')
print('COMMITTED',len(inserted),flush=True)



