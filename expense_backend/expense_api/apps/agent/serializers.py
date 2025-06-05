from rest_framework import serializers
from langchain_core.messages import AIMessage


class QuerySerializer(serializers.Serializer):
    """Input serializer for finance management AI queries."""
    query = serializers.CharField()


class ResponseSerializer(serializers.Serializer):
    """Output serializer for AI agent responses."""
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

        # Case 4: If it's a dict with financial analysis
        if isinstance(result, dict) and "analysis" in result:
            return {
                "message": result.get("message", "Financial analysis completed"),
                "analysis": result["analysis"]
            }

        # Fallback: any other unknown format
        return str(result)