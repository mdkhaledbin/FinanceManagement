"""URL patterns for MCP endpoints."""
from django.urls import path
from .views import AgentAPIView, AgentStreamingAPIView, AgentHistoryAPIView

urlpatterns = [
    path('query/', AgentAPIView.as_view(), name='agent_query'),           # /agent/query/
    path('streaming/', AgentStreamingAPIView.as_view(), name='agent_streaming'),  # /agent/streaming/
    path('history/', AgentHistoryAPIView.as_view(), name='agent_history'),        # /agent/history/
] 