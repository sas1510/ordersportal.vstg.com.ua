# API створення заявки із замірника

## Зовнішня інтеграція

`POST https://portal.vstg.com.ua/api/integrations/measurement/orders/`

## Авторизація клієнта

Для звернення потрібен виданий вам спільний ключ інтеграції.
Передавайте його в заголовку `X-API-KEY` із сервера замірника.
Логін, пароль і JWT порталу не потрібні. Ключ зберігайте на сервері,
не додавайте його до JavaScript браузера.

## Запит

**Метод:** `POST`.
**URL:** `https://portal.vstg.com.ua/api/integrations/measurement/orders/`.
**Тіло:** JSON (`raw → JSON` у Postman), не multipart/form-data.
Файли кодуються Base64 без префікса `data:application/pdf;base64,`.

### Заголовки

| Заголовок | Обов'язковий | Що передавати |
|---|---|---|
| `Content-Type` | Так | `application/json` |
| `X-API-KEY` | Так | Виданий вам ключ інтеграції |
| `Idempotency-Key` | Так | UUID для конкретної заявки; для повтору — той самий UUID |


```http
Content-Type: application/json
X-API-KEY: ЗГЕНЕРОВАНИЙ_СЕКРЕТ
Idempotency-Key: 8eb75462-a26b-43aa-893c-dd2c478763c9
```

### Мінімальний JSON — без номера, адреси та фото

```json
{
  "user_id": 78,
  "items_count": 3,
  "file": {
    "fileName": "measurement-125.pdf",
    "fileDataB64": "BASE64_РЕАЛЬНОГО_PDF"
  }
}
```

### JSON із номером, коментарем та фотографіями

```json
{
  "user_id": 78,
  "items_count": 3,
  "order_number": "ZAMIR-125",
  "comment": "Заявка із замірника",
  "file": {
    "fileName": "measurement-125.pdf",
    "fileDataB64": "BASE64_РЕАЛЬНОГО_PDF"
  },
  "photos": [
    { "fileName": "window-1.jpg", "fileDataB64": "BASE64_ПЕРШОГО_ФОТО" },
    { "fileName": "window-2.png", "fileDataB64": "BASE64_ДРУГОГО_ФОТО" }
  ]
}
```

### Поля JSON

| Поле | Тип | Обов'язкове | Опис / значення без поля |
|---|---|---|---|
| `user_id` | integer | Так | Додатний внутрішній `User.ID` порталу |
| `items_count` | integer | Так | Кількість конструкцій, мінімум 1 |
| `file` | object | Так | Основний PDF |
| `file.fileName` | string | Так | Непорожня назва з розширенням `.pdf` |
| `file.fileDataB64` | string | Так | Непорожній коректний Base64 PDF до 20 МіБ |
| `order_number` | string | Ні | Номер замірника; можна не передавати або передати `""` |
| `comment` | string | Ні | Коментар; без поля `""` |
| `photos` | array | Ні | До 10 фотографій; без поля `[]` |
| `photos[].fileName` | string | Якщо передане фото | Назва `.jpg`, `.jpeg`, `.png` або `.webp` |
| `photos[].fileDataB64` | string | Якщо передане фото | Base64 фото до 10 МіБ |
| `delivery_is_pickup` | boolean | Ні | Самовивіз; без поля `false` |
| `delivery_address_guid` | UUID string | Ні | GUID наявної адреси доставки |
| `delivery_address_coordinates` | object | Ні | Координати наявної адреси: `lat`, `lng` |
| `delivery_address_is_default` | boolean | Ні | Ознака основного складу |
| `client_address` | object | Ні | Структурована адреса клієнта замість складу/самовивозу |

`order_number: null` не передавайте: підтримуються рядок або відсутнє поле.
Номер, коментар, PDF та фото в прикладах замініть своїми значеннями.

### Приклад cURL

Збережіть JSON із реальним Base64 у `request.json`, а секрет — у змінній
оточення `MEASUREMENT_API_KEY` машини, з якої виконується запит:

```bash
curl --request POST \
  'https://portal.vstg.com.ua/api/integrations/measurement/orders/' \
  --header 'Content-Type: application/json' \
  --header "X-API-KEY: ${MEASUREMENT_API_KEY}" \
  --header 'Idempotency-Key: 8eb75462-a26b-43aa-893c-dd2c478763c9' \
  --data-binary @request.json
```

Приклад UUID не використовуйте для всіх нових заявок: генеруйте новий для кожної.

Обов'язкові: `user_id`, `items_count` (ціле >= 1), `file.fileName` і
`file.fileDataB64`, обидва заголовки авторизації/ідемпотентності.
`order_number` необов'язковий: можна передати `"ZAMIR-125"`, порожній рядок
або взагалі не передавати поле.
`user_id` — саме `[portal_db].[dbo].[User].[ID]`, не GUID і не ID Laravel.
Потрібен активний dealer/customer із чинним доступом та налаштованою
прив’язкою до контрагента. `contractor_guid` та `contractor_id` у запиті
передавати не потрібно; такі перевизначення відхиляються.

Ключ є довіреним серверним ключем для всіх таких користувачів. Laravel повинен
визначати `user_id` із перевіреної прив'язки свого акаунта до порталу,
а не дозволяти користувачеві браузера довільно обирати чужий ID.

PDF до 20 МіБ: перевіряються розширення, Base64 та сигнатура `%PDF-`.
Фото необов'язкові: `photos: [{"fileName": "photo.jpg", "fileDataB64": "..."}]`.
До 10 фото по 10 МіБ; JPG, PNG, WebP, із перевіркою сигнатури та розширення.
Це перевірка формату, не антивірусна перевірка і не повний розбір PDF.

Base64 збільшує обсяг приблизно на третину. Максимальний набір (PDF 20 МіБ
та 10 фото по 10 МіБ) займає близько 160 МіБ плюс JSON. Якщо на проксі
є менший ліміт тіла запиту, налаштуйте для цього endpoint щонайменше 170 МіБ.

Опційні поля доставки сумісні зі звичайним API:
`delivery_is_pickup`, або `delivery_address_guid` з
`delivery_address_coordinates: {"lat": 48.29, "lng": 25.94}` та
`delivery_address_is_default`, або `client_address`.
Одночасно кілька способів доставки заборонені. Адресу можна не передавати.

Кожна нова заявка повинна мати новий UUID у `Idempotency-Key`.
Для повторної відправки тієї самої заявки використовуйте той самий UUID.
Ключі повторів ізольовані за `user_id`. Після таймауту або невизначеного
результату перевірте наявність заявки; не створюйте новий UUID автоматично.
Повтор після втрати відповіді може створити дубль.

## Відповідь

```json
{
  "success": true,
  "calculation_guid": "11111111-2222-4333-8444-555555555555",
  "portal_user_id": 78,
  "contractor_guid": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
}
```

Файли Base64 у відповідь не повертаються. HTTP 201 — успішне створення;
400 — некоректні поля/UUID; 401 — неправильний або неналаштований ключ;
403 — недоступний користувач; 409 — конфлікт/стан повторної заявки;
502 — помилка зовнішньої обробки заявки. Перевіряйте також тіло відповіді.
