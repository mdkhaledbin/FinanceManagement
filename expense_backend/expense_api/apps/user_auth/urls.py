from django.urls import path
from .models import User
from .views import UserRegisterView, loginView, logoutView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', loginView.as_view(), name='login'),
    path('logout/', logoutView.as_view(), name='logout'),
]