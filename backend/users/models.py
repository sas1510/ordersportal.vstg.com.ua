
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
# from .models import CustomUser
from datetime import timedelta


class CustomUser(AbstractUser):
    # існуючі поля
    first_name = None
    last_name = None


    username = models.CharField(max_length=150, unique=True, verbose_name="Логін")
    full_name = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    # фото користувача
    # avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Фото користувача")

    # інші поля…
    # register_date = models.DateTimeField(blank=True, null=True)
    expire_date = models.DateTimeField(blank=True, null=True)
    enable = models.BooleanField(default=True)
    email_confirmed = models.BooleanField(default=False)
    phone_number_confirmed = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    # lockout_end_date = models.DateTimeField(blank=True, null=True)
    # lockout_enabled = models.BooleanField(default=False)
    access_failed_count = models.IntegerField(default=0)
    
    ROLE_CHOICES = [
        ("admin", "Адміністратор"),
        ("manager", "Менеджер"),
        ("operator", "Оператор"),
        ("director", "Директор"),
        ("region_manager", "Регіональний менеджер"),
        ("complaint_manager", "Менеджер скарг"),
        ("customer", "Клієнт"),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="customer")

    # region = models.ForeignKey("organizations_and_regions.Region", on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey("organizations_and_regions.Organization", on_delete=models.SET_NULL, null=True, blank=True)
    # manager = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="clients")
    # region_manager = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="dealers")
    
    user_id_1C = models.BinaryField(max_length=255, null=True, blank=True)
    auto_confirm_order = models.BooleanField(default=False)
    permit_finance_info = models.BooleanField(default=False)
    # guid = models.CharField(max_length=255, null=True, blank=True)
    update_time = models.DateTimeField(auto_now=True)

    
    def __str__(self):
        return f"{self.username} ({self.role})"
    

    class Meta:
        db_table = 'Users'


def default_expire_at():
    return timezone.now() + timedelta(days=1)


class Invitation(models.Model):
    # GUID контрагента 1С – буде кодом запрошення
    code = models.CharField(max_length=50, unique=True, verbose_name="GUID з 1С")
    
    # Зв’язок через user_id_1C
    user_id_1C = models.BinaryField(max_length=255, null=True, blank=True)
    
    # Статус використання інвайту
    used = models.BooleanField(default=False)
    
    # Дата створення і використання
    created_at = models.DateTimeField(default=timezone.now)
    used_at = models.DateTimeField(null=True, blank=True)
    expire_at = models.DateTimeField(default=default_expire_at, verbose_name="Термін дії")


    def mark_as_used(self):
        from .models import CustomUser

        if self.expire_at and self.expire_at < timezone.now():
            raise ValueError("Інвайт закінчив термін дії")

        self.used = True
        self.used_at = timezone.now()

        try:
            user = CustomUser.objects.get(user_id_1C=self.user_id_1C)
            user.enable = True
            user.save()
        except CustomUser.DoesNotExist:
            pass

        self.save()

    def __str__(self):
        return f"Invite for user_id_1C={self.user_id_1C} ({'used' if self.used else 'active'})"

    class Meta:
        db_table = 'Invitations'
        ordering = ['-created_at']
