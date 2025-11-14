from django.db import models
from backend.users.models import CustomUser


class HelpServiceContact(models.Model):
    # Додаємо явне поле 'id' для узгодженості стилю БД
    id = models.BigAutoField(primary_key=True, db_column='ID')
    
    contact_name = models.CharField(max_length=255, db_column='ContactName')
    phone = models.CharField(max_length=50, blank=True, null=True, db_column='Phone')
    email = models.EmailField(blank=True, null=True, db_column='Email')
    telegram_id = models.CharField(max_length=255, blank=True, null=True, db_column='TelegramId')
    department = models.CharField(max_length=255, verbose_name="Відділ", db_column='Department')
    
    def __str__(self):
        # В коді Python все ще використовуються імена полів 'snake_case'
        return f"{self.contact_name} ({self.department})"

    class Meta:
        db_table = 'HelpServiceContact' # PascalCase назва таблиці

class HelpServiceLog(models.Model):
    # Додаємо явне поле 'id' для узгодженості стилю БД
    id = models.BigAutoField(primary_key=True, db_column='ID')
    
    create_date = models.DateTimeField(db_column='CreateDate')
    
    # Краще назвати поле 'contact', а не 'contact_id'
    contact = models.ForeignKey(
        HelpServiceContact, 
        on_delete=models.CASCADE,
        db_column='ContactID' # PascalCase колонка для ForeignKey
    )
    
    success = models.BooleanField(default=False, db_column='Success')
    call_type = models.IntegerField(db_column='CallType')
    
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        db_column='UserID' # PascalCase колонка для ForeignKey
    )

    class Meta:
        db_table = 'HelpServiceLog' # PascalCase назва таблиці