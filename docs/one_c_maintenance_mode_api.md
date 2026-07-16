# 1C Maintenance Mode — API для блокування запитів

Точка для 1С, яка тимчасово блокує API порталу на час оновлення бази, регламентних робіт або інших технічних дій.

Стан блокування зберігається на сервері у файлі `runtime/one_c_maintenance_state.json` і застосовується глобально до `/api/...` через middleware.

## Виклик
- Метод: `GET` або `POST`
- URL: `/api/system/maintenance/1c/`
- Заголовок: `X-API-KEY: <your_api_key>`
- Тіло: `JSON` для `POST`

## Призначення

Точка підтримує 2 сценарії:

1. Ручне блокування:
   API блокується одразу після запиту.
2. Блокування на часовий інтервал:
   API блокується автоматично тільки між `starts_at` і `ends_at`.

## GET — отримати поточний стан

```http
GET /api/system/maintenance/1c/
X-API-KEY: <your_api_key>
```

### Приклад відповіді

```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "manual_enabled": false,
    "scheduled_enabled": true,
    "window_configured": true,
    "message": "Оновлення бази 1С. Спробуйте пізніше.",
    "starts_at": "2026-07-16T18:00:00+03:00",
    "ends_at": "2026-07-16T18:30:00+03:00",
    "updated_at": "2026-07-16T15:05:11.000000+03:00",
    "updated_by": "1C API",
    "source": "1c_api"
  }
}
```

## POST — змінити режим блокування

## Payload

| Поле | Тип | Обов'язкове | Опис |
| --- | --- | --- | --- |
| `enabled` | `boolean` | ні | Ручне блокування: `true` — увімкнути одразу, `false` — вимкнути |
| `message` | `string` | ні | Повідомлення, яке побачать користувачі при блокуванні |
| `starts_at` | `string (datetime)` | ні | Початок вікна блокування |
| `ends_at` | `string (datetime)` | ні | Кінець вікна блокування |
| `clear_schedule` | `boolean` | ні | Якщо `true`, видаляє заданий інтервал часу |

### Підтримувані синоніми полів часу

Для сумісності можна надсилати не тільки `starts_at` / `ends_at`, а й:

- початок: `start_at`, `from`, `disabled_from`, `from_at`
- кінець: `end_at`, `to`, `disabled_to`, `to_at`

### Формати datetime

Рекомендований формат:

```text
2026-07-16T18:00:00+03:00
```

Також підтримується формат:

```text
2026-07-16 18:00:00
```

## Правила

- Якщо передається часовий інтервал, потрібно передати і початок, і кінець разом.
- `starts_at` має бути менше `ends_at`.
- Якщо передати тільки `message`, повідомлення оновиться без зміни режиму.
- Якщо передати `enabled: false` без `clear_schedule: true`, ручне блокування вимкнеться, але розклад залишиться.
- Якщо потрібно повністю зняти будь-яке блокування, передавайте `enabled: false` і `clear_schedule: true`.

## Приклади

### 1. Увімкнути блокування вручну

```json
{
  "enabled": true,
  "message": "Тимчасове оновлення бази 1С. Спробуйте пізніше."
}
```

### 2. Поставити блокування на інтервал часу

```json
{
  "enabled": false,
  "starts_at": "2026-07-16T18:00:00+03:00",
  "ends_at": "2026-07-16T18:30:00+03:00",
  "message": "Оновлення бази 1С. Спробуйте пізніше."
}
```

### 3. Поставити блокування на інтервал часу через короткі назви полів

```json
{
  "from": "2026-07-16 18:00:00",
  "to": "2026-07-16 18:30:00",
  "message": "Оновлення бази 1С. Спробуйте пізніше."
}
```

### 4. Повністю зняти блокування і очистити розклад

```json
{
  "enabled": false,
  "clear_schedule": true
}
```

## Відповідь на POST

```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "manual_enabled": false,
    "scheduled_enabled": true,
    "window_configured": true,
    "message": "Оновлення бази 1С. Спробуйте пізніше.",
    "starts_at": "2026-07-16T18:00:00+03:00",
    "ends_at": "2026-07-16T18:30:00+03:00",
    "updated_at": "2026-07-16T15:05:11.000000+03:00",
    "updated_by": "1C API",
    "source": "1c_api"
  }
}
```

## Що отримають інші API-клієнти при блокуванні

Під час активного блокування більшість `/api/...` запитів отримають HTTP `503`.

### Приклад відповіді

```json
{
  "error": "database_recovery",
  "detail": "Оновлення бази 1С. Спробуйте пізніше.",
  "maintenance": {
    "enabled": true,
    "manual_enabled": false,
    "scheduled_enabled": true,
    "window_configured": true,
    "starts_at": "2026-07-16T18:00:00+03:00",
    "ends_at": "2026-07-16T18:30:00+03:00",
    "updated_at": "2026-07-16T15:05:11.000000+03:00",
    "updated_by": "1C API",
    "source": "1c_api"
  }
}
```

## Приклади cURL

### Отримати стан

```bash
curl -X GET "https://<host>/api/system/maintenance/1c/" \
  -H "X-API-KEY: <your_api_key>"
```

### Увімкнути блокування вручну

```bash
curl -X POST "https://<host>/api/system/maintenance/1c/" \
  -H "X-API-KEY: <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "message": "Тимчасове оновлення бази 1С. Спробуйте пізніше."
  }'
```

### Поставити блокування на інтервал

```bash
curl -X POST "https://<host>/api/system/maintenance/1c/" \
  -H "X-API-KEY: <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "starts_at": "2026-07-16T18:00:00+03:00",
    "ends_at": "2026-07-16T18:30:00+03:00",
    "message": "Оновлення бази 1С. Спробуйте пізніше."
  }'
```

### Повністю вимкнути блокування

```bash
curl -X POST "https://<host>/api/system/maintenance/1c/" \
  -H "X-API-KEY: <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false,
    "clear_schedule": true
  }'
```

## Типові помилки

| Ситуація | Відповідь |
| --- | --- |
| Немає API key | `401/403` залежно від способу виклику |
| Передано тільки `starts_at` без `ends_at` | помилка валідації |
| `starts_at >= ends_at` | помилка валідації |
| Невірний формат дати | помилка валідації |

## Рекомендація для 1С

Якщо відключення планове, краще ставити саме часовий інтервал, а не ручний `enabled: true`. Тоді портал сам автоматично повернеться в робочий режим після завершення вікна обслуговування.
