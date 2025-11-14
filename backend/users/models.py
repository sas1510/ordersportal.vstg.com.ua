from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from datetime import timedelta
# from .models import CustomUser

from django.db import models
from django.contrib.auth.models import AbstractUser, Group
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):

    id = models.BigAutoField(primary_key=True, db_column='ID')
    # Базові поля AbstractUser з перевизначенням імен колонок
    password = models.CharField(_('password'), max_length=128, db_column='Password')
    last_login = models.DateTimeField(_('last login'), blank=True, null=True, db_column='LastLogin')
    is_superuser = models.BooleanField(_('superuser status'), default=False, db_column='IsSuperuser')
    email = models.EmailField(_('email address'), blank=True, db_column='Email')
    is_staff = models.BooleanField(_('staff status'), default=False, db_column='IsStaff')
    is_active = models.BooleanField(_('active'), default=True, db_column='IsActive')
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now, db_column='DateJoined')

    # Видаляємо стандартні first_name / last_name
    first_name = None
    last_name = None

    # Логін
    
    username = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="Логін",
        db_column='Username'
    )


    # Кастомні поля
    full_name = models.CharField(max_length=255, blank=True, null=True, db_column='FullName')
    phone_number = models.CharField(max_length=20, blank=True, null=True, db_column='PhoneNumber')
    expire_date = models.DateTimeField(blank=True, null=True, db_column='ExpireDate')

    ROLE_CHOICES = [
        ("admin", "Адміністратор"),
        ("manager", "Менеджер"),
        ("operator", "Оператор"),
        ("director", "Директор"),
        ("region_manager", "Регіональний менеджер"),
        ("complaint_manager", "Менеджер скарг"),
        ("customer", "Клієнт"),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="customer", db_column='Role')

    user_id_1C = models.BinaryField(max_length=255, null=True, blank=True, db_column='UserId1C')
    permit_finance_info = models.BooleanField(default=False, db_column='PermitFinanceInfo')
    update_time = models.DateTimeField(auto_now=True, db_column='UpdateTime')
    old_portal_id = models.CharField(max_length=450, null=True, blank=True, db_index=True, db_column='OldPortalId')

    def save(self, *args, **kwargs):
        # Авто деактивація при простроченні
        if self.expire_date and self.expire_date < timezone.now():
            self.is_active = False

        super().save(*args, **kwargs)

        # Синхронізація role → Django Group
        if self.role:
            group, _ = Group.objects.get_or_create(name=self.role)
            self.groups.set([group])

    def __str__(self):
        return f"{self.username} ({self.role})"

    class Meta:
        db_table = 'User'

# class CustomUser(AbstractUser):
#     # -----------------------------------------------------------------
#     # Поля, успадковані від AbstractUser, перевизначені для db_column
#     # -----------------------------------------------------------------

#     # З AbstractBaseUser
#     password = models.CharField(_('password'), max_length=128, db_column='Password')
#     last_login = models.DateTimeField(_('last login'), blank=True, null=True, db_column='LastLogin')

#     # З PermissionsMixin
#     is_superuser = models.BooleanField(
#         _('superuser status'),
#         default=False,
#         help_text=_(
#             'Designates that this user has all permissions without '
#             'explicitly assigning them.'
#         ),
#         db_column='IsSuperuser'
#     )
    
#     # З AbstractUser
#     # 'username' визначено нижче, оскільки воно було у вашому коді
#     first_name = None  # Вимкнено, як ви і просили
#     last_name = None   # Вимкнено, як ви і просили
#     email = models.EmailField(_('email address'), blank=True, db_column='Email')
#     is_staff = models.BooleanField(
#         _('staff status'),
#         default=False,
#         help_text=_('Designates whether the user can log into this admin site.'),
#         db_column='IsStaff'
#     )
#     is_active = models.BooleanField(
#         _('active'),
#         default=True,
#         help_text=_(
#             'Designates whether this user should be treated as active. '
#             'Unselect this instead of deleting accounts.'
#         ),
#         db_column='IsActive'
#     )
#     date_joined = models.DateTimeField(_('date joined'), default=timezone.now, db_column='DateJoined')

#     # Примітка: Поля ManyToManyFields (groups, user_permissions) 
#     # не перевизначені, оскільки 'db_column' до них не застосовується.
#     # Вони створюють окремі таблиці зв'язків.

#     # -----------------------------------------------------------------
#     # Ваші власні поля
#     # -----------------------------------------------------------------

#     username = models.CharField(
#         _('username'),
#         max_length=150,
#         unique=True,
#         verbose_name="Логін",
#         db_column='Username' # 'username' вже по суті camelCase
#     )
#     full_name = models.CharField(
#         max_length=255, 
#         blank=True, 
#         null=True, 
#         db_column='FullName'
#     )
#     phone_number = models.CharField(
#         max_length=20, 
#         blank=True, 
#         null=True, 
#         db_column='PhoneNumber'
#     )
    
#     # avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="Фото користувача", db_column='avatar')

#     expire_date = models.DateTimeField(blank=True, null=True, db_column='ExpireDate')
#     # enable = models.BooleanField(default=True, db_column='Enable')
#     # email_confirmed = models.BooleanField(default=False, db_column='EmailConfirmed')
#     # phone_number_confirmed = models.BooleanField(default=False, db_column='PhoneNumberConfirmed')
#     # two_factor_enabled = models.BooleanField(default=False, db_column='twoFactorEnabled')
#     # access_failed_count = models.IntegerField(default=0, db_column='accessFailedCount')
    
#     ROLE_CHOICES = [
#         ("admin", "Адміністратор"),
#         ("manager", "Менеджер"),
#         ("operator", "Оператор"),
#         ("director", "Директор"),
#         ("region_manager", "Регіональний менеджер"),
#         ("complaint_manager", "Менеджер скарг"),
#         ("customer", "Клієнт"),
#     ]
#     role = models.CharField(
#         max_length=30, 
#         choices=ROLE_CHOICES, 
#         default="customer",
#         db_column='Role'
#     )

#     # organization = models.ForeignKey(
#     #     "organizations_and_regions.Organization", 
#     #     on_delete=models.SET_NULL, 
#     #     null=True, 
#     #     blank=True,
#     #     db_column='organizationId' # Django автоматично додав би _id, тому ми вказуємо повну назву
#     # )
    
#     user_id_1C = models.BinaryField(max_length=255, null=True, blank=True, db_column='UserId1C')
#     # auto_confirm_order = models.BooleanField(default=False, db_column='autoConfirmOrder')
#     permit_finance_info = models.BooleanField(default=False, db_column='PermitFinanceInfo')
#     update_time = models.DateTimeField(auto_now=True, db_column='UpdateTime')
#     old_portal_id = models.CharField(
#         max_length=128, 
#         null=True, 
#         blank=True, 
#         db_index=True, 
#         verbose_name="Старий User ID",
#         db_column='OldPortalId'
#     )

#     # telegram_id = models.CharField(
#     #     max_length=50,
#     #     blank=True,
#     #     null=True,
#     #     verbose_name="Telegram ID",
#     #     db_column='TelegramId'
#     # )
    
#     # notify_telegram = models.BooleanField(
#     #     default=False,
#     #     verbose_name="Отримувати сповіщення в Telegram",
#     #     db_column='notifyTelegram'
#     # )

#     def __str__(self):
#         return f"{self.username} ({self.role})"

#     def save(self, *args, **kwargs):
#         # якщо ExpireDate є і вона минула → деактивуємо користувача
#         if self.expire_date and self.expire_date < timezone.now():
#             self.is_active = False

#         super().save(*args, **kwargs)

#     from django.contrib.auth.models import Group

#     def save(self, *args, **kwargs):
#         # Перевірка `expire_date`
#         if self.expire_date and self.expire_date < timezone.now():
#             self.is_active = False

#         super().save(*args, **kwargs)

#         # Синхронізація role → Group
#         if self.role:
#             group, created = Group.objects.get_or_create(name=self.role)
#             self.groups.set([group])


#     class Meta:
#         # Назва таблиці в PascalCase
#         db_table = 'CustomUser'


def defaultExpireAt(): # Назва функції в camelCase
    return timezone.now() + timedelta(days=1)



class Invitation(models.Model):

    id = models.BigAutoField(primary_key=True, db_column='ID')
    code = models.CharField(
        max_length=50, 
        unique=True, 
        verbose_name="GUID з 1С",
        db_column='Code'
    )
    user_id_1C = models.BinaryField(
        max_length=255, 
        null=True, 
        blank=True, 
        db_column='UserId1C'
    )
    used = models.BooleanField(default=False, db_column='used')
    created_at = models.DateTimeField(default=timezone.now, db_column='createdAt')
    used_at = models.DateTimeField(null=True, blank=True, db_column='UsedAt')
    # expire_at = models.DateTimeField(
    #     default=defaultExpireAt, # Використовуємо функцію з camelCase
    #     verbose_name="Термін дії",
    #     db_column='ExpireAt'
    # )

    def markAsUsed(self): # Назва методу в camelCase
        from .models import CustomUser # Цей імпорт тут залишається, щоб уникнути циклічності

        # В Python-коді ми все ще використовуємо snake_case
        if timezone.now() > self.created_at + timedelta(hours=24):
            raise ValueError("Інвайт закінчив термін дії (пройшло 24 години)")

        self.used = True
        self.used_at = timezone.now()

        try:
            # Використовуємо snake_case для полів Django
            user = CustomUser.objects.get(user_id_1C=self.user_id_1C)
            user.is_active = True 
            user.save()
        except CustomUser.DoesNotExist:
            pass

        self.save()

    def __str__(self):
        # В Python-коді ми все ще використовуємо snake_case
        return f"Invite for user_id_1C={self.user_id_1C} ({'used' if self.used else 'active'})"

    class Meta:
        # Назва таблиці в PascalCase
        db_table = 'Invitation'
        # Поле для сортування має відповідати назві поля в Django (snake_case)
        ordering = ['-created_at']




