from django.urls import path
from .views import (
    DynamicTableListView, 
    UpdateTableView, 
    DeleteRowView, 
    DeleteColumnView, 
    AddColumnView, 
    CreateTableWithHeadersView, 
    AddRowView, 
    DynamicTableUpdateView, 
    GetTableContentView,
    DeleteTableView,
    EditHeaderView,
    ShareTableView
)

urlpatterns = [
    # ============ TABLE MANAGEMENT URLS ONLY ============
    path('tables/', DynamicTableListView.as_view(), name='dynamic-table-list'),
    path('tables/<int:table_id>/', DeleteTableView.as_view(), name='delete-table'),
    path('tables/update/', DynamicTableUpdateView.as_view(), name='dynamic-table-update'),
    path('table-contents/', GetTableContentView.as_view(), name='get-table-content'),
    path('create-tableContent/', CreateTableWithHeadersView.as_view(), name='create-table-content'),
    path('add-row/', AddRowView.as_view(), name='add-row'),
    path('update-row/', UpdateTableView.as_view(), name='update-row'),
    path('delete-row/', DeleteRowView.as_view(), name='delete-row'),
    path('add-column/', AddColumnView.as_view(), name='add-column'),
    path('delete-column/', DeleteColumnView.as_view(), name='delete-column'),
    path('edit-header/', EditHeaderView.as_view(), name='edit-header'),
    path('share-table/', ShareTableView.as_view(), name='share-table'),
]