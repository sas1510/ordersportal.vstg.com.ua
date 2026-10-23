"""Read-only preflight for the explicitly identified bot user and role tables."""
import os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
checks=[
 ('user',"SELECT ID,CONVERT(varchar(34),ExternalUserID,1),TelegramUserID,TelegramChatID,FullName,RoleID,Status,IsActive,RemindersEnabled FROM [VSMarketBotAccess].[bot].[Users] WHERE ID=10009",None),
 ('roles',"SELECT UserID,RoleID,CreatedAt FROM [VSMarketBotAccess].[bot].[UserRoles] WHERE UserID=10009",None),
 ('role schema',"SELECT T.name,C.name,C.is_nullable,TYPE_NAME(C.system_type_id) FROM [VSMarketBotAccess].sys.tables T JOIN [VSMarketBotAccess].sys.schemas S ON S.schema_id=T.schema_id JOIN [VSMarketBotAccess].sys.columns C ON C.object_id=T.object_id WHERE S.name=N'bot' AND T.name IN (N'Roles',N'Users',N'UserRoles') ORDER BY T.name,C.column_id",None),
]
with connection.cursor() as c:
    for label,sql,params in checks:
        try:
            c.execute(sql,params)
            print(label,c.fetchall(),flush=True)
        except Exception as exc:
            print(label,'ERROR',str(exc),flush=True)
            break
