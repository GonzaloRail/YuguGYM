from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('me/', views.me_view, name='auth-me'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('register-admin/', views.register_admin_view, name='auth-register-admin'),
    path('change-password/', views.change_password_view, name='auth-change-password'),
    path('forgot-password/', views.forgot_password_view, name='auth-forgot-password'),
    path('reset-password/', views.reset_password_view, name='auth-reset-password'),
]
