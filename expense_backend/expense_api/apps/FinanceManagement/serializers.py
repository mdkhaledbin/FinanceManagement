from rest_framework import serializers
from django.contrib.auth.models import User
from .models import DynamicTableData

class DynamicTableSerializer(serializers.ModelSerializer):
    pendingCount = serializers.IntegerField(source='pending_count', required=False)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = DynamicTableData
        fields = ['id', 'table_name', 'user_id', 'created_at', 'modified_at', 'description', 'pendingCount']