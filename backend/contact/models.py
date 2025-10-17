from django.db import models
from backend.users.models import CustomUser


class HelpServiceContact(models.Model):
    contact_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    telegram_id = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, verbose_name="Відділ")
    
    def __str__(self):
        return f"{self.contact_name} ({self.department})"

    class Meta:
        db_table = 'HelpServiceContacts'

class HelpServiceLog(models.Model):
    create_date = models.DateTimeField()
    contact_id = models.ForeignKey(HelpServiceContact, on_delete=models.CASCADE)
    success = models.BooleanField(default=False)
    call_type = models.IntegerField()
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)


    class Meta:
        db_table = 'HelpServiceLogs'