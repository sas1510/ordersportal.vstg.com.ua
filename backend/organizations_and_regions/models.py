from django.db import models
from backend.users.models import CustomUser

# Create your models here.
class Organization(models.Model):
    
    name = models.CharField(max_length=255)
    organization_1c_id = models.CharField(max_length=255, blank=True, null=True)
    organization_1c_link = models.BinaryField(max_length=255, null=True, blank=True)
    update_time = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.name
    
    class Meta:
        db_table = 'Organizations'

# class UserOrganization(models.Model):
#     user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
#     organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
#     joined_at = models.DateTimeField()
    
#     def __str__(self):
#         return f"{self.user} → {self.organization}"


    
# class Region(models.Model):
#     name = models.CharField(max_length=255)
#     update_time = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return self.name
    
#     class Meta:
#         db_table = 'Regions'