from django.contrib import admin
from django.urls import path
from .import views
urlpatterns = [
    path('', views.home, name='llm'), #localhost/llm
    path('user/', views.create_user, name='user'),#loacalhost/llm/user
    path('create_table/', views.create_table, name='table'),#loacalhost/llm/user
]
