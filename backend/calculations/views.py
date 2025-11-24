import base64
import requests 
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# Припускаємо, що OrderCreateSerializer імпортовано коректно
from .serializers import OrderCreateSerializer 


# ====================================================================
# ІМІТОВАНА ФУНКЦІЯ ВІДПРАВКИ У ЗОВНІШНЮ СИСТЕМУ
# ====================================================================

def send_order_to_external_system(validated_data, uploaded_file):
    """
    ІМІТАЦІЯ: Відправка даних про прорахунок у 1С через SOAP/XML.
    """
    # ❗️ Залишаємо імітацію для цілей тестування
    external_id = f"1C_MOCK_{validated_data.get('order_number')}" 
    return external_id, None 


# ====================================================================
# ОСНОВНИЙ DRF VIEW (З УРАХУВАННЯМ РОЛЕЙ)
# ====================================================================

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        uploaded_file = request.FILES.get("file")
        now = timezone.now()

        # 1. ПЕРЕВІРКА ФАЙЛУ
        if not uploaded_file:
            return Response({"error": "Файл обов'язковий (file)"}, status=400)

        # 2. КОДУВАННЯ ФАЙЛУ В Base64
        try:
            file_bytes = uploaded_file.read()
            file_base64 = base64.b64encode(file_bytes).decode('utf-8')
        except Exception:
             return Response({"error": "Не вдалося прочитати або закодувати файл."}, status=400)

        # ВИЗНАЧЕННЯ РОЛЕЙ ТА КОМЕНТАРЯ
        role = user.role
        manager_roles = ["manager", "region_manager", "admin"]
        comment_text = request.data.get("Comment")


        # 3. ВИЗНАЧЕННЯ КЛІЄНТА (CUSTOMER) -- ЛОГІКА З РОЛЯМИ ВІДНОВЛЕНА
        customer_id = None
        
        if role in manager_roles:
            # Менеджер: клієнт має бути вказаний у CustomerId
            customer_id = request.data.get("CustomerId")
            if not customer_id:
                return Response({"error": "CustomerId є обов'язковим для менеджерів."}, status=400)
        else:
            # Звичайний користувач: клієнт - це сам користувач, використовуємо user_id_1C
            try:
                customer_id = user.user_id_1C
            except AttributeError:
                return Response({"error": "Об'єкт користувача не містить поля user_id_1C."}, status=400)
                
            if not customer_id:
                 return Response({"error": "Не знайдено ID контрагента (user_id_1C) для поточного користувача."}, status=400)
        
        if not customer_id:
            return Response({"error": "Не вдалося визначити ID клієнта."}, status=400)


        # 4. СЕРІАЛІЗАЦІЯ ТА ВАЛІДАЦІЯ
        serializer = OrderCreateSerializer(data={
            "order_number": request.data.get("OrderNumber"),
            "customer": customer_id, 
            # "author": author_id, <-- ВИДАЛЕНО
            "order_number_constructions": request.data.get("ConstructionsCount", 0),
            "file": file_base64, 
            "create_date": now,
        })

        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['comment'] = comment_text 
            
            # 5. ВІДПРАВКА В ЗОВНІШНЮ СИСТЕМУ (ІМІТАЦІЯ)
            external_id, error = send_order_to_external_system(validated_data, uploaded_file) 

            if error:
                return Response({
                    "error": "Помилка при створенні прорахунку у зовнішній програмі.", 
                    "details": error
                }, status=503)

            # 6. УСПІШНА ВІДПОВІДЬ
            return Response({
                "message": "Прорахунок успішно створено у зовнішній системі.",
                "external_id": external_id,
                "order_number": validated_data.get("order_number"),
                "file": uploaded_file.name 
            }, status=201)

        # 7. ПОМИЛКИ ВАЛІДАЦІЇ
        return Response(serializer.errors, status=400)

##подивитися пізніше 

# from django.shortcuts import render

# # Create your views here.
# import requests
# from django.utils import timezone

# def send_order_to_external_system(validated_data, uploaded_file):
#     """
#     Відправка даних про прорахунок у 1С через SOAP/XML.
#     """
#     # ⚠️ Змініть на реальні URL та метод вашого HTTP-сервісу 1С
#     EXTERNAL_API_URL = "http://1c-server/base/hs/ExchangeService/soap" 
#     SOAP_ACTION = "http://www.site.com/ExchangeService#СтворитиПрорахунок" # Це часто потрібно для 1С

#     # 1. Формування XML (використовуємо f-string для підстановки даних)
#     xml_template = """<?xml version="1.0" encoding="utf-8"?>
# <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
#                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
#                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
#     <soap:Body>
#         <ns1:СтворитиПрорахунок xmlns:ns1="http://www.site.com/ExchangeService">
#             <ns1:OrderData>
#                 <OrderNumber xsi:type="xsd:string">{order_number}</OrderNumber>
#                 <CustomerUID xsi:type="xsd:string">{customer}</CustomerUID>
#                 <AuthorUID xsi:type="xsd:string">{author}</AuthorUID>
#                 <ConstructionsCount xsi:type="xsd:int">{order_number_constructions}</ConstructionsCount>
#                 <Comment xsi:type="xsd:string">{comment}</Comment>
#                 <FileName xsi:type="xsd:string">{file_name}</FileName>
#                 <FileBase64 xsi:type="xsd:string">{file}</FileBase64>
#                 <CreateDate xsi:type="xsd:dateTime">{create_date}</CreateDate>
#             </ns1:OrderData>
#         </ns1:СтворитиПрорахунок>
#     </soap:Body>
# </soap:Envelope>"""
    
#     # Заповнення шаблону даними
#     xml_payload = xml_template.format(
#         order_number=validated_data.get("order_number", ""),
#         customer=validated_data.get("customer", ""),
#         author=validated_data.get("author", ""),
#         order_number_constructions=validated_data.get("order_number_constructions", 0),
#         comment=validated_data.get("comment", ""),
#         file_name=uploaded_file.name,
#         file=validated_data.get("file", ""), # Це вже Base64
#         create_date=validated_data.get("create_date").isoformat()
#     )

#     # 2. Встановлення HTTP-заголовків
#     headers = {
#         'Content-Type': 'text/xml; charset=utf-8',
#         'SOAPAction': SOAP_ACTION,
#         # Зазвичай потрібні дані для Basic Authentication (Логін/Пароль 1С)
#         # 'Authorization': 'Basic ' + base64.b64encode(b'user:password').decode('utf-8') 
#     }

#     # 3. Відправка запиту
#     try:
#         response = requests.post(
#             EXTERNAL_API_URL, 
#             data=xml_payload, 
#             headers=headers, 
#             timeout=30 # Може знадобитися більше часу для великих файлів
#         )
#         response.raise_for_status()

#         # 4. Обробка відповіді 1С (зазвичай це XML-відповідь)
#         # Для простоти ми перевіряємо лише HTTP статус, але в реальності
#         # потрібно парсити відповідь XML на наявність ExternalID або помилок 1С.
        
#         # Імітуємо отримання зовнішнього ID з відповіді 1С
#         external_id = f"1C_{validated_data.get('order_number')}" 
        
#         return external_id, None

#     except requests.RequestException as e:
#         error_msg = f"Помилка відправки SOAP у 1С: {e}. Відповідь: {getattr(response, 'text', 'N/A')}"
#         return None, error_msg