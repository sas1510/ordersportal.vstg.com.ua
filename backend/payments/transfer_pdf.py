from io import BytesIO
from decimal import Decimal
from xml.sax.saxutils import escape

def build_transfer_history_pdf(rows, font_path, contractor):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    font = 'FundsTransferFont'
    if font not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(font, str(font_path)))
    style = ParagraphStyle('transfer', fontName=font, fontSize=8, leading=11)
    title = ParagraphStyle('transferTitle', parent=style, fontSize=16, leading=21, spaceAfter=10)
    stream = BytesIO()
    document = SimpleDocTemplate(stream, pagesize=A4, leftMargin=28, rightMargin=28, topMargin=28, bottomMargin=32)
    story = [Paragraph('Подані дані про передані кошти', title), Paragraph(escape(f'Контрагент: {contractor}'), style), Spacer(1, 12)]
    cell = lambda value: Paragraph(escape(str(value or '')).replace('\n', '<br/>'), style)
    data = [[cell(value) for value in ['Дата подання', 'Дилер', 'Сума', 'Валюта', 'Коментар', 'Автор']]]
    totals = {}
    for item in rows:
        amount = Decimal(str(item['amount']))
        currency = item['currency']
        totals[currency] = totals.get(currency, Decimal(0)) + amount
        data.append([cell(item['date']), cell(item.get('dealer', '')), cell(f'{amount:,.2f}'.replace(',', ' ').replace('.', ',')), cell('грн' if currency == 'UAH' else currency), cell('\n'.join(filter(None, [item['comment'], item.get('reconciliation')]))), cell(item['author'])])
    if rows:
        table = Table(data, colWidths=[70, 100, 65, 50, 160, 94], repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#edf2f5')), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), .3, colors.HexColor('#ccd5dc')), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
        story.extend([table, Spacer(1, 12)])
    else:
        story.append(Paragraph('Подань поки немає.', style))
    story.append(Paragraph(f'Усього подань: {len(rows)}', style))
    for currency, amount in totals.items():
        story.append(cell(f"Разом: {amount:,.2f} {'грн' if currency == 'UAH' else currency}".replace(',', ' ').replace('.', ',')))
    story.extend([Spacer(1, 8), Paragraph('Подання інформації не є підтвердженням оплати.', style)])
    def footer(canvas, doc):
        canvas.setFont(font, 8)
        canvas.drawRightString(A4[0] - 28, 16, f'Сторінка {doc.page}')
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return stream.getvalue()
