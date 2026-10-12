from io import BytesIO
from decimal import Decimal, InvalidOperation
import logging
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

logger = logging.getLogger(__name__)


class PdfFontError(RuntimeError):
    pass


def construction_total(rows):
    return sum((Decimal(str(row.get("count") or "0")) for row in rows), Decimal(0))


def money_text(value, currency):
    if value is None:
        return "—"
    return f"{value:,.2f}".replace(",", " ").replace(".", ",") + " " + currency


def deliveries_font_path():
    relative = Path("assets/fonts/Manrope/Manrope-Regular.ttf")
    project_root = Path(__file__).resolve().parents[2]
    candidates = [
        project_root / "frontend/public" / relative,
        project_root / "frontend/dist" / relative,
        Path(settings.BASE_DIR) / "frontend/public" / relative,
        Path(settings.BASE_DIR).parent / "frontend/public" / relative,
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise PdfFontError("No Cyrillic PDF font found")

def build_deliveries_pdf(rows):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont, TTFError
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    if "DeliveryManrope" not in pdfmetrics.getRegisteredFontNames():
        try:
            pdfmetrics.registerFont(TTFont("DeliveryManrope", str(deliveries_font_path())))
        except TTFError as exc:
            raise PdfFontError("Unable to load PDF font") from exc
    style = ParagraphStyle("delivery", fontName="DeliveryManrope", fontSize=9, leading=13)
    title = ParagraphStyle("deliveryTitle", parent=style, fontSize=16, leading=22, spaceAfter=12)
    heading = ParagraphStyle("deliveryDay", parent=style, fontSize=12, leading=17, spaceBefore=12, spaceAfter=6)
    stream = BytesIO()
    page_size = landscape(A4)
    document = SimpleDocTemplate(stream, pagesize=page_size, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = [Paragraph("Доставки замовлень", title)]
    groups = {}
    for row in sorted(rows, key=lambda item: (item["day"], item["time"])):
        groups.setdefault(row["day"], []).append(row)
    for day, items in groups.items():
        story.append(Paragraph(".".join(reversed(day.split("-"))), heading))
        data = [[Paragraph(text, style) for text in ["Час", "Замовлення", "Прорахунок", "Дилер", "Констр.", "Сума замовлення", "Оплачено", "Борг"]]]
        for item in items:
            cells = [str(item.get(key, "")) for key in ["time", "number", "calculation", "dealer", "count"]]
            cells.extend(money_text(item.get(key), item.get("currency", "")) for key in ["amount", "paid", "debt"])
            data.append([Paragraph(escape(cell), style) for cell in cells])
        data.append([Paragraph("Разом за дату", style), "", "", "", Paragraph(str(construction_total(items)), style), "", "", ""])
        table = Table(data, colWidths=[38, 80, 90, 225, 48, 100, 100, 100], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf2f5")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), .3, colors.HexColor("#ccd5dc")), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        table.setStyle(TableStyle([("SPAN", (0, -1), (3, -1)), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#edf2f5"))]))
        story.extend([table, Spacer(1, 6)])
    story.append(Paragraph(f"Усього конструкцій: {construction_total(rows)}", heading))
    totals = {}
    for row in rows:
        currency = row.get("currency", "")
        if not currency or any(row.get(key) is None for key in ["amount", "paid", "debt"]):
            continue
        total = totals.setdefault(currency, {key: Decimal(0) for key in ["amount", "paid", "debt"]})
        for key in total:
            total[key] += row[key]
    for currency, total in totals.items():
        story.append(Paragraph(escape(f"Разом ({currency}): сума замовлень {money_text(total['amount'], currency)}; оплачено {money_text(total['paid'], currency)}; борг {money_text(total['debt'], currency)}"), style))
    missing_counts = sum(not str(row.get("count", "")).strip() for row in rows)
    if missing_counts:
        story.append(Paragraph(f"Без зазначеної кількості конструкцій: {missing_counts} замовлень (не враховано в підсумку).", style))
    def footer(canvas, doc):
        canvas.setFont("DeliveryManrope", 8)
        canvas.drawRightString(page_size[0] - 30, 16, str(doc.page))
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return stream.getvalue()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def deliveries_pdf(request):
    # Export the already accessible, filtered list supplied by the browser.
    # This endpoint does not query additional orders or change any data.
    from datetime import date, time
    rows = request.data.get("rows")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 10000:
        return Response({"error": "Виберіть від 1 до 10000 замовлень."}, status=400)
    clean = []
    try:
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError("Invalid row")
            day = date.fromisoformat(row["day"]).isoformat()
            hour = time.fromisoformat(row["time"]).strftime("%H:%M") if row.get("time") else ""
            count = str(row.get("count") if row.get("count") is not None else "").strip()
            if count:
                numeric_count = Decimal(count)
                if not numeric_count.is_finite() or numeric_count < 0 or numeric_count != numeric_count.to_integral_value() or numeric_count > 1000000:
                    raise ValueError("Invalid construction count")
                count = str(int(numeric_count))
            financial = {}
            for key in ["amount", "paid"]:
                raw_value = row.get(key)
                value = Decimal(str(raw_value)) if raw_value not in (None, "") else None
                if value is not None and (not value.is_finite() or abs(value) > Decimal("1000000000000")):
                    raise ValueError("Invalid amount")
                financial[key] = value
            financial["debt"] = max(Decimal(0), financial["amount"] - financial["paid"]) if all(value is not None for value in financial.values()) else None
            currency = str(row.get("currency") or "").strip()[:20]
            currency = {"грн": "UAH", "грн.": "UAH", "€": "EUR", "$": "USD"}.get(currency.lower(), currency.upper())
            clean.append({"day": day, "time": hour, "count": count, "currency": currency, **financial, **{key: str(row.get(key, ""))[:500] for key in ["number", "dealer", "calculation"]}})
    except (TypeError, ValueError, KeyError, InvalidOperation):
        return Response({"error": "Некоректні дані доставок."}, status=400)
    try:
        data = build_deliveries_pdf(clean)
    except (ImportError, OSError, PdfFontError):
        logger.exception("Failed to initialize deliveries PDF export")
        return Response({"error": "Не вдалося сформувати PDF: недоступний шрифт або модуль експорту. Зверніться до адміністратора."}, status=503)
    response = HttpResponse(data, content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="deliveries.pdf"'
    return response
