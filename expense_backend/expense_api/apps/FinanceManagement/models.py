from django.db import models
from django.contrib.auth.models import User

class DynamicTableData(models.Model):
    table_name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    description = models.TextField(blank=True, null=True)
    pending_count = models.IntegerField(default=0)

    def __str__(self):
        return self.table_name