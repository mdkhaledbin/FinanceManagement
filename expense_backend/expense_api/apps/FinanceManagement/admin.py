from django.contrib import admin
from django.utils.html import format_html

# Register your models here.
from .models import DynamicTableData, JsonTable, JsonTableRow

# @admin.register(DynamicTableData)
class DynamicTableDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'table_name', 'get_user_id', 'pending_count', 'created_at', 'modified_at')
    search_fields = ('table_name', 'description')
    list_filter = ('user', 'created_at')
    
    @admin.display(description='user_id')
    def get_user_id(self, obj):
        return obj.user_id
    

from .models import DynamicTableData, JsonTable, JsonTableRow


class JsonTableAdmin(admin.ModelAdmin):
    list_display = ['table', 'display_table_data']
    readonly_fields = ['display_table_data']

    def display_table_data(self, obj):
        if not obj.headers:
            return "No headers available."

        # Create table headers
        table_html = "<table border='1' style='border-collapse: collapse;'>"
        table_html += "<tr>" + "".join(f"<th style='padding: 4px'>{header}</th>" for header in obj.headers) + "</tr>"

        # Add each row
        for row in obj.rows.all():  # uses related_name='rows'
            row_data = row.data
            table_html += "<tr>" + "".join(f"<td style='padding: 4px'>{row_data.get(header, '')}</td>" for header in obj.headers) + "</tr>"

        table_html += "</table>"
        return format_html(table_html)

    display_table_data.short_description = "Table Preview"


admin.site.register(DynamicTableData, DynamicTableDataAdmin)
admin.site.register(JsonTable, JsonTableAdmin)
admin.site.register(JsonTableRow)