import ast
from pathlib import Path
import pyodbc
root=Path('..')
tree=ast.parse((root/'backend/import uuid.py').read_text())
params=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='conn_params' for t in n.targets))
try:
    with pyodbc.connect(params['srv1'].replace('DRIVER={SQL Server}', 'DRIVER={ODBC Driver 17 for SQL Server}'),timeout=10) as c:
        cur=c.cursor()
        cur.execute("SELECT t.name,c.name,ty.name FROM sys.tables t JOIN sys.columns c ON t.object_id=c.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE t.name IN ('Db1SOrderNumbers','Orders','Customers') ORDER BY t.name,c.column_id")
        print(cur.fetchall())
except Exception as e:
    print(type(e).__name__, str(e)[:350])

