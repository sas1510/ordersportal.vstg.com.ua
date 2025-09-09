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

from django.utils.text import slugify
import os
import uuid

def order_file_path(instance, filename):
    name, ext = os.path.splitext(filename)
    # Замінюємо всі нелатинські символи на латинські
    safe_name = slugify(name, allow_unicode=False)
    if not safe_name:
        safe_name = uuid.uuid4().hex  # якщо після slugify нічого не лишилось
    timestamp = instance.create_date.strftime("%Y%m%d%H%M%S") if instance.create_date else ""
    return f"orders/{safe_name}_{timestamp}{ext}"

class OrdersUnified(models.Model):
    RECORD_TYPES = [
        ('Order', 'Order'),
        ('Complaint', 'Complaint'),
        ('OrderPart', 'OrderPart'),
    ]

    record_id = models.AutoField(primary_key=True)  # Унікальний ключ
    record_type = models.CharField(max_length=20, choices=RECORD_TYPES)

    # Уніфіковані ключові поля
    order_number = models.TextField(null=True, blank=True)
    customer_id = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='customer_id'
    )

    # manager_id = models.CharField(max_length=128, null=True, blank=True)
    # status_id = models.IntegerField(null=True, blank=True)

    # Уніфіковані дати
    create_date = models.DateTimeField(null=True, blank=True)       # OrderDateCreate / ComplaintDate / OrderPartsDate
    progress_date = models.DateTimeField(null=True, blank=True)     # OrderDateProgress / ComplaintWorkStartDate / OrderPartsDepartureDate
    complete_date = models.DateTimeField(null=True, blank=True)     # OrderDateComplete / ComplaintCompleteDate / OrderPartsDeliveryDate
    deliver_date = models.DateTimeField(null=True, blank=True)      # ComplaintOrderDeliverDate / OrderPartsDeliveryDate
    define_date = models.DateTimeField(null=True, blank=True)       # ComplaintOrderDefineDate
    last_message_time = models.DateTimeField(null=True, blank=True) # тільки Orders

    # Описові поля
    description = models.TextField(null=True, blank=True)           # ComplaintDescription / OrderPartsDescription
    result = models.TextField(null=True, blank=True)                # ComplaintResult
    object_name = models.TextField(null=True, blank=True)           # ComplaintObject
    file = models.FileField(upload_to=order_file_path, null=True, blank=True)
           # тільки Orders

    # Додаткові специфічні атрибути
    reason_id = models.IntegerField(null=True, blank=True)          # OrderPartsReasonId
    item_id = models.IntegerField(null=True, blank=True)            # OrderPartsItemId

    act_number = models.TextField(null=True, blank=True)            # ComplaintActNumber
    act_date = models.DateTimeField(null=True, blank=True)          # ComplaintActDate
    complaint_1c_order = models.TextField(null=True, blank=True)    # Complaint1cOrder
    urgent = models.BooleanField(null=True, blank=True)             # ComplaintUrgent
    order_number_contructions = models.FloatField(null=True, blank=True)  # Orders
    # order_portal_user_id = models.CharField(max_length=128, null=True, blank=True)  # Orders

    class Meta:
        db_table = "OrdersUnified"
