from rest_framework import serializers
from langchain_core.messages import AIMessage

from expense_api.apps.llm.models import User, Category
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']  # Matches the updated User model

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'user', 'table', 'table_category', 'created_at']
class QuerySerializer(serializers.Serializer):
    """Input serializer for WordPress plugin/theme query."""
    query = serializers.CharField()


class ResponseSerializer(serializers.Serializer):
    """Output serializer that sanitizes response format."""
    query = serializers.CharField()
    response = serializers.SerializerMethodField()

    def get_response(self, obj):
        result = obj.get("response")

        # Case 1: If result is an AIMessage
        if isinstance(result, AIMessage):
            return result.content

        # Case 2: If it's a basic data type or None
        if isinstance(result, (str, int, float, bool, list, dict)) or result is None:
            return result

        # Case 3: If it's a dict containing messages
        if isinstance(result, dict) and "messages" in result:
            for message in reversed(result["messages"]):
                if isinstance(message, AIMessage):
                    return message.content
            return str(result)  # fallback to raw dict string

        # Fallback: any other unknown format
        return str(result)