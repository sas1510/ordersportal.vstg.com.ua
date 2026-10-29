> **Оновлення конфігурації БД:** окремий блок `PORTAL_TEST_DB_*` та
> перемикач `PORTAL_USE_TEST_DB` видалено. Нижче старі приклади з ними
> більше не застосовуються. Для будь-якого середовища задавайте лише
> `DB_ENGINE`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
> Для тестової БД: `DB_HOST=WST-SQL\WSTSQL`, `DB_NAME=portal_db`.
> Перевіряйте фактичний сервер через `connections['default']`.

# Розгортання порталу: Ubuntu / WSL, Django, React, SQL Server

Дата: 22.10.2026.

## 0. Новий ноутбук: встановлення з нуля

Цей сценарій — для Windows-ноутбука, на якому ще немає Ubuntu, коду, venv чи
конфігурації порталу. SQL Server залишається **на віддаленому сервері**:
локальну SQL-базу встановлювати та копіювати MDF/LDF не потрібно.

### Крок 1. Підготуйте доступи та файли

Потрібні:

- права адміністратора Windows для встановлення WSL;
- доступ до приватного `Floratania/portal.vstg.com.ua`;
- корпоративна мережа або VPN з доступом до `WST-SQL\WSTSQL`;
- SQL-логін із погодженими правами до `portal_db` і потрібних джерел 1С;
- власний локальний `.env`, заповнений із захищеного сховища секретів;
- за потреби — приватні ключі підпису JWT, медіафайли й файли прорахунків,
  отримані від адміністратора захищеним способом.

Клонування Git **не відновлює** `.env`, паролі, серверні права, незакомічені
виправлення або завантажені користувачами файли. Не розраховуйте на повноту
випадково закоміченого `private_uploads`: потрібне окреме узгоджене сховище.

На новому ноутбуці інша IP-адреса; старий `172.17.19.107` не переноситься
автоматично. Не спрямовуйте робочий домен порталу на ноутбук.

### Крок 2. Встановіть WSL/Ubuntu

У **PowerShell від адміністратора Windows**:

```powershell
wsl --install -d Ubuntu
```

Якщо Windows просить перезавантаження, перезавантажте ноутбук. Запустіть Ubuntu
і створіть Linux-користувача та пароль. Цей пароль використовується для `sudo`;
він не є паролем SQL або Windows.

Подальші Linux-команди виконуйте **в Ubuntu**, не в PowerShell. Для входу з
PowerShell використовуйте:

```powershell
wsl -d Ubuntu
```

Перевірте systemd в Ubuntu:

```bash
ps -p 1 -o comm=
```

Очікуємо `systemd`. Якщо його немає, збережіть наявні секції `/etc/wsl.conf`
і додайте/узгодьте:

```ini
[boot]
systemd=true
```

Після цього закрийте Linux-сеанси. У PowerShell виконайте `wsl --shutdown`
(зупинить усі WSL-дистрибутиви), знову відкрийте Ubuntu й повторіть перевірку.

### Крок 3. Встановіть системні залежності

```bash
sudo apt update
sudo apt install git curl ca-certificates python3-venv python3-dev build-essential unixodbc-dev apache2 redis-server
cat /etc/os-release
```

Встановіть Node.js із підтримуваної LTS-гілки, сумісної з Vite у цьому проєкті,
та Microsoft ODBC Driver **17** за інструкцією саме для версії Ubuntu з попередньої
команди. Не змішуйте пакети від різних версій Ubuntu. Посилання на інструкцію
Microsoft наведено в розділі 2.

Перевірте `node --version`, `npm --version`, `python3 --version` і `odbcinst -q -d`.
Якщо встановлено лише Driver 18, код із Driver 17 не підключиться: встановіть
потрібний драйвер або окремо узгодьте зміну всіх налаштувань драйвера й TLS.

### Крок 4. Клонуйте репозиторій

Для SSH спочатку налаштуйте **власний SSH-ключ нового ноутбука** й додайте його
публічну частину до свого GitHub. Не копіюйте чужі приватні SSH-ключі.
Альтернатива — HTTPS із погодженим менеджером облікових даних; не вставляйте
токен у URL або shell-команду.

```bash
PORTAL_DIR=/var/www/html/portal.vstg.com.ua
sudo install -d -o "$USER" -g www-data -m 2750 "$PORTAL_DIR"
git clone git@github.com:Floratania/portal.vstg.com.ua.git "$PORTAL_DIR"
cd "$PORTAL_DIR"
git log -1 --oneline
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r backend/requirements.txt
```

Перед розгортанням перевірте версію коду. Якщо репозиторій досі на `bf1c99af`,
пізніші виправлення з іншого ноутбука в ньому відсутні. Використайте погоджений
актуальний коміт; сама назва репозиторію не підтверджує наявність цих змін.

### Крок 5. Створіть `.env` та підключіть віддалені бази

Створіть `backend/.env` за розділом 4. Приклад цільових параметрів:

```dotenv
PORTAL_TEST_DB_HOST=WST-SQL\WSTSQL
PORTAL_TEST_DB_NAME=portal_db
PORTAL_TEST_DB_USER=newportal
PORTAL_TEST_DB_PASSWORD='пароль тестового SQL-логіна'
PORTAL_USE_TEST_DB=True

DB_HOST_2=WST-SQL\WSTSQL
DB_NAME_2=oknastyle_vmm
DB_USER_2=newportal
DB_PASSWORD_2='пароль тестового SQL-логіна'
```

Це **доповнення**, а не повний `.env`: заповніть також обов’язкові параметри
базових `DB_*`, ключі Django та інші налаштування з розділу 4. Якщо код ще не
підтримує `PORTAL_USE_TEST_DB`, задайте тестові дані в основних `DB_*`.

Не додавайте `newportal` до standby-бази на новому ноутбуці: права налаштовуються
на SQL Server адміністратором. Якщо віддалена тестова `portal_db` уже відновлена,
другий раз відновлювати її для кожного ноутбука не потрібно.

Якщо тестової `portal_db` на сервері ще немає, її спочатку створює/відновлює
адміністратор. `manage.py migrate` створює Django-таблиці, але **не замінює**
перенесення прикладних SQL-процедур, користувачів та довідників.

Звернення SQL-процедур до оригінальної 1С потрібно адаптувати окремо:
`DB_NAME_2=oknastyle_vmm` саме по собі не змінює hardcoded назви баз у процедурах.

### Крок 6. Перевірте, що підключення справді тестові

```bash
cd "$PORTAL_DIR/backend"
../venv/bin/python manage.py check
../venv/bin/python manage.py shell -c "from django.db import connection; c = connection.cursor(); c.execute('SELECT @@SERVERNAME, DB_NAME(), ORIGINAL_LOGIN()'); print(c.fetchone()); c.close()"
../venv/bin/python manage.py shell -c "from django.db import connections; c = connections['db_2'].cursor(); c.execute('SELECT @@SERVERNAME, DB_NAME(), ORIGINAL_LOGIN()'); print(c.fetchone()); c.close()"
```

Очікуємо основну `portal_db` на `WST-SQL\WSTSQL`, а в другому підключенні —
`oknastyle_vmm`. Якщо DNS/VPN не працює в Ubuntu, спочатку усуньте мережеву
проблему; не переключайтеся на робочий сервер лише для обходу помилки.

Перед міграціями переконайтеся, що не зміните спільну тестову базу для інших
розробників без узгодження. При першому підключенні до вже актуальної схеми
може бути достатньо перегляду `showmigrations` і `migrate --plan`.

### Крок 7. Зберіть frontend та підготуйте файли

Виконайте розділи 6–8: перевірка/міграції, `collectstatic`, `npm ci --legacy-peer-deps`,
`npm run build`, права каталогів. Якщо медіафайли ще не перенесені або сховище
недоступне, старі фото/вкладення не відкриватимуться, навіть якщо записи є в БД.

### Крок 8. Налаштуйте служби й Apache

Створіть **усі** файли служб та Apache з розділів 9–10. На чистому ноутбуці
`ordersportal.service` або `portal-test.service` ще не існує: команда restart
сама їх не створює. Для нового каталогу використовуйте назви `portal-test*`.

Для першої локальної перевірки задайте `ServerName localhost` у прикладі
VirtualHost та дозвольте `localhost,127.0.0.1` у фактичних налаштуваннях Django.
Якщо запущено стандартний Apache-сайт, перевірте `apachectl -S`: запит має
потрапляти саме в VirtualHost порталу, а не на стандартну сторінку Ubuntu.

Після налаштування:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now redis-server apache2
sudo systemctl enable --now portal-test.service portal-test-ws.service
sudo apachectl configtest
sudo systemctl reload apache2
sudo systemctl status portal-test.service portal-test-ws.service apache2 --no-pager
```

Відкрийте у браузері Windows `http://localhost/`. Якщо потрібен доступ з інших
пристроїв, налаштуйте окремо WSL-мережу, firewall, домен/IP, VirtualHost,
`ALLOWED_HOSTS` і CORS/CSRF. Не відкривайте debug-сайт у зовнішню мережу.

**Celery поки не запускайте**, якщо Redis/черги або інтеграції ще спільні з
оригінальним порталом. Сам HTTP backend також може виконувати зовнішні записи:
до перевірки 1С, платежів і Telegram обмежтеся входом та читанням даних.

### Крок 9. Перший вхід і завершальна перевірка

Використайте тестового користувача з відновленої `portal_db`. Не створюйте
суперкористувача автоматично в спільній базі, якщо адміністратор його не погодив.

Пройдіть список із розділу 11. Якщо отримали 503, перевірте журнал:

```bash
sudo journalctl -u portal-test.service -n 80 --no-pager -o cat
sudo tail -n 50 /var/log/apache2/portal_test_error.log
```

Результат чистого розгортання: код і служби працюють на новому ноутбуці,
дані читаються з віддаленої тестової SQL-бази, а зовнішні інтеграції й задачі
увімкнені тільки після окремої перевірки їхнього тестового призначення.

## 1. Середовища та межі інструкції

Репозиторій копії: https://github.com/Floratania/portal.vstg.com.ua

Початковий стан копії — коміт `bf1c99af5b2a582d0aa4298c240255e00ea931a6`.
Пізніші локальні зміни не потрапляють у цей репозиторій автоматично. Перед
розгортанням перевірте, що потрібні налаштування, міграції та виправлення вже
закомічені й доступні в обраній гілці.

| Призначення | Значення |
| --- | --- |
| Оригінальний SQL Server | `WST\WST` |
| Тестовий SQL Server | `WST-SQL\WSTSQL` |
| Тестова база 1С | `oknastyle_vmm` |
| Основна база порталу | `portal_db` |
| Довідники й дані 1С | `oknastyle_biV2`, `oknastyle` |
| Поточний каталог на ноутбуці | `/var/www/html/ordersportal.vstg.com.ua` |
| Приклад каталогу нової інсталяції | `/var/www/html/portal.vstg.com.ua` |
| Локальний backend | `ordersportal.service` |
| Локальні WebSocket | `daphne.service`, порт `8001` |
| Локальні фонові задачі | `celery.service` |
| Celery на сервері bi | `ordersportal-celery.service` |

Новий сайт потребує окремого каталогу, сокета, служб і VirtualHost, якщо працює
поруч із наявним. Не змінюйте чинну інсталяцію випадково.

**Перемикання `portal_db` не створює повністю ізольоване тестове середовище.**
`db_2`, linked servers, HTTP-запити до 1С, Telegram, пошта та SMB можуть залишатися
оригінальними. Перевірте їх перед створенням тестових замовлень або оплат.
Для тестового Celery потрібні окремі Redis/черги та вимкнені або тестові зовнішні
отримувачі. Не запускайте його на спільній виробничій черзі.

## 2. Передумови

- Ubuntu/WSL із systemd та доступом до корпоративної мережі/VPN.
- Python 3.11+ відповідно до `backend/requirements.txt`; на ноутбуці використовується 3.12.
- Node.js, сумісний із Vite з `frontend/package-lock.json`, і npm.
- Git, Apache, Redis, unixODBC та Microsoft ODBC Driver **17 for SQL Server**.
- Доступ до SQL Server: для named instance може бути потрібний SQL Browser або
  явно заданий адміністратором TCP-порт. Не вгадуйте порт.
- Доступ до приватного GitHub-репозиторію через SSH або інший налаштований спосіб.

Приклад встановлення базових пакетів:

```bash
sudo apt update
sudo apt install git python3-venv python3-dev build-essential unixodbc-dev apache2 redis-server
```

ODBC Driver 17 встановіть із репозиторію Microsoft для своєї версії Ubuntu:
https://learn.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server

Перевірки:

```bash
python3 --version
node --version
npm --version
odbcinst -q -d
getent hosts WST-SQL
```

У драйверах має бути `[ODBC Driver 17 for SQL Server]`.

## 3. Отримання коду та Python-залежності

Для **нової** інсталяції в ще не зайнятому каталозі:

```bash
PORTAL_DIR=/var/www/html/portal.vstg.com.ua
sudo install -d -o "$USER" -g www-data -m 2750 "$PORTAL_DIR"
git clone git@github.com:Floratania/portal.vstg.com.ua.git "$PORTAL_DIR"
cd "$PORTAL_DIR"
git log -1 --oneline
python3 -m venv venv
./venv/bin/python -m pip install --upgrade pip
./venv/bin/python -m pip install -r backend/requirements.txt
```

Для наявної локальної інсталяції використовуйте її фактичний каталог:

```bash
PORTAL_DIR=/var/www/html/ordersportal.vstg.com.ua
cd "$PORTAL_DIR"
git status --short
```

Системні конфігурації в наступних розділах використовують приклад
`/var/www/html/portal.vstg.com.ua`. Для чинної інсталяції замініть його **скрізь**
на `/var/www/html/ordersportal.vstg.com.ua`.

## 4. Локальний `.env` та налаштування Django

Основний локальний файл — `backend/.env`. Паролі, токени й ключі не комітити.
Кожен параметр повинен мати одне визначення: пізніший дубль може змінити результат.

У проєкті є `backend/settings.py` та `backend/backend/settings.py`.
Перевіряйте фактично імпортований файл, а не лише той, який відкритий у редакторі.
Шлях `.env` у чинному коді визначається через `load_dotenv()`; розміщуйте його
узгоджено з модулем налаштувань і перевіряйте середовище запущеної служби.

Параметри базової конфігурації, які читаються без default:

```dotenv
SECRET_KEY='власний секретний ключ Django'
ALLOWED_HOSTS=localhost,127.0.0.1,АДРЕСА_АБО_ДОМЕН_САЙТУ
OPENAI_API_KEY='значення для вашого середовища'

DB_ENGINE=mssql
DB_HOST=СЕРВЕР_ОСНОВНОЇ_КОНФІГУРАЦІЇ
DB_NAME=portal_db
DB_USER=SQL_LOGIN
DB_PASSWORD='пароль'

DB_HOST_2=СЕРВЕР_ДРУГОГО_ПІДКЛЮЧЕННЯ
DB_NAME_2=НАЗВА_ДРУГОЇ_БАЗИ
DB_USER_2=SQL_LOGIN
DB_PASSWORD_2='пароль'

SMB_SERVER=ФАЙЛОВИЙ_СЕРВЕР
SMB_USERNAME='доменний користувач'
SMB_PASSWORD='пароль'
SMB_SHARE=НАЗВА_РЕСУРСУ

ONE_C_URL=https://АДРЕСА_1С
ONE_C_USER=КОРИСТУВАЧ_1С
ONE_C_PASSWORD='пароль'
```

Це перелік параметрів, а не готовий файл для копіювання: заповніть правильні
значення для свого середовища. Не використовуйте виробничі секрети для тестових
інтеграцій. Наявність параметра сама по собі не підтверджує доступність сервісу.

Перевірте фактичні `DEBUG`, `ALLOWED_HOSTS`, CORS, `CSRF_TRUSTED_ORIGINS`,
`FRONTEND_URL` і cookie domain у налаштуваннях. Частина з них може бути задана
безпосередньо в Python: додавання однойменного ключа в `.env` не змінить константу.

Для робочого HTTPS: `DEBUG=False`, cookie Secure увімкнено.
Для локального HTTP допускається `DEBUG=True` і:

```python
"AUTH_COOKIE_SECURE": not DEBUG,
```

Не публікуйте debug-режим у відкритий доступ. Список `MIDDLEWARE` повинен містити
окремі елементи з комами, наприклад:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    # решта middleware проєкту
]
```

### Тестова база на `WST-SQL\WSTSQL`

Якщо у вашій версії коду вже є `DATABASES['portal_test']`, використовуйте:

```dotenv
PORTAL_TEST_DB_HOST=WST-SQL\WSTSQL
PORTAL_TEST_DB_NAME=portal_db
PORTAL_TEST_DB_USER=newportal
PORTAL_TEST_DB_PASSWORD='пароль логіна на тестовому сервері'
PORTAL_USE_TEST_DB=True
```

Альтернативний логін — `Bodnaruk_V`, але він також повинен мати доступ до
довідників. Для standby-бази зручніший уже наявний користувач `newportal` із
правильно відтвореним SID.

`PORTAL_USE_TEST_DB=True` перемикає лише `default`. `db_2` залишається окремим.
При порожньому тестовому паролі ввімкнений перемикач навмисно блокує запуск.

Якщо клонований коміт не містить `portal_test`, цей перемикач ще не підтримується.
Спочатку перенесіть відповідне виправлення або налаштуйте **локальні** `DB_HOST`,
`DB_NAME`, `DB_USER`, `DB_PASSWORD` безпосередньо на тестовий сервер.

### Додаткове підключення до тестової 1С `oknastyle_vmm`

Для окремого підключення Django можна використати вже визначений alias `db_2`.
Спочатку збережіть його попередні локальні параметри: ця зміна замінює саме друге
підключення. Якщо `oknastyle_vmm` розміщена на `WST-SQL\WSTSQL`, задайте в
`backend/.env`:

```dotenv
DB_HOST_2=WST-SQL\WSTSQL
DB_NAME_2=oknastyle_vmm
DB_USER_2=newportal
DB_PASSWORD_2='пароль логіна на цьому сервері'
```

Якщо база на іншому SQL Server, замініть `DB_HOST_2` на його фактичну адресу.
Це не залежить від `PORTAL_USE_TEST_DB`: той перемикач змінює лише `default`.
Не дублюйте ключі `.env`; змініть наявні рядки.

Для надання читання адміністратор виконує на сервері з `oknastyle_vmm`:

```sql
USE [oknastyle_vmm];
IF USER_ID(N'newportal') IS NULL
    CREATE USER [newportal] FOR LOGIN [newportal];
ELSE
    ALTER USER [newportal] WITH LOGIN = [newportal];
GRANT CONNECT TO [newportal];
IF IS_ROLEMEMBER(N'db_datareader', N'newportal') <> 1
    ALTER ROLE [db_datareader] ADD MEMBER [newportal];
```

Цей приклад передбачає наявний SQL-логін і writable-базу. Для standby/READ_ONLY
не виконуйте зміну користувача: використайте процедуру узгодження SID з наступного
розділу. Права запису до 1С тут не надаються.

Перевірка з каталогу `backend`, без зміни даних:

```bash
../venv/bin/python manage.py shell -c "from django.db import connections; c = connections['db_2'].cursor(); c.execute('SELECT @@SERVERNAME, DB_NAME(), ORIGINAL_LOGIN()'); print(c.fetchone()); c.close()"
```

Очікувана назва бази — **`oknastyle_vmm`**. Після зміни `.env` перезапустіть backend
та лише ті інші служби, які мають використовувати це підключення.

**Цього недостатньо для перенаправлення всіх звернень до 1С.** У перевіреному коді
немає активних викликів `connections['db_2']`; значна частина даних отримується
процедурами через основне підключення з явно заданими назвами баз і linked servers.
Посилання `[oknastyle]`, `[WST\WST].[oknastyle]` не стануть `oknastyle_vmm` від
зміни `.env`. Для роботи саме з тестовою 1С потрібне окреме узгоджене виправлення
цих залежностей у тестовій `portal_db` і перевірка відповідності метаданих 1С.
HTTP-адреса `ONE_C_URL` також налаштовується окремо.

## 5. Права SQL Server та standby-база

Адміністратор SQL Server має налаштувати:

- `portal_db`: користувач застосунку, у погодженій конфігурації — `db_owner`.
- `oknastyle_biV2`: читання потрібних даних; погоджено роль `db_datareader`.
- `oknastyle`: доступ за вже наявним у standby-копії користувачем.

`db_owner` у `portal_db` **не дає** доступу до інших баз і linked servers.

Відомий стан на тестовому сервері:

| База | Стан | Read-only | Standby |
| --- | --- | --- | --- |
| `oknastyle_biV2` | ONLINE | 0 | 0 |
| `oknastyle` | ONLINE | 1 | 1 |

У `oknastyle` не можна виконати `CREATE USER` або додати роль, бо це зміни бази.
Не переводьте її в READ_WRITE й не виконуйте RESTORE WITH RECOVERY заради прав:
це порушить подальше відновлення журналів.

Для логіна `newportal` адміністратор перевіряє SID користувача в standby-базі
та SID серверного логіна. У цій інсталяції був отриманий SID:

```text
0xE7737EAB79906B4D82B93E3F546A3B24
```

Спочатку перевірка **на цільовому сервері під адміністратором**:

```sql
SELECT name, sid FROM [oknastyle].sys.database_principals
WHERE name = N'newportal';

SELECT name, sid, is_disabled FROM sys.server_principals
WHERE name = N'newportal';
```

Лише якщо логіна немає, створіть його в `master` з SID, який справді повернув
перший запит. Пароль може відрізнятися від пароля оригінального сервера:

```sql
USE [master];
CREATE LOGIN [newportal]
WITH PASSWORD = N'ВСТАВТЕ_СКЛАДНИЙ_ПАРОЛЬ',
     SID = 0xE7737EAB79906B4D82B93E3F546A3B24,
     DEFAULT_DATABASE = [portal_db],
     CHECK_POLICY = ON;
```

Не запускайте створення повторно для наявного логіна. Не видаляйте його без
перевірки залежностей. Однакове ім’я без однакового SID не виправляє прив’язку.

У writable-базах адміністратор налаштовує користувача цього логіна:

```sql
USE [portal_db];
IF USER_ID(N'newportal') IS NULL
    CREATE USER [newportal] FOR LOGIN [newportal];
ELSE
    ALTER USER [newportal] WITH LOGIN = [newportal];
IF IS_ROLEMEMBER(N'db_owner', N'newportal') <> 1
    ALTER ROLE [db_owner] ADD MEMBER [newportal];
GO
USE [oknastyle_biV2];
IF USER_ID(N'newportal') IS NULL
    CREATE USER [newportal] FOR LOGIN [newportal];
ELSE
    ALTER USER [newportal] WITH LOGIN = [newportal];
GRANT CONNECT TO [newportal];
IF IS_ROLEMEMBER(N'db_datareader', N'newportal') <> 1
    ALTER ROLE [db_datareader] ADD MEMBER [newportal];
```

Доступ і права в `oknastyle` успадковуються від її вже наявного користувача;
їх потрібно перевірити фактичним читанням. Логіни та linked servers — серверні
об’єкти, вони не переносяться backup/restore однієї `portal_db`.

Окремо перевірте процедури з `FORCESEEK`/`FORCESCAN`: якщо раніше локальна
таблиця стала віддаленою, SQL Server може повернути 7436. Не видаляйте всі
підказки або не переписуйте джерела автоматично; адаптуйте конкретні запити
на тестовому сервері, зберігши попередні визначення процедур.

## 6. Перевірка фактичної бази перед міграціями

```bash
cd "$PORTAL_DIR/backend"
../venv/bin/python manage.py shell -c "from django.conf import settings; import importlib; print(importlib.import_module(settings.SETTINGS_MODULE).__file__); print(settings.BASE_DIR)"
../venv/bin/python manage.py shell -c "from django.db import connection; c = connection.cursor(); c.execute('SELECT @@SERVERNAME, DB_NAME(), ORIGINAL_LOGIN()'); print(c.fetchone()); c.close()"
```

Для тесту очікуємо `WST-SQL\WSTSQL`, `portal_db`, `newportal`.
Якщо бачите `WST\WST`, ви все ще працюєте з оригіналом. Не запускайте тестові
зміни даних або міграції, поки фактичний сервер не перевірено.

Далі:

```bash
../venv/bin/python manage.py check
../venv/bin/python manage.py showmigrations
../venv/bin/python manage.py migrate --plan
```

Після перевірки плану й резервного копіювання цільової бази:

```bash
../venv/bin/python manage.py migrate
../venv/bin/python manage.py collectstatic --noinput
```

Код повинен містити міграції, потрібні для його моделей. Не використовуйте
`--fake` як спосіб прибрати помилку відсутнього стовпця.

## 7. Збірка frontend

```bash
cd "$PORTAL_DIR/frontend"
npm ci --legacy-peer-deps
npm run build
```

Виконуйте npm від користувача розгортання, без `sudo`. Якщо lock-файл не відповідає
`package.json`, виправте й закомітьте його в розробці; не ігноруйте помилку `npm ci`.

Frontend працює через `/api` поточного origin у перевіреній локальній версії коду.
Для старішого коміту перевірте `src/api/axios.js` і параметри `frontend/.env`.
Зміна Vite-параметрів потребує повторної збірки.

`npm run build` також запускає `postbuild`, який створює `dist/.htaccess` і
`dist/version.json`. Для публікації використовуйте саме цю команду.

## 8. Файли та права Linux

Перевірте `settings.BASE_DIR`, `STATIC_ROOT` та `MEDIA_ROOT`.

```bash
sudo install -d -o www-data -g www-data -m 2770 "$PORTAL_DIR/media"
```

Визначте права для інших runtime-каталогів за фактичним використанням. Backend
має читати код, venv і `.env`; frontend/dist — читатися Apache. Не використовуйте
`chmod -R 777`. Приватні завантаження не слід відкривати публічним `Alias`.

Для поточного варіанта із сокетом у корені проєкту служба `www-data` повинна мати
можливість створювати `$PORTAL_DIR/backend.sock`. Можна організувати обмежений
груповий доступ до каталогу або винести сокет у `/run` з відповідним налаштуванням
і служби, і Apache. Не надавайте `www-data` запис до всього коду рекурсивно.

## 9. Служби systemd

Наведені нижче служби — приклади для окремої нової інсталяції. На чинному ноутбуці
спочатку дивіться `systemctl cat ordersportal.service daphne.service celery.service`.

### HTTP backend: `/etc/systemd/system/portal-test.service`

```ini
[Unit]
Description=Portal test ASGI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/html/portal.vstg.com.ua
Environment="PYTHONPATH=/var/www/html/portal.vstg.com.ua/backend"
Environment="DJANGO_SETTINGS_MODULE=backend.settings"
ExecStart=/var/www/html/portal.vstg.com.ua/venv/bin/uvicorn backend.asgi:application --uds /var/www/html/portal.vstg.com.ua/backend.sock --workers 4 --proxy-headers --lifespan off --log-level info
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### WebSocket: `/etc/systemd/system/portal-test-ws.service`

```ini
[Unit]
Description=Portal test WebSocket
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/html/portal.vstg.com.ua
Environment="PYTHONPATH=/var/www/html/portal.vstg.com.ua/backend"
Environment="DJANGO_SETTINGS_MODULE=backend.settings"
ExecStart=/var/www/html/portal.vstg.com.ua/venv/bin/daphne -b 127.0.0.1 -p 8002 backend.asgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Порт `8002` обрано для нової інсталяції, щоб не займати `8001` чинного Daphne.

### Celery

Спочатку налаштуйте окремий broker та channel layer для тесту і перевірте
зовнішні ефекти задач. У поточному коді Redis/Celery URL можуть бути константами:
самого додавання URL у `.env` недостатньо, якщо налаштування його не читають.

Після ізоляції приклад `/etc/systemd/system/portal-test-celery.service`:

```ini
[Unit]
Description=Portal test Celery
After=network.target redis-server.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/html/portal.vstg.com.ua/backend
Environment="PYTHONPATH=/var/www/html/portal.vstg.com.ua/backend"
Environment="DJANGO_SETTINGS_MODULE=backend.settings"
ExecStart=/var/www/html/portal.vstg.com.ua/venv/bin/python -m celery -A backend worker -B -l info --schedule=/var/www/html/portal.vstg.com.ua/runtime/celerybeat-test
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Для `runtime` надайте `www-data` запис. Запускайте лише **один Beat** для цього
середовища; `-B` уже запускає Beat усередині worker. Не запускайте ще один окремо.

Активація HTTP та WebSocket після створення файлів:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now portal-test.service portal-test-ws.service
```

Celery активуйте окремо лише після описаної перевірки інтеграцій.

## 10. Apache

Для нової інсталяції створіть окремий VirtualHost. Нижче HTTP-приклад для локальної
мережі; для публічного сайту налаштуйте HTTPS, домен і Secure cookies.
Замініть `portal-test.local` на домен або IP, який реально резолвиться у браузері.

```apache
<VirtualHost *:80>
    ServerName portal-test.local
    DocumentRoot /var/www/html/portal.vstg.com.ua/frontend/dist

    ProxyPreserveHost On
    ProxyPass /static/ !
    ProxyPass /media/ !
    ProxyPass /ws/ ws://127.0.0.1:8002/ws/
    ProxyPassReverse /ws/ ws://127.0.0.1:8002/ws/
    ProxyPass /api/ unix:/var/www/html/portal.vstg.com.ua/backend.sock|http://localhost/api/
    ProxyPassReverse /api/ http://localhost/api/
    ProxyPass /admin/ unix:/var/www/html/portal.vstg.com.ua/backend.sock|http://localhost/admin/
    ProxyPassReverse /admin/ http://localhost/admin/

    Alias /static/ /var/www/html/portal.vstg.com.ua/backend/static/
    <Directory /var/www/html/portal.vstg.com.ua/backend/static>
        Require all granted
    </Directory>

    <Directory /var/www/html/portal.vstg.com.ua/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        <Files index.html>
            Header set Cache-Control "no-cache, no-store, must-revalidate"
        </Files>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/portal_test_error.log
    CustomLog ${APACHE_LOG_DIR}/portal_test_access.log combined
</VirtualHost>
```

Шлях `/static/` звірте з `STATIC_ROOT`; він може відрізнятися для різних модулів
settings. `media` додавайте як Alias лише для справді публічних файлів за
фактичним `MEDIA_ROOT`. Для приватних файлів використовуйте захищені API.

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers expires
sudo a2ensite portal-test.conf
sudo apachectl configtest
sudo systemctl reload apache2
```

`portal-test.conf` — ім’я файлу, який ви створили в `sites-available`.
До успішного `Syntax OK` не перезавантажуйте Apache.

## 11. Перевірка після запуску

1. Відкривається frontend і працює вхід.
2. `/api/user/me/` після входу повертає користувача.
3. Підтверджено фактичні сервер, базу та SQL-логін.
4. Завантажуються дилери, замовлення й фінанси.
5. WebSocket підключається, повідомлення видно у чаті.
6. Фото відкриваються авторизованим користувачам, експорт PDF працює.
7. Лише після перевірки тестових інтеграцій перевіряються задачі Celery.

Команди для поточного ноутбука:

```bash
sudo systemctl status ordersportal.service daphne.service apache2 --no-pager
sudo journalctl -u ordersportal.service -n 80 --no-pager -o cat
sudo journalctl -u daphne.service -n 50 --no-pager -o cat
sudo tail -n 50 /var/log/apache2/ordersportal_error.log
```

Для нової інсталяції замініть назви служб на `portal-test*` і лог Apache на
`portal_test_error.log`. Поточний стан служби важливіший за старі повідомлення
помилок: обмежуйте журнал часом останнього перезапуску.

## 12. Типові помилки

| Симптом | Що перевірити |
| --- | --- |
| Apache 503 | Чи запущений ASGI, чи існує сокет, чи Apache має до нього доступ |
| `SecurityMiddlewarecorsheaders` | Пропущена кома у списку `MIDDLEWARE` |
| Підключення залишилося на `WST\WST` | Дублі `PORTAL_USE_TEST_DB`, активний settings, `.env`, змінні systemd та перезапуск служби |
| 18456 | Ім’я логіна, пароль, disabled-стан, SQL authentication |
| 916 | Відсутній доступ логіна до довідникової бази або неправильний SID |
| 3906 | Спроба змінити read-only/standby-базу |
| 7436 | `FORCESEEK`/`FORCESCAN` застосовано до віддаленого джерела |
| `Invalid column name` | Версія схеми/міграцій не відповідає коду |
| Вхід по HTTP не зберігається | Secure cookies, cookie domain, SameSite, CORS/CSRF |
| Telegram 401 | Неправильний токен; сповіщення використовують `NOTIFICATION_TELEGRAM_BOT_TOKEN` |
| Git pull: permission denied у private_uploads | Права каталогу та завантажені користувачами файли у Git |

Не «лікуйте» 916 увімкненням TRUSTWORTHY або наданням sysadmin застосунку.

## 13. Оновлення наявної інсталяції

1. Збережіть backup цільової БД, `.env`, потрібних runtime/медіафайлів і стан коду.
2. Перевірте `git status` і різницю версій. Не робіть `git reset --hard` або
   `git clean` для усунення невідомих локальних змін.
3. Призупиніть записи під час несумісних міграцій; для тестового сайта зупиніть
   його власний backend та worker, не служби оригінального порталу.
4. Оновіть код і залежності, перегляньте план міграцій, виконайте міграції й збірку.
5. Перезапустіть відповідні служби, перевірте журнал і функціональність.

Приклад команд для чинного каталогу (після розв’язання локальних змін):

```bash
cd /var/www/html/ordersportal.vstg.com.ua
git pull --ff-only
./venv/bin/python -m pip install -r backend/requirements.txt
cd backend
../venv/bin/python manage.py migrate --plan
# Після перевірки фактичної БД та резервної копії:
../venv/bin/python manage.py migrate
../venv/bin/python manage.py collectstatic --noinput
cd ../frontend
npm ci --legacy-peer-deps
npm run build
sudo systemctl restart ordersportal.service daphne.service
```

Celery перезапускайте окремо після перевірки його середовища:
на ноутбуці `celery.service`, на bi — `ordersportal-celery.service`.

Git-репозиторій не замінює резервну копію БД і приватних файлів. Копія коду на
певному коміті також не відновлює SQL-логіни, linked servers або системні служби.

## 14. Відкат

- Запишіть попередній коміт перед оновленням.
- При помилці коду поверніть погоджену попередню версію і перезберіть frontend.
- Не відновлюйте стару БД поверх нових даних без погодженого плану відкату.
- Для повернення лише локального основного підключення встановіть
  `PORTAL_USE_TEST_DB=False` і перезапустіть backend. Це повертає `default` до
  базових `DB_*`, тому перед будь-якими записами повторіть перевірку сервера.

## 15. Контрольний список

- [ ] Обрано правильний репозиторій і коміт.
- [ ] Вказано правильні каталог, модуль settings та `.env` без дублів.
- [ ] Паролі й ключі не збережені у Git або документації.
- [ ] Фактичне підключення показує очікувані сервер, базу й логін.
- [ ] Права до довідників і SID standby-користувача перевірені.
- [ ] Збережено backup перед міграціями.
- [ ] Міграції та збірка frontend завершилися успішно.
- [ ] Backend, Apache та WebSocket працюють.
- [ ] Тестові черги й зовнішні інтеграції ізольовані до запуску Celery.
- [ ] Перевірено вхід, дилерів, замовлення, фото та PDF.
- [ ] Для публічного сайта ввімкнено HTTPS, вимкнено DEBUG.


## Одна локальна IP-адреса в `.env`

У `backend/.env` задайте лише:

```dotenv
PORTAL_LOCAL_IP=192.168.1.100
```

Замініть значення на IP нового ноутбука, без `http://` та без порту.
Django автоматично додає цю адресу в `ALLOWED_HOSTS`, CORS, CSRF та CSP
(також `ws://` для WebSocket). Стару IP не потрібно переносити в `ALLOWED_HOSTS`.
Фронтенд використовує поточну адресу браузера для API, тому окремий IP для нього не потрібен.
Після зміни перезапустіть Django/ASGI та Celery, якщо він використовує ці налаштування.

Apache не читає Django `.env`. Для локального доступу використовуйте
`<VirtualHost *:80>` без прив’язки до IP та `ServerName localhost`;
цей сайт має бути стандартним для порту 80 (на ноутбуці без інших сайтів).
Тоді при зміні IP конфігурацію Apache змінювати не потрібно.
Не підставляйте локальний IP замість зовнішніх адрес SQL Server, 1С чи SMB.
Експорт workflow n8n налаштовується окремо на сервері n8n.

### Чи використовується `db_2`

У поточному коді немає активних звернень до alias `db_2`.
Його залишено як необов’язкове підключення для ручної перевірки;
воно не перемикає джерело даних процедур. Дані 1С, які отримуються
через SQL-процедури та linked servers, залежать від їхніх власних налаштувань.
