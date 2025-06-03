from django.urls import path
from .views import DynamicTableListView, DynamicTableUpdateView, DynamicTableCreateView

urlpatterns = [
    path('tables/', DynamicTableListView.as_view(), name='table-list'),
    path('upadate-table/', DynamicTableUpdateView.as_view(), name='table-update'),
    path('create-table/', DynamicTableCreateView.as_view(), name='table-create'),
]