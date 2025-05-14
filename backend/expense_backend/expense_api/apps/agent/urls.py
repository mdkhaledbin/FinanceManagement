"""URL patterns for MCP endpoints."""
from django.urls import path
from .views import  AgentAPIView

urlpatterns = [
    path('query/', AgentAPIView.as_view()),#/agent/query/
    # path('query/', MCPQueryView.as_view(), name='mcp-query'),
    # path('execute-tool/', MCPToolExecuteView.as_view(), name='mcp-execute-tool'),
] 