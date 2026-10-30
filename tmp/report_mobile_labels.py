from pathlib import Path
p=Path('frontend/src/pages/DealerReconciliationPage.jsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('Із <b>{n(totals.applications)}</b> заявок замовлення мають <b>{n(totals.applicationsWithOrders)}</b>. До них прив’язано <b>{n(totals.linkedOrders)}</b> замовлень.', 'Заявок: <b>{n(totals.applications)}</b>. Із замовленнями: <b>{n(totals.applicationsWithOrders)}</b>. Пов’язаних замовлень: <b>{n(totals.linkedOrders)}</b>.')
s=s.replace('констр. у заявці → <b>{n(app.orders.length)}</b> замовлень / <b>{n(app.orderConstructions)}</b> констр.', 'констр. у заявці → замовлень: <b>{n(app.orders.length)}</b> / констр.: <b>{n(app.orderConstructions)}</b>')
s=s.replace('<p>Заявок: <b>{n(rows.length)}</b>. Відкрийте заявку, щоб побачити її замовлення та конструкції за статусами.</p>', '<p>Заявок: <b>{n(rows.length)}</b>. Відкрийте заявку, щоб побачити її замовлення та конструкції за статусами.</p><p>Якщо замовлення пов’язане з кількома заявками, у загальному підсумку воно враховане один раз.</p>')
p.write_text(s,encoding='utf-8')
p=Path('backend/records/dealer_reconciliation_pdf.py');s=p.read_text(encoding='utf-8-sig').replace("Із {totals['applications']} заявок замовлення мають {totals['applicationsWithOrders']}. До них прив’язано {totals['linkedOrders']} замовлень.","Заявок: {totals['applications']}. Із замовленнями: {totals['applicationsWithOrders']}. Пов’язаних замовлень: {totals['linkedOrders']}.")
p.write_text(s,encoding='utf-8')
p=Path('docs/DEALER_PORTAL_CONSTRUCTIONS_UA.md');s=p.read_text(encoding='utf-8-sig');s+='''
## Мобільний вигляд і порівняння кожної заявки

На екранах до 700 px таблиці нового звіту переходять у картки з підписами.
Дата та пошук мають шрифт 16 px, кнопки щонайменше 44 px. Контрастна кнопка
«Сформувати звіт» має окремі кольори для світлої й темної тем. Деталізація заявок
доступна загальним списком і в діалозі дилера, з пошуком і сторінками по 20 заявок.
У картці видно конструкції заявки, кількість пов’язаних замовлень, конструкції
в них та окремо таблицю кількостей/конструкцій за статусами цих замовлень.

CSV `export=csv&dataset=applications` - один рядок на заявку: її конструкції,
кількість замовлень, конструкції замовлень, підтверджені та зведення за статусами.
Якщо одне замовлення пов’язане з кількома заявками, воно видиме в кожній картці;
загальний підсумок звіту дедуплікує GUID. Тому сума колонок замовлень по заявках
у цьому CSV може перевищувати загальний унікальний підсумок. Звичайний
`export=csv` зберігає попередній формат - один рядок на документ.
''';p.write_text(s,encoding='utf-8')
