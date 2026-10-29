from django.db import connections
with connections['db_2'].cursor() as c:
    c.execute("SELECT name FROM sys.databases WHERE name NOT IN ('master','model','msdb','tempdb')")
    print('databases', c.fetchall())
    c.execute("SELECT name,type_desc FROM sys.objects WHERE type IN ('U','V','SN') ORDER BY name")
    print('objects',c.fetchall()[:110])
    c.execute('SELECT name,data_source FROM sys.servers')
    print('servers',c.fetchall())
