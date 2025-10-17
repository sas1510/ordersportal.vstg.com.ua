from django.db import models
from backend.users.models import CustomUser  # уніфікований користувач
from backend.order.models import Status

class OrderPartsItem(models.Model):
    name = models.CharField(max_length=255)
    guid = models.CharField(max_length=255, blank=True, null=True)

class OrderPartsReason(models.Model):
    name = models.CharField(max_length=255)
    guid = models.CharField(max_length=255, blank=True, null=True)

class OrderParts(models.Model):
    order_parts_date = models.DateTimeField()
    order_number = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    departure_date = models.DateTimeField(null=True, blank=True)
    # status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True)

    customer = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'role': 'customer'},
        related_name="order_parts_as_customer"  # <-- додано
    )
    # manager = models.ForeignKey(
    #     CustomUser, 
    #     on_delete=models.SET_NULL, 
    #     null=True, 
    #     blank=True,
    #     limit_choices_to={'role': 'manager'},
    #     related_name="order_parts_as_manager"  # <-- додано
    # )

    reason_guid = models.CharField(max_length=36, null=True, blank=True)  # GUID як рядок
    item_guid = models.CharField(max_length=36, null=True, blank=True)    # GUID як рядок

    # delivery_date = models.DateTimeField(null=True, blank=True)
    # order_parts_id = models.IntegerField()


# class Db1SOrderPartsNumber(models.Model):
#     number = models.CharField(max_length=255, blank=True, null=True)
#     status = models.CharField(max_length=255, blank=True, null=True)
#     confirm = models.BooleanField(default=False)
#     payed = models.BooleanField(default=False)
#     date_payed = models.DateTimeField(null=True, blank=True)
#     date_create = models.DateTimeField()
#     order_image = models.BinaryField(null=True, blank=True)
#     order_parts = models.ForeignKey(
#         OrderParts, on_delete=models.CASCADE, related_name='db1s_parts_numbers'
#     )

#     def __str__(self):
#         return self.number or f'1C Parts Order #{self.pk}'
