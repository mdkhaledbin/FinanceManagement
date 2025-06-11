"""URL patterns for Agent and Chat endpoints."""
from django.urls import path
from .views import (
    # AI Agent views
    AgentAPIView, 
    AgentStreamingAPIView, 
    AgentHistoryAPIView,
    
    # Chat session management views
    ChatSessionListView,
    ChatSessionDetailView, 
    ChatSessionMessagesView,
    SaveSessionMessageView
)

urlpatterns = [
    # ============ AI AGENT ENDPOINTS ============
    path('query/', AgentAPIView.as_view(), name='agent-query'),           # /agent/query/
    path('streaming/', AgentStreamingAPIView.as_view(), name='agent-streaming'),  # /agent/streaming/
    path('history/', AgentHistoryAPIView.as_view(), name='agent-history'),        # /agent/history/
    
    # ============ CHAT SESSION ENDPOINTS ============
    # Chat session management
    path('chat/sessions/', ChatSessionListView.as_view(), name='chat-sessions'),          # GET: list, POST: create
    path('chat/sessions/<str:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),  # GET, PUT, DELETE
    
    # Session messages
    path('chat/sessions/<str:session_id>/messages/', ChatSessionMessagesView.as_view(), name='session-messages'),      # GET: list, DELETE: clear
    path('chat/sessions/<str:session_id>/messages/save/', SaveSessionMessageView.as_view(), name='save-session-message'),  # POST: save
] 