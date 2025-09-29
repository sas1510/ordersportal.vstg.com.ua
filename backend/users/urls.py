from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    CurrentUserView,
)
from .views import register_with_invite, get_customers, get_balance_view, get_user_name_view


urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path('register/<str:code>/', register_with_invite, name='register-with-invite'),
    path('customers/', get_customers, name='get_customers'),
    path('balance/', get_balance_view, name='get_balance'),
    path('user-name/', get_user_name_view, name='get_user_name'),
    

]
