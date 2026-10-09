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
    from reportlab.lib.pagesizes import A4
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
    document = SimpleDocTemplate(stream, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = [Paragraph("Доставки замовлень", title)]
    groups = {}
    for row in sorted(rows, key=lambda item: (item["day"], item["time"])):
        groups.setdefault(row["day"], []).append(row)
    for day, items in groups.items():
        story.append(Paragraph(".".join(reversed(day.split("-"))), heading))
        data = [[Paragraph(text, style) for text in ["Час", "Замовлення", "Прорахунок", "Дилер", "Констр."]]]
        for item in items:
            data.append([Paragraph(escape(str(item.get(key, ""))), style) for key in ["time", "number", "calculation", "dealer", "count"]])
        data.append([Paragraph("Разом за дату", style), "", "", "", Paragraph(str(construction_total(items)), style)])
        table = Table(data, colWidths=[40, 82, 105, 252, 56], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#edf2f5")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), .3, colors.HexColor("#ccd5dc")), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        table.setStyle(TableStyle([("SPAN", (0, -1), (3, -1)), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#edf2f5"))]))
        story.extend([table, Spacer(1, 6)])
    story.append(Paragraph(f"Усього конструкцій: {construction_total(rows)}", heading))
    missing_counts = sum(not str(row.get("count", "")).strip() for row in rows)
    if missing_counts:
        story.append(Paragraph(f"Без зазначеної кількості конструкцій: {missing_counts} замовлень (не враховано в підсумку).", style))
    def footer(canvas, doc):
        canvas.setFont("DeliveryManrope", 8)
        canvas.drawRightString(A4[0] - 30, 16, str(doc.page))
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
            hour = time.fromisoformat(row["time"]).strftime("%H:%M")
            count = str(row.get("count") if row.get("count") is not None else "").strip()
            if count:
                numeric_count = Decimal(count)
                if not numeric_count.is_finite() or numeric_count < 0 or numeric_count != numeric_count.to_integral_value() or numeric_count > 1000000:
                    raise ValueError("Invalid construction count")
                count = str(int(numeric_count))
            clean.append({"day": day, "time": hour, "count": count, **{key: str(row.get(key, ""))[:500] for key in ["number", "dealer", "calculation"]}})
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
