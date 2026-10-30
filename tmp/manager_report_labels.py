from pathlib import Path
p=Path('frontend/src/pages/DealerReconciliationPage.jsx');s=p.read_text(encoding='utf-8-sig').replace('Кількість документів і конструкцій на кожному етапі. Заявка / прорахунок — один документ у 1С.','Заявки (прорахунки) нового порталу, пов’язані замовлення та кількість конструкцій за статусами.');p.write_text(s,encoding='utf-8')
p=Path('backend/records/dealer_reconciliation_pdf.py');s=p.read_text(encoding='utf-8-sig').replace('from io import BytesIO','from io import BytesIO\nfrom datetime import datetime\nfrom zoneinfo import ZoneInfo')
s=s.replace("stamp=report.get('generatedAt','')[:19].replace('T',' ')", "stamp=datetime.fromisoformat(report['generatedAt']).astimezone(ZoneInfo('Europe/Kyiv')).strftime('%d.%m.%Y %H:%M') if report.get('generatedAt') else ''")
s=s.replace('Заявка / прорахунок - один документ у 1С.','Заявки / прорахунки - документи нового порталу.').replace('Сформовано {stamp}', 'Сформовано {stamp} (Київ)');p.write_text(s,encoding='utf-8')
