import os,pyodbc
old=pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=192.168.200.4,1433;DATABASE=ordersportal_db;UID=1s-connector;PWD='+os.environ['OLD_PORTAL_PASSWORD']+';Encrypt=no;TrustServerCertificate=yes;',timeout=8)
c=old.cursor()
c.execute('SELECT DB_NAME()');print(c.fetchone()[0])
c.execute("SELECT t.name,c.name FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id WHERE t.name IN ('OrdersMessages','Customers','Orders','Managers') ORDER BY t.name,c.column_id")
for row in c.fetchall():print(tuple(row))
