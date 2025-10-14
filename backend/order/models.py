# from django.db import models
# from users.models import CustomUser
# # from organizations_and_regions import Organization


# class Status(models.Model):
#     name = models.CharField(max_length=255)

# class Order(models.Model):
#     order_number = models.CharField(max_length=255)
#     order_date_create = models.DateTimeField()
#     order_date_progress = models.DateTimeField(null=True, blank=True)
#     order_date_complete = models.DateTimeField(null=True, blank=True)

#     # користувачі через CustomUser
#     customer = models.ForeignKey(
#         CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
#         limit_choices_to={'role': 'customer'},
#         related_name='customer_orders'  # <- унікальний related_name
#     )
#     manager = models.ForeignKey(
#         CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
#         limit_choices_to={'role': 'manager'},
#         related_name='manager_orders'  # <- унікальний related_name
#     )
#     dealer = models.ForeignKey(
#         CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
#         related_name='dealer_orders',
#         limit_choices_to={'role': 'dealer'}
#     )

#     status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True)
#     order_number_constructions = models.FloatField(default=0)
#     last_message_time = models.DateTimeField(null=True, blank=True)
#     file = models.CharField(max_length=255, blank=True, null=True)


# class OrderMessage(models.Model):
#     order = models.ForeignKey(Order, on_delete=models.CASCADE)
#     writer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
#     message_time = models.DateTimeField()
#     message = models.TextField()

# class Db1SOrderNumber(models.Model):
#     number = models.CharField(max_length=255, blank=True, null=True)
#     status = models.CharField(max_length=255, blank=True, null=True)
#     confirm = models.BooleanField(default=False)
#     payed = models.BooleanField(default=False)
#     date_payed = models.DateTimeField(null=True, blank=True)
#     date_create = models.DateTimeField()
#     number_constr = models.FloatField()
#     order_image = models.BinaryField(null=True, blank=True)
#     order = models.ForeignKey(
#         Order, on_delete=models.SET_NULL, null=True, blank=True,
#         related_name='db1s_numbers'
#     )

#     def __str__(self):
#         return self.number or f'1C Order #{self.pk}'
from django.db import models
import datetime
from users.models import CustomUser
import os

from django.utils.text import slugify

import os
import uuid
from django.utils import timezone

import os
from uuid import UUID

def order_file_path(instance, filename):
    """
    Формує шлях для збереження файлу замовлення.
    orders/<user_id_1C>/<order_number>/<filename>
    """
    # Беремо user_id_1C і перетворюємо у UUID (якщо у тебе у моделі BinaryField)
    user_id_1C_bytes = instance.customer.user_id_1C
    if user_id_1C_bytes:
        try:
            # Перетворюємо bytes у UUID
            user_id_1C_uuid = UUID(bytes=user_id_1C_bytes)
        except Exception:
            # якщо не вдається перетворити, просто hex
            user_id_1C_uuid = user_id_1C_bytes.hex()
    else:
        user_id_1C_uuid = "unknown_user"

    order_number = instance.order_number or "unknown_order"

    return os.path.join("orders", str(user_id_1C_uuid), str(order_number), filename)


# class OrdersUnified(models.Model):
#     RECORD_TYPES = [
#         ('Order', 'Order'),
#         ('Complaint', 'Complaint'),
#         ('OrderPart', 'OrderPart'),
#     ]

#     record_id = models.AutoField(primary_key=True)  # Унікальний ключ
#     record_type = models.CharField(max_length=20, choices=RECORD_TYPES)

#     # Уніфіковані ключові поля
#     order_number = models.TextField(null=True, blank=True)
#     customer_id = models.ForeignKey(
#         CustomUser,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         db_column='customer_id'
#     )

#     parent_order = models.ForeignKey(
#         'self',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='related_records',
#         help_text='Вказує на основне замовлення для скарг або дозамовлень'
#     )


#     # manager_id = models.CharField(max_length=128, null=True, blank=True)
#     # status_id = models.IntegerField(null=True, blank=True)

#     # Уніфіковані дати
#     create_date = models.DateTimeField(null=True, blank=True)       # OrderDateCreate / ComplaintDate / OrderPartsDate
#     progress_date = models.DateTimeField(null=True, blank=True)     # OrderDateProgress / ComplaintWorkStartDate / OrderPartsDepartureDate
#     complete_date = models.DateTimeField(null=True, blank=True)     # OrderDateComplete / ComplaintCompleteDate / OrderPartsDeliveryDate
#     deliver_date = models.DateTimeField(null=True, blank=True)      # ComplaintOrderDeliverDate / OrderPartsDeliveryDate
#     define_date = models.DateTimeField(null=True, blank=True)       # ComplaintOrderDefineDate
#     last_message_time = models.DateTimeField(null=True, blank=True) # тільки Orders

#     # Описові поля
#     description = models.TextField(null=True, blank=True)           # ComplaintDescription / OrderPartsDescription
#     result = models.TextField(null=True, blank=True)                # ComplaintResult
#     object_name = models.TextField(null=True, blank=True)           # ComplaintObject
#     file = models.FileField(upload_to=order_file_path, null=True, blank=True)
#            # тільки Orders

#     # Додаткові специфічні атрибути
#     reason_id = models.IntegerField(null=True, blank=True)          # OrderPartsReasonId
#     item_id = models.IntegerField(null=True, blank=True)            # OrderPartsItemId

#     act_number = models.TextField(null=True, blank=True)            # ComplaintActNumber
#     act_date = models.DateTimeField(null=True, blank=True)          # ComplaintActDate
#     complaint_1c_order = models.TextField(null=True, blank=True)    # Complaint1cOrder
#     urgent = models.BooleanField(null=True, blank=True)             # ComplaintUrgent
#     order_number_contructions = models.FloatField(null=True, blank=True)  # Orders
#     # order_portal_user_id = models.CharField(max_length=128, null=True, blank=True)  # Orders
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "OrdersUnified"


class Order(models.Model):
    order_number = models.CharField(max_length=255)
    customer = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders"
    )
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_orders"
    )
    create_date = models.DateTimeField(default=timezone.now)   # коли створено
    progress_date = models.DateTimeField(null=True, blank=True)  # в роботі
    complete_date = models.DateTimeField(null=True, blank=True)  # завершено

    # last_message_time = models.DateTimeField(null=True, blank=True)

    order_number_constructions = models.FloatField(default=0)

    # description = models.TextField(null=True, blank=True)
    file = models.TextField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Orders"
        ordering = ["-create_date"]
        constraints = [
            models.UniqueConstraint(
                fields=['order_number', 'customer'],
                name='unique_order_per_customer'
            )
        ]

    def __str__(self):
        return f"Order #{self.order_number}"



from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

class Message(models.Model):
    # Generic ForeignKey для будь-якого об'єкта
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    writer = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='messages'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "Message"
        ordering = ['created_at']
        verbose_name = 'Коментар'
        verbose_name_plural = 'Коментарі'

    def __str__(self):
        if self.writer:
            return f"{self.writer.full_name} ({self.created_at:%d.%m.%Y %H:%M}): {self.message[:30]}"
        return f"Anonymous ({self.created_at:%d.%m.%Y %H:%M}): {self.message[:30]}"
