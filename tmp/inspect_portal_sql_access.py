import os,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings')
import django
django.setup()
from django.db import connection
with connection.cursor() as c:
    for label,sql in [
        ('session',"SELECT @@SERVERNAME AS ServerName,DB_NAME() AS DatabaseName,SUSER_SNAME() AS LoginName,USER_NAME() AS UserName,IS_SRVROLEMEMBER('sysadmin') AS IsSysadmin,HAS_PERMS_BY_NAME(NULL,NULL,'ALTER ANY LOGIN') AS CanManageLogins"),
        ('login',"SELECT name,type_desc,is_disabled FROM sys.server_principals WHERE name=N'newportal'"),
        ('database user',"SELECT name,type_desc FROM [oknastyle_biV2].sys.database_principals WHERE name=N'newportal'"),
        ('procedure',"SELECT definition FROM sys.sql_modules WHERE object_id=OBJECT_ID(N'dbo.GetDealerPortalUsers_2')"),
    ]:
        try:
            c.execute(sql)
            rows=c.fetchall()
            if label=='procedure':
                import re
                print(label, sorted(set(re.findall(r'\[oknastyle_biV2\]\.\[dbo\]\.\[([^\]]+)\]', rows[0][0] or ''))) if rows else [],flush=True)
            else: print(label,rows,flush=True)
        except Exception as exc: print(label,str(exc),flush=True)
