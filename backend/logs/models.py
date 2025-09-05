from django.db import models

# Create your models here.
class OrdersPortalLogging(models.Model):
    log_id = models.AutoField(primary_key=True, db_column='LogId')
    log_date_time = models.DateTimeField(db_column='LogDateTime')
    log_ip_address = models.TextField(null=True, blank=True, db_column='LogIpAddress')
    log_action = models.TextField(null=True, blank=True, db_column='LogAction')
    order_portal_user_id = models.CharField(max_length=128, null=True, blank=True, db_column='OrderPortalUser_Id')

    class Meta:
        db_table = 'OrdersPortalLoggings'