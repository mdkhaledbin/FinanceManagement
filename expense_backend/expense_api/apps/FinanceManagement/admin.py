from django.contrib import admin

# Register your models here.
from .models import DynamicTableData

@admin.register(DynamicTableData)
class DynamicTableDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'table_name', 'get_user_id', 'pending_count', 'created_at', 'modified_at')
    search_fields = ('table_name', 'description')
    list_filter = ('user', 'created_at')
    
    @admin.display(description='user_id')
    def get_user_id(self, obj):
        return obj.user_id