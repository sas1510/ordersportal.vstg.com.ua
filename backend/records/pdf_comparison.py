from io import BytesIO

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .pdf_amounts import extract_total


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extract_pdf_amount(request):
    if str(getattr(request.user, "role", "")) not in {"customer", "dealer", "admin", "manager", "region_manager"}:
        return Response({"error": "Немає доступу до порівняння."}, status=403)
    upload = request.FILES.get("file")
    if not upload or upload.size > 10 * 1024 * 1024:
        return Response({"error": "Потрібен PDF розміром до 10 МБ."}, status=400)
    data = upload.read()
    if not data.startswith(b"%PDF-"):
        return Response({"error": "Файл не є PDF."}, status=400)
    try:
        from pypdf import PdfReader
    except ImportError:
        return Response({"error": "Зчитування PDF ще не налаштоване на сервері."}, status=503)
    try:
        reader = PdfReader(BytesIO(data))
        if reader.is_encrypted or len(reader.pages) > 50:
            return Response({"status": "review", "reason": "Захищений або завеликий PDF потребує ручної перевірки."})
        texts = []
        for page in reader.pages:
            content = page.get_contents()
            if content and len(content.get_data()) > 5 * 1024 * 1024:
                return Response({"status": "review", "reason": "Завелика сторінка PDF потребує ручної перевірки."})
            texts.append(page.extract_text(extraction_mode="layout") or "")
        return Response(extract_total("\n".join(texts)))
    except Exception:
        return Response({"status": "review", "reason": "Не вдалося зчитати PDF. Потрібна ручна перевірка."})
