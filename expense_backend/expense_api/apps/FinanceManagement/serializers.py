from rest_framework import serializers
from django.contrib.auth.models import User
from .models import DynamicTableData

class DynamicTableSerializer(serializers.ModelSerializer):
    pendingCount = serializers.IntegerField(source='pending_count', required=False)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    owner = serializers.SerializerMethodField()
    shared_with = serializers.SerializerMethodField()

    class Meta:
        model = DynamicTableData
        fields = ['id', 'table_name', 'user_id', 'owner', 'is_shared', 'shared_with', 'created_at', 'modified_at', 'description', 'pendingCount']

    def get_owner(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username
        }

    def get_shared_with(self, obj):
        return [{
            'id': user.id,
            'username': user.username
        } for user in obj.shared_with.all()]