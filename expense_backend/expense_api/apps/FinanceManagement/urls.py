from django.urls import path
from .views import DynamicTableListView, UpdateTableView, DeleteRowView, DeleteColumnView, AddColumnView, CreateTableWithHeadersView, AddRowView, DynamicTableUpdateView, GetTableContentView

urlpatterns = [
    path('tables/', DynamicTableListView.as_view(), name='table-list'),
    path('upadate-table/', DynamicTableUpdateView.as_view(), name='table-update'),
    # path('create-table/', DynamicTableCreateView.as_view(), name='table-create'),
    
    
    path('create-tableContent/', CreateTableWithHeadersView.as_view(), name='tableContent-create'),
    path('table-contents/', GetTableContentView.as_view(), name='table-contents'),
    path('add-row/', AddRowView.as_view(), name='add-row'),
    path('add-column/', AddColumnView.as_view(), name='add-column'),
    path("delete-column/", DeleteColumnView.as_view(), name="delete-column"),
    path("delete-row/", DeleteRowView.as_view(), name="delete-row"),
    path("update-row/", UpdateTableView.as_view(), name="update-row"),
]