from django.db import models
from users.models import CustomUser
# from organizations_and_regions import Organization


class Status(models.Model):
    name = models.CharField(max_length=255)

class Order(models.Model):
    order_number = models.CharField(max_length=255)
    order_date_create = models.DateTimeField()
    order_date_progress = models.DateTimeField(null=True, blank=True)
    order_date_complete = models.DateTimeField(null=True, blank=True)

    # користувачі через CustomUser
    customer = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'customer'},
        related_name='customer_orders'  # <- унікальний related_name
    )
    manager = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        limit_choices_to={'role': 'manager'},
        related_name='manager_orders'  # <- унікальний related_name
    )
    dealer = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='dealer_orders',
        limit_choices_to={'role': 'dealer'}
    )

    status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True)
    order_number_constructions = models.FloatField(default=0)
    last_message_time = models.DateTimeField(null=True, blank=True)
    file = models.CharField(max_length=255, blank=True, null=True)


class OrderMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    writer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    message_time = models.DateTimeField()
    message = models.TextField()

class Db1SOrderNumber(models.Model):
    number = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=255, blank=True, null=True)
    confirm = models.BooleanField(default=False)
    payed = models.BooleanField(default=False)
    date_payed = models.DateTimeField(null=True, blank=True)
    date_create = models.DateTimeField()
    number_constr = models.FloatField()
    order_image = models.BinaryField(null=True, blank=True)
    order = models.ForeignKey(
        Order, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='db1s_numbers'
    )

    def __str__(self):
        return self.number or f'1C Order #{self.pk}'
