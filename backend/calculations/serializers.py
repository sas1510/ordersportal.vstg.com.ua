# Приклад OrderCreateSerializer
from rest_framework import serializers

class OrderCreateSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)
    customer = serializers.IntegerField() # Або CharField, якщо використовуєте UID
    author = serializers.IntegerField()   # Або CharField
    order_number_constructions = serializers.IntegerField(min_value=1)
    file = serializers.CharField() # Це Base64 рядок
    create_date = serializers.DateTimeField()
    # Якщо Comment не зберігається в Order, він може не бути тут, але
    # його валідація вже відбувається у View.