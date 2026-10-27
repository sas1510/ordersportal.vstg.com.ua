# Адмінська точка перевірки інтеграції замірника

## Призначення та URL

`https://portal.vstg.com.ua/api/integrations/measurement/test/`

Доступні методи: **GET** для перевірки налаштування та **POST** для створення
заявки. POST створює справжню заявку на прорахунок у тестовій 1С.
Сторінка форми: `https://portal.vstg.com.ua/integration-test/measurement`.
URL доступні після розгортання відповідного коду.

| Адреса | Для кого | Авторизація |
|---|---|---|
| `/api/integrations/measurement/test/` | Адміністратор порталу, перевірка | JWT адміністратора |
| `/api/integrations/measurement/orders/` | Сервер Laravel-замірника | Спільний `X-API-KEY` |

Цей документ описує **`/test/`**. Спільний ключ інтеграції браузер не отримує:
портал підставляє його з `.env` усередині серверного обробника.
Передача лише `X-API-KEY` у `/test/` не замінює JWT адміністратора.

## Що налаштувати в порталі

```dotenv
MEASUREMENT_API_KEY=НОВИЙ_ДОВГИЙ_СЕКРЕТ
MEASUREMENT_APP_ORIGIN=https://zamir.viknastyle.com.ua
```

`MEASUREMENT_APP_ORIGIN` — origin без шляху. За відсутності змінної
використовується `https://zamir.viknastyle.com.ua`.
Адреса додається до `CORS_ALLOWED_ORIGINS` та `CSRF_TRUSTED_ORIGINS`.
Заголовок `Idempotency-Key` додано до `CORS_ALLOW_HEADERS`.
Після зміни `.env` перезапустіть Django-сервіс.

У поточних налаштуваннях є `CORS_ALLOW_ALL_ORIGINS=True`, тому наведений
список не обмежує доступ лише цим origin. Його додано явно для роботи й при
вимкненні загального дозволу. Автентифікація і перевірка ролі діють незалежно від CORS.
`ALLOWED_HOSTS` визначає адреси самого порталу; додавати туди адресу клієнта замірника не потрібно.

Для серверного запиту Laravel → Django CORS не потрібен. Якщо JavaScript
замірника звертається до `/test/`, йому потрібен JWT адміністратора порталу;
звичайна сесія Laravel такого доступу не дає. Не зберігайте спільний
`MEASUREMENT_API_KEY` у браузері. Обмеження CSP `connect-src` на сайті замірника,
якщо воно є, налаштовує власник Laravel-сайту, дозволивши `https://portal.vstg.com.ua`.

## 1. GET — перевірка налаштування

```http
GET /api/integrations/measurement/test/ HTTP/1.1
Authorization: Bearer ACCESS_TOKEN_АДМІНІСТРАТОРА
Accept: application/json
```

Тіло запиту не потрібне. Відповідь **200**:

```json
{
  "configured": true,
  "one_c_url": "http://192.168.50.50/oknastyle_vmm/hs/gp-obmen/"
}
```

`configured` означає лише наявність непорожнього `MEASUREMENT_API_KEY`.
Це не перевірка з'єднання, пароля або доступності 1С.
При відсутньому ключі повертається **200** з `"configured": false`.
Сам секрет ніколи не повертається.

## 2. POST — створення заявки

### Заголовки

| Заголовок | Обов'язковий | Значення |
|---|---|---|
| `Authorization` | Так | `Bearer ACCESS_TOKEN_АДМІНІСТРАТОРА` |
| `Content-Type` | Так | `application/json` |
| `Idempotency-Key` | Так | UUID для конкретної заявки |
| `Accept` | Ні | `application/json` |

`X-API-KEY`, Basic Auth та `Query` клієнт не додає.
JWT повинен належати користувачу з роллю `admin`.

### Мінімальний JSON

```json
{
  "user_id": 78,
  "items_count": 3,
  "file": {
    "fileName": "measurement.pdf",
    "fileDataB64": "BASE64_ВМІСТ_РЕАЛЬНОГО_PDF"
  }
}
```

### Усі підтримувані поля

| Поле | Тип | Обов'язкове | Опис |
|---|---|---|---|
| `user_id` | integer | Так | Додатний ID дилера з `[portal_db].[dbo].[User].[ID]` |
| `items_count` | integer | Так | Кількість конструкцій >= 1 |
| `file` | object | Так | Основний PDF |
| `file.fileName` | string | Так | Назва з розширенням `.pdf` |
| `file.fileDataB64` | string | Так | Base64 PDF до 20 МіБ |
| `order_number` | string | Ні | Номер; можна `""` або не передавати, але не `null` |
| `comment` | string | Ні | Коментар; без поля `""` |
| `photos` | array | Ні | До 10 фото, без поля `[]` |
| `photos[].fileName` | string | Для кожного фото | `.jpg`, `.jpeg`, `.png`, `.webp` |
| `photos[].fileDataB64` | string | Для кожного фото | Base64 фото до 10 МіБ |
| `delivery_is_pickup` | boolean | Ні | `true` — самовивіз; без поля `false` |
| `delivery_address_guid` | UUID string | Ні | GUID адреси складу |
| `delivery_address_coordinates` | object | Ні | Координати складу: `lat`, `lng` |
| `delivery_address_is_default` | boolean | Ні | Чи є склад основним |
| `client_address` | object | Ні | Альтернативна структурована адреса клієнта |

Поля `client_address`: `text`, `lat`, `lng`, `region`, `district`, `city`,
`street`, `house`, `apartment`, `entrance`, `floor`, `note`, `full_name`,
`phone`, `extra_info`. Цей об'єкт не має повної вкладеної валідації в поточному API.

Передавайте лише один спосіб доставки: самовивіз, GUID складу або адресу клієнта.
Без доставки портал додає порожній об'єкт `address` для 1С.
Поле `orders: []` портал додає автоматично.
`contractor_guid` і `contractor_id` у запиті заборонені: контрагент визначається
через `UserId1C` користувача `user_id`.
Дилер має бути активним, з непростроченим доступом і заповненим `UserId1C`;
допустимі ролі `dealer` та `customer`.

Base64 передається без префікса `data:...;base64,`.
Перевіряються розширення та сигнатура файлу, не повний вміст PDF.
Максимальний набір вкладень займає близько 160 МіБ плюс JSON після Base64;
ліміти Apache та сервера 1С також мають пропускати цей обсяг.

### Приклад із фото

```json
{
  "user_id": 78,
  "items_count": 3,
  "order_number": "ZAMIR-125",
  "comment": "Тест із фотографіями",
  "file": { "fileName": "measurement.pdf", "fileDataB64": "BASE64_PDF" },
  "photos": [
    { "fileName": "window.jpg", "fileDataB64": "BASE64_JPG" },
    { "fileName": "opening.png", "fileDataB64": "BASE64_PNG" }
  ]
}
```

### Приклад cURL

Збережіть JSON із реальним Base64 у `request.json`; JWT адміністратора —
у змінну оточення `PORTAL_ADMIN_ACCESS_TOKEN`:

```bash
curl --request POST \
  'https://portal.vstg.com.ua/api/integrations/measurement/test/' \
  --header "Authorization: Bearer ${PORTAL_ADMIN_ACCESS_TOKEN}" \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: 8eb75462-a26b-43aa-893c-dd2c478763c9' \
  --data-binary @request.json
```

У Postman: Authorization → Bearer Token; Body → raw → JSON.
Нова заявка — новий UUID. Повтор тієї самої заявки — той самий UUID.

## 3. Відповіді

### 201 — створено або повернуто збережений успішний результат

```json
{
  "success": true,
  "calculation_guid": "11111111-2222-4333-8444-555555555555",
  "portal_user_id": 78,
  "contractor_guid": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
}
```

GUID — прорахунок 1С; `portal_user_id` — вибраний дилер, не ID адміністратора.
Повтор успішної заявки з тим самим UUID і тим самим вмістом повертає збережену відповідь.

### 400 — некоректні поля або заголовок

Приклади (текст і вкладеність залежать від поля):

```json
{ "user_id": "Потрібен додатний цілий ID із portal_db.dbo.User." }
```

```json
{ "Idempotency-Key": "Потрібен UUID. Повторний запит надсилайте з тим самим UUID." }
```

```json
{ "file": { "fileName": ["Основний файл повинен мати розширення .pdf."] } }
```

400 також можливий при відмові 1С або відсутньому GUID у її відповіді;
тіло такої помилки містить `detail` та подробиці 1С.

### 401 — немає JWT, JWT недійсний або ключ інтеграції не налаштовано

```json
{ "detail": "Недійсний ключ інтеграції замірника." }
```

Цей приклад означає проблему серверного `MEASUREMENT_API_KEY`.
Для відсутнього або простроченого JWT Django повертає свій `detail`,
можливі також `code` і `messages`. Текст може залежати від мови відповіді.

### 403 — недостатні права або вибраний дилер недоступний

```json
{ "detail": "Користувач недоступний для створення замовлення." }
```

Інші приклади `detail`: `Термін доступу користувача завершився.`,
`Потрібен користувач дилера з прив’язкою UserId1C.`.
Менеджер, дилер та інші неадмінські ролі не можуть викликати `/test/`.

### 409 — конфлікт повторного запиту

```json
{ "error": "This calculation request is already being processed" }
```

Або:

```json
{ "error": "Idempotency-Key is already used for another request" }
```

### 502 — збій зв'язку з 1С / некоректна HTTP-відповідь 1С

```json
{
  "error": "Не вдалося створити прорахунок в 1С. Спробуйте повторити запит.",
  "details_from_1c": "Подробиці помилки"
}
```

`details_from_1c` може бути рядком, списком або об'єктом.
Після таймауту перевірте 1С: документ міг бути створений до втрати відповіді.
Не створюйте новий UUID автоматично. Поточна реалізація може повторно
надіслати невдалу/невизначену спробу і з тим самим UUID; це не гарантія
від дубля на стороні 1С після втрати відповіді.

### Інші статуси

- **404** — endpoint не розгорнутий / неправильний URL.
- **405** — метод, відмінний від підтримуваних GET/POST/OPTIONS.
- **413** — розмір запиту перевищує серверний ліміт, можлива HTML-відповідь проксі.
- **415** — непідтримуваний Content-Type (для інтеграції використовуйте JSON).
- **500** — непередбачена помилка; формат залежить від обробника помилок порталу.

Клієнт повинен перевіряти HTTP-статус і тіло, не покладатися на точний текст помилки.


## Оновлення: робочий обмін

Замірник переключено на основні `ONE_C_URL`, `ONE_C_USER`, `ONE_C_PASSWORD`
порталу. Попередня жорстко задана адреса oknastyle_vmm та параметри
MEASUREMENT_ONE_C_USER / MEASUREMENT_ONE_C_PASSWORD більше не використовуються.
POST через зовнішню точку та приховану сторінку створює заявки у налаштованій
робочій 1С. Перед розгортанням перевірте ONE_C_URL на сервері.
Ключі ідемпотентності ізольовані також за адресою сервісу, щоб не повертати
результат із попереднього середовища. Для нової робочої заявки створіть новий UUID.
