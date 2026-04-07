from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import smbclient
from celery.schedules import crontab
import os

from pathlib import Path
from dotenv import load_dotenv


load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = config('SECRET_KEY')
DEBUG=False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

ONE_C_API_KEYS = config('ONE_C_API_KEYS', cast=Csv(), default="")

AUTH_USER_MODEL = 'users.CustomUser'



INSTALLED_APPS = [

    'daphne',  # Обов'язково першим
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    "drf_spectacular",
    "webpush",
    'users',
    'chat',
    'contact',
    'records',
    # 'complaints',
    'portal_media',
    'payments',
    'reclamations',
    'additional_order',
    # 'silk',
    # 'documents',
    # 'order',
    # 'organizations_and_regions',
    # 'video',
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # 'silk.middleware.SilkyMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE'),
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': '',
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'trusted_connection': 'yes',
            'unicode_results': True,
        },
        

    },
    'db_2': {
            'ENGINE': config('DB_ENGINE'),
            'NAME': config('DB_NAME'),
            'USER': config('DB_USER'),
            'PASSWORD': config('DB_PASSWORD'),
            'HOST': config('DB_HOST_2'),
            'PORT': '',
            'CONN_MAX_AGE': 600,
            'OPTIONS': {
                'driver': 'ODBC Driver 17 for SQL Server',
                'trusted_connection': 'yes',
                'unicode_results': True,
            },

        }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/Kyiv'
USE_I18N = True
USE_TZ = True

# Static & media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'static'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# REST framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # "rest_framework.authentication.SessionAuthentication",
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        "backend.authentication.OneCApiKeyAuthentication", 
        
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    'BLACKLIST_AFTER_ROTATION': False,
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    "AUTH_COOKIE": "refresh",
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SECURE": True,   # True на https
    "AUTH_COOKIE_SAMESITE": "Lax",

}

# CORS
# CORS_ALLOW_CREDENTIALS = True
# CORS_ALLOWED_ORIGINS = [
#     "http://172.20.197.76",
#     "http://ordersportal.vstg.com.ua",
#     "http://172.17.19.107",
# ]

# CSRF_TRUSTED_ORIGINS = [
#     "http://172.17.19.107",
#     "http://ordersportal.vstg.com.ua",
#     "http://172.20.197.76",
# ]


# Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

# Default primary key
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

BOT_TOKEN = config('BOT_TOKEN', default='')



SMB_SERVER = config("SMB_SERVER")
SMB_USERNAME = config("SMB_USERNAME")
SMB_PASSWORD = config("SMB_PASSWORD")
SMB_SHARE = config("SMB_SHARE", default="1c_data")


smbclient.register_session(
    SMB_SERVER,
    username=SMB_USERNAME,
    password=SMB_PASSWORD
)

SPECTACULAR_SETTINGS = {
    "TITLE": "Orders Portal API",
    "DESCRIPTION": "API документація (JWT + 1C API Key)",
    "VERSION": "1.0.0",

    # 🔐 ОГОЛОШЕННЯ ВСІХ AUTH
    "SECURITY_SCHEMES": {
        "jwtAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-KEY",
        },
    },

    # 🔴 ГЛОБАЛЬНО: які auth доступні
    "SECURITY": [
        {"jwtAuth": []},
        {"ApiKeyAuth": []},
    ],
}


# SESSION_COOKIE_AGE = 60 * 60 * 8   
FRONTEND_URL = "https://ordersportal.vstg.com.ua/"


ONE_C_URL = config('ONE_C_URL')
ONE_C_USER = config('ONE_C_USER')
ONE_C_PASSWORD = config('ONE_C_PASSWORD')
ONE_C_VERIFY_SSL = config('ONE_C_VERIFY_SSL', default=False, cast=bool)



TELEGRAM_BOT_USERNAME = config('TELEGRAM_BOT_USERNAME', default='your_default_bot')


ASGI_APPLICATION = 'backend.asgi.application' # Переконайтеся, що шлях правильний




CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(config('REDIS_HOST', default='127.0.0.1'), 6379)],
        },
    },
}


WEBPUSH_SETTINGS = {
    "VAPID_PUBLIC_KEY": 'BL9wQus0T21rgqRFcjZhUmiZ6w0nv5siH9AFJBLayIqPbNCNMbsWPfjpNIQ3PH1RtnUuzbA7uGEJfwdgnmpImLY',
    "VAPID_PRIVATE_KEY": "4eVLdiohXE3VyA0F6CqwUugCBkxPmiiT902NL3aR-4w",
    "VAPID_ADMIN_EMAIL": "workvs.market@gmail.com"
}


CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'


CELERY_BEAT_SCHEDULE = {
    'order-stuck-check': {
        'task': 'run_order_reminder_cron',
        'schedule': crontab(hour='10, 16', minute=0), 
    },
}







CORS_ALLOW_ALL_ORIGINS = False


CORS_ALLOWED_ORIGINS = [
    "https://ordersportal.vstg.com.ua",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://172.17.19.107"
    
]


CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-api-key",
    "x-csrftoken",
]

# settings.py

# Додайте IP вашого сервера
CSRF_TRUSTED_ORIGINS = [
    'http://172.17.19.107',
    'http://localhost',
    'http://127.0.0.1',
    'https://ordersportal.vstg.com.ua'
]




# settings.py

ALLOWED_HOSTS = ['172.17.19.107', 'localhost', '127.0.0.1', 'ordersportal.vstg.com.ua']


# SILKY_PYTHON_PROFILER = True  
# SILKY_INTERCEPT_PERCENT = 100 



CSP_FRAME_ANCESTORS = ("'self'",)

# Основне правило: дозволяємо ресурси тільки зі свого домену за замовчуванням
CSP_DEFAULT_SRC = ("'self'",)

# Скрипти: дозволяємо інлайн (для React/Swagger) та Cloudflare
CSP_SCRIPT_SRC = (
    "'self'", 
    "'unsafe-inline'", 
    "'unsafe-eval'", 
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com"
)


CSP_STYLE_SRC = (
    "'self'", 
    "'unsafe-inline'", 
    "https://cdnjs.cloudflare.com", 
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com"
)

# Шрифти
CSP_FONT_SRC = (
    "'self'", 
    "https://cdnjs.cloudflare.com", 
    "https://fonts.gstatic.com"
)

# З'єднання: ОБОВ'ЯЗКОВО додаємо wss:// для чату/сповіщень
CSP_CONNECT_SRC = (
    "'self'", 
    "wss://ordersportal.vstg.com.ua", 
    "https://ordersportal.vstg.com.ua",
    "http://172.17.19.107",
)

# Фрейми: для ваших віджетів TikTok
CSP_FRAME_SRC = (
    "'self'", 
    "https://www.tiktok.com", 
    "https://*.tiktok.com"
)

# Зображення: додаємо validator.swagger.io, щоб Swagger-docs не видавав помилок
CSP_IMG_SRC = (
    "'self'", 
    "data:", 
    "https://validator.swagger.io",
    "https://cdn.jsdelivr.net",
    "http://172.17.19.107",
)

# Закриваємо зауваження ZAP "No Fallback"
CSP_OBJECT_SRC = ("'none'",)
CSP_BASE_URI = ("'self'",)



if not DEBUG:

    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True