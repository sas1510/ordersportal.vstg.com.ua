# Local test portal database

Connection alias: `portal_test`.

- SQL Server: `WST-SQL\WSTSQL`
- Database: `portal_db`
- SQL login: `Bodnaruk_V`

Edit `backend/.env` locally:

```dotenv
PORTAL_TEST_DB_HOST=WST-SQL\WSTSQL
PORTAL_TEST_DB_NAME=portal_db
PORTAL_TEST_DB_USER=Bodnaruk_V
PORTAL_TEST_DB_PASSWORD='your password'
PORTAL_USE_TEST_DB=False
```

Do not commit passwords. `False` keeps the existing default database.
To run the local portal against the test database, set `PORTAL_USE_TEST_DB=True`
and restart Django. An empty password with this switch enabled prevents startup.
This switches only `default`; the existing `db_2` connection and external 1C,
Telegram, Redis and linked-server destinations are unchanged. This is not an
isolated sandbox for actions that write to those services.

Test the additional connection from the `backend` directory in WSL:

```bash
../venv/bin/python manage.py shell -c "from django.db import connections; c = connections['portal_test'].cursor(); c.execute('SELECT @@SERVERNAME, DB_NAME(), ORIGINAL_LOGIN()'); print(c.fetchone()); c.close()"
```

To switch back, set `PORTAL_USE_TEST_DB=False` and restart Django.
