from django.db import models
from django.contrib.auth.models import User

class DynamicTableData(models.Model):
    table_name = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_tables')
    shared_with = models.ManyToManyField(User, related_name='shared_tables', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    description = models.TextField(blank=True, null=True)
    pending_count = models.IntegerField(default=0)
    is_shared = models.BooleanField(default=False)

    def __str__(self):
        return self.table_name


class JsonTable(models.Model):
    table = models.OneToOneField(DynamicTableData, on_delete=models.CASCADE, primary_key=True)
    headers = models.JSONField()  # Store headers as list of strings

    def __str__(self):
        return f"JsonTable for {self.table.table_name}"


class JsonTableRow(models.Model):
    table = models.ForeignKey(JsonTable, related_name='rows', on_delete=models.CASCADE)
    data = models.JSONField()  # Store each row as a JSON object

    def __str__(self):
        return f"Row {self.id} of JsonTable {self.table_id}"