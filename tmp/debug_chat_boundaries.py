exec(open('/var/www/html/ordersportal.vstg.com.ua/tmp/inspect_dydyk1517_chat.py',encoding='utf-8-sig').read().split('for m in ChatMessage')[0])
from records.order_chat_summary import get_order_boundary_messages,_hashable_binary_params
from django.db.models import Min,Max
b=guid_to_1c_bin('b7210ae9-ccb3-11f1-9cfa-4cd98f08e56d')
print('BINARY',b.hex())
print('VALUES',list(ChatMessage.objects.filter(related_object_id=b,is_notification=False).values('id','related_object_id','text')))
print('BOUNDARY',get_order_boundary_messages([b]))
def log(execute,sql,params,many,context):
 print('SQL',sql,'PARAMS',params)
 return _hashable_binary_params(execute,sql,params,many,context)
with connection.execute_wrapper(log):print('TRACE',get_order_boundary_messages([b]))
