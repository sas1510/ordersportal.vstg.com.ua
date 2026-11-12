"""Printable goods statement; values are copied from the source invoice."""
from io import BytesIO
from decimal import Decimal
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, LongTable, Table, TableStyle, KeepTogether


def register_fonts():
    if "InvoiceSans" not in pdfmetrics.getRegisteredFontNames():
        directory = Path("/usr/share/fonts/truetype/dejavu")
        pdfmetrics.registerFont(TTFont("InvoiceSans", str(directory / "DejaVuSans.ttf")))
        pdfmetrics.registerFont(TTFont("InvoiceSansBold", str(directory / "DejaVuSans-Bold.ttf")))


def amount(value):
    return f"{value or 0:,.2f}".replace(",", " ").replace(".", ",")


def build_customer_bill_pdf(document, items, totals):
    register_fonts()
    stream = BytesIO()
    number = str(document.get("BillNumber") or "")
    currency = str(document.get("Currency") or "")
    page = landscape(A4)
    pdf = SimpleDocTemplate(stream, pagesize=page, rightMargin=14*mm, leftMargin=14*mm,
                            topMargin=14*mm, bottomMargin=17*mm, title=f"Рахунок {number}", author="Вікна Стиль")
    normal = ParagraphStyle("InvoiceBody", fontName="InvoiceSans", fontSize=8, leading=11, textColor=colors.HexColor("#333c42"))
    heading = ParagraphStyle("InvoiceTitle", parent=normal, fontName="InvoiceSansBold", fontSize=20, leading=25, spaceAfter=8)
    muted = ParagraphStyle("InvoiceMuted", parent=normal, fontSize=8, textColor=colors.HexColor("#64727e"))
    numeric = ParagraphStyle("InvoiceNumeric", parent=normal, alignment=TA_RIGHT)
    table_header = ParagraphStyle("InvoiceTableHeader", parent=normal, fontName="InvoiceSansBold", fontSize=7, leading=10, textColor=colors.white)

    def p(value, style=normal):
        return Paragraph(escape(str(value if value is not None else "-")).replace("\n", "<br/>"), style)

    issued = document.get("BillDate")
    issued_text = issued.strftime("%d.%m.%Y") if hasattr(issued, "strftime") else str(issued or "-")[:10]
    story = [p("ВІКНА СТИЛЬ / ФІНАНСИ", muted), Spacer(1, 5*mm), p(f"Рахунок № {number}", heading),
             p(f"Дата: {issued_text}     Валюта: {currency}     Статус: {'Проведений' if document.get('IsPosted') else 'Не проведений'}"),
             Spacer(1, 2*mm), p(f"Контрагент: {document.get('ContractorName') or '-'}"), Spacer(1, 7*mm)]
    comment = str(document.get("Comment") or "").strip()
    if comment:
        story.extend([p("Коментар", ParagraphStyle("InvoiceCommentLabel", parent=normal, fontName="InvoiceSansBold")),
                      p(comment), Spacer(1, 5*mm)])
    labels = ["№", "Номенклатура / характеристика", "Виробнича характеристика", "Кількість", "Од.", "Коеф.", "Ціна", "Ручна знижка, %", "Авт. знижка, %", "Сума", "ПДВ"]
    rows = [[p(label, table_header) for label in labels]]
    for row in items:
        # Explicit line break separates item name from its specification.
        item = Paragraph(escape(str(row.get("ItemName") or "-")) + "<br/><font color='#64727e'>" + escape(str(row.get("Characteristic") or "")) + "</font>", normal)
        values = [p(int(row["LineNumber"])), item, p(row.get("ProductionCharacteristic")),
                  p(f"{row['Quantity']:g}", numeric), p(row.get("Unit")), p(f"{row['Coefficient']:g}", numeric),
                  p(amount(row["Price"]), numeric), p(f"{row['ManualDiscountPercent']:g}", numeric),
                  p(f"{row['AutoDiscountPercent']:g}", numeric), p(amount(row["Amount"]), numeric), p(amount(row["VATAmount"]), numeric)]
        rows.append(values)
    widths = [9, 63, 39, 20, 11, 14, 23, 20, 20, 27, 23]
    table = LongTable(rows, colWidths=[width*mm for width in widths], repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#466e89")),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f3f6f8")]),
        ("LINEBELOW", (0,1), (-1,-1), .3, colors.HexColor("#dce3e8")),
        ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    story.append(table)
    total_style = ParagraphStyle("InvoiceTotal", parent=numeric, fontName="InvoiceSansBold", fontSize=13, leading=18)
    summary = Table([
        [p(f"Товарних позицій: {totals['LineCount']}"), p(f"Сума товарів: {amount(Decimal(totals['GoodsAmount']))} {currency}", numeric)],
        [p("ПДВ включено в суму" if document.get("SumIncludesVAT") else "ПДВ нараховується зверху", muted), p(f"ПДВ товарів: {amount(Decimal(totals['VATAmount']))} {currency}", numeric)],
        [p("Сума документа", normal), p(f"{amount(document.get('DocumentAmount'))} {currency}", total_style)],
    ], colWidths=[140*mm,129*mm])
    summary.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"), ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6), ("LINEABOVE",(0,2),(-1,2),1,colors.HexColor("#b4d947"))]))
    story.append(KeepTogether([Spacer(1, 5*mm), summary, Spacer(1, 3*mm),
        p("Відомість товарних позицій рахунку з порталу. Банківські реквізити та послуги в цій відомості не відображаються.", muted)]))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("InvoiceSans", 7)
        canvas.setFillColor(colors.HexColor("#64727e"))
        canvas.drawString(14*mm, 9*mm, f"Вікна Стиль | Рахунок {number}")
        canvas.drawRightString(page[0]-14*mm, 9*mm, f"Сторінка {doc.page}")
        canvas.restoreState()

    pdf.build(story, onFirstPage=footer, onLaterPages=footer)
    stream.seek(0)
    return stream
