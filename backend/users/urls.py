from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    CurrentUserView,
)
from .views import register_with_invite, get_customers, get_balance_view, get_user_name_view, get_dealers, admin_change_user_password, change_password_client, get_all_users_view, admin_edit_user_view, admin_deactivate_user_view


urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path('register/<str:code>/', register_with_invite, name='register-with-invite'),
    path('customers/', get_customers, name='get_customers'),
    path('balance/', get_balance_view, name='get_balance'),
    path('user-name/', get_user_name_view, name='get_user_name'),
    path("get_dealers/", get_dealers, name="get_dealers"),
    path('change-password/', change_password_client, name='change_password_client'),

    path("users/<int:user_id>/change-password/", admin_change_user_password),
    path("users/all/", get_all_users_view, name="get_all_users"),
    path("users/<int:user_id>/edit/", admin_edit_user_view),
    path("users/<int:user_id>/deactivate/", admin_deactivate_user_view),
    

]
