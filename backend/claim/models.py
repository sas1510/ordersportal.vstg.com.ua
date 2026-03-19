# from django.db import models
# from users.models import CustomUser, Organization
# # from order.models import Customer, Manager, Status



# class ComplaintIssue(models.Model):
#     text = models.TextField(blank=True, null=True)
#     guid = models.CharField(max_length=255, blank=True, null=True)
#     enabled = models.BooleanField(default=True)

# class ComplaintSolution(models.Model):
#     issue = models.ForeignKey(ComplaintIssue, on_delete=models.SET_NULL, null=True)
#     guid = models.CharField(max_length=255, blank=True, null=True)
#     text = models.TextField(blank=True, null=True)
#     enabled = models.BooleanField(default=True)

# class Complaint(models.Model):
#     complaint_date = models.DateTimeField()
#     order_number = models.CharField(max_length=255, blank=True, null=True)
#     act_number = models.CharField(max_length=255, blank=True, null=True)
#     act_date = models.DateTimeField(null=True, blank=True)
#     description = models.TextField(blank=True, null=True)
#     order_deliver_date = models.DateTimeField()
#     order_define_date = models.DateTimeField()
#     object_description = models.TextField(blank=True, null=True)
#     complete_date = models.DateTimeField()
#     customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
#     manager = models.ForeignKey(Manager, on_delete=models.SET_NULL, null=True, blank=True)
#     result = models.TextField(blank=True, null=True)
#     status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True)
#     work_start_date = models.DateTimeField()
#     urgent = models.BooleanField(default=False)

# class ComplaintDecision(models.Model):
#     complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)
#     create_date = models.DateTimeField()
#     issue = models.ForeignKey(ComplaintIssue, on_delete=models.SET_NULL, null=True)
#     solution = models.ForeignKey(ComplaintSolution, on_delete=models.SET_NULL, null=True)
#     customer_approve = models.BooleanField(default=False)
#     manager_approve = models.BooleanField(default=False)
#     final_approve_date = models.DateTimeField(null=True, blank=True)
#     description = models.TextField(blank=True, null=True)

# class ComplaintOrderSeries(models.Model):
#     complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)
#     order_id = models.IntegerField(null=True, blank=True)
#     serie_guid = models.CharField(max_length=255, blank=True, null=True)
#     serie_name = models.CharField(max_length=255, blank=True, null=True)

# class ComplaintPhoto(models.Model):
#     complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)
#     photo = models.BinaryField(null=True, blank=True)
#     photo_name = models.CharField(max_length=255, blank=True, null=True)
#     upload_complete = models.BooleanField(default=False)
#     photo_ico = models.BinaryField(null=True, blank=True)
#     photo_size = models.IntegerField(default=0)

# class ComplaintMessage(models.Model):
#     complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)
#     writer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
#     message_time = models.DateTimeField()
#     message = models.TextField()

# # # Create your models here.
# # class Claim(models.Model):
# #     claim_number = models.CharField(max_length=50, verbose_name="Номер рекламації")
# #     order = models.ForeignKey('order.Order', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Замовлення")  # нове поле
# #     order_delivery_date = models.DateField(null=True, blank=True, verbose_name="Дата доставки замовлення")  # нове поле
# #     date_created = models.DateTimeField(auto_now_add=True, verbose_name="Дата визначення рекламації")

# #     # Причина рекламації
# #     REASON_CHOICES = [
# #         ('defect', 'Брак'),
# #         ('wrong_item', 'Неправильне замовлення'),
# #         ('missing_parts', 'Відсутні деталі'),
# #         ('other', 'Інше'),
# #     ]
# #     reason = models.CharField(max_length=50, choices=REASON_CHOICES, verbose_name="Причина рекламації", blank=True)

# #     comment = models.TextField(verbose_name="Опис рекламації", blank=True)

# #     # Варіанти вирішення
# #     SOLUTION_CHOICES = [
# #         ('replace', 'Заміна'),
# #         ('repair', 'Ремонт'),
# #         ('discount', 'Знижка'),
# #         ('none', 'Немає рішення'),
# #     ]
# #     solution = models.CharField(max_length=50, choices=SOLUTION_CHOICES, verbose_name="Вирішення", blank=True)

# #     dealer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, verbose_name="Контрагент")
# #     organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, verbose_name="Організація")
# #     status = models.CharField(max_length=100, verbose_name="Статус")

# #     photo = models.ImageField(upload_to="claims/photos/", null=True, blank=True, verbose_name="Фото рекламації")

# #     def __str__(self):
# #         return self.claim_number



# # class ClaimComment(models.Model):
# #     claim = models.ForeignKey('Claim', on_delete=models.CASCADE, related_name='comments', verbose_name="Рекламація")
# #     author = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, verbose_name="Автор")
# #     created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата коментаря")
# #     text = models.TextField(verbose_name="Текст коментаря")

# #     class Meta:
# #         ordering = ['-created_at']  # новіші коментарі першими

# #     def __str__(self):
# #         author_name = self.author.first_last_name if self.author else "Невідомо"
# #         return f"[{self.created_at.strftime('%d.%m.%Y %H:%M')}]::{author_name} → {self.text[:30]}"
