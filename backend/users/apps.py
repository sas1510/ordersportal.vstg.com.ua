from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.users'



    def ready(self):
        import backend.users.signals



# from django.apps import AppConfig


# class UsersConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'users'
#     label = 'users'



#     def ready(self):
#         import users.signals
