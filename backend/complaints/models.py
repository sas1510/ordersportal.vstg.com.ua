from django.db import models
from users.models import CustomUser
from order.models import Status

# --- Типи скарг ---
class ComplaintIssue(models.Model):
    text = models.TextField(blank=True, null=True)
    guid = models.CharField(max_length=255, blank=True, null=True)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.text or f"Issue #{self.pk}"
    
    class Meta:
        db_table = 'ComplaintIssue'

# --- Рішення по типу скарги ---
class ComplaintSolution(models.Model):
    issue = models.ForeignKey(ComplaintIssue, on_delete=models.SET_NULL, null=True)
    guid = models.CharField(max_length=255, blank=True, null=True)
    text = models.TextField(blank=True, null=True)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.text or f"Solution #{self.pk}"
    
    class Meta:
        db_table = 'ComplaintSolution'

# --- Скарга ---
class Complaint(models.Model):
    complaint_date = models.DateTimeField()
    order_number = models.CharField(max_length=255, blank=True, null=True)
    act_number = models.CharField(max_length=255, blank=True, null=True)
    act_date = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    order_deliver_date = models.DateTimeField()
    order_define_date = models.DateTimeField()
    object_description = models.TextField(blank=True, null=True)
    complete_date = models.DateTimeField()
    
    # замість Customer і Manager використовуємо CustomUser
    customer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_complaints")
    manager = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name="manager_complaints")
    
    result = models.TextField(blank=True, null=True)
    status = models.ForeignKey(Status, on_delete=models.SET_NULL, null=True)
    work_start_date = models.DateTimeField()
    urgent = models.BooleanField(default=False)

    def __str__(self):
        return f"Complaint #{self.pk} for order {self.order_number}"

    class Meta:
        db_table = 'Complaints'


# --- Рішення по скарзі ---
class ComplaintDecision(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="decisions")
    create_date = models.DateTimeField()
    issue = models.ForeignKey(ComplaintIssue, on_delete=models.SET_NULL, null=True)
    solution = models.ForeignKey(ComplaintSolution, on_delete=models.SET_NULL, null=True)
    customer_approve = models.BooleanField(default=False)
    manager_approve = models.BooleanField(default=False)
    final_approve_date = models.DateTimeField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'ComplaintDecisions'

# --- Серії замовлень по скарзі ---
class ComplaintOrderSeries(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="order_series")
    order_id = models.IntegerField(null=True, blank=True)
    serie_guid = models.CharField(max_length=255, blank=True, null=True)
    serie_name = models.CharField(max_length=255, blank=True, null=True)
    

# --- Фото скарги ---
class ComplaintPhoto(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="photos")
    photo = models.BinaryField(null=True, blank=True)
    photo_name = models.CharField(max_length=255, blank=True, null=True)
    upload_complete = models.BooleanField(default=False)
    photo_ico = models.BinaryField(null=True, blank=True)
    photo_size = models.IntegerField(default=0)

    class Meta:
        db_table = 'ComplaintPhotos'

# --- Повідомлення по скарзі ---
class ComplaintMessage(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="messages")
    writer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    message_time = models.DateTimeField()
    message = models.TextField()

    class Meta:
        db_table = 'ComplaintMessages'
