from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import CustomUser


@receiver(pre_save, sender=CustomUser)
def remove_old_group_if_role_changed(sender, instance, **kwargs):
    """Перед збереженням перевіряємо, чи змінилася роль"""
    if instance.pk:  # користувач вже існує
        old_user = CustomUser.objects.get(pk=instance.pk)
        if old_user.role != instance.role:
            # видаляємо користувача зі старої групи
            old_group = Group.objects.filter(name=old_user.role).first()
            if old_group:
                instance.groups.remove(old_group)


@receiver(post_save, sender=CustomUser)
def assign_group_based_on_role(sender, instance, created, **kwargs):
    """Після створення або оновлення користувача призначаємо йому групу за роллю"""
    role_group, _ = Group.objects.get_or_create(name=instance.role)
    instance.groups.add(role_group)


from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import CustomUser


@receiver(post_migrate)
def create_default_groups(sender, **kwargs):
    """Створює групи на основі ROLE_CHOICES у CustomUser"""
    if sender.name == "users":  # твій app з CustomUser
        for role, role_name in CustomUser.ROLE_CHOICES:
            Group.objects.get_or_create(name=role)
