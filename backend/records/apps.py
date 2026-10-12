from django.apps import AppConfig


class RecordsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'records'
    def ready(self):
        from utils import portal_error_alerts  # Register the Django exception receiver.



# from django.apps import AppConfig


# class RecordsConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'records'
#     label = 'records'







