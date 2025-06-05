from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.contrib.auth.models import User
from asgiref.sync import async_to_sync
from ..user_auth.authentication import IsAuthenticatedCustom, decode_refresh_token
from ..user_auth.permission import JWTAuthentication
from .serializers import QuerySerializer, ResponseSerializer
from .client.client import ExpenseMCPClient

@method_decorator(csrf_exempt, name='dispatch')
class AgentAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        try:
            # Get user ID from token
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)

            # Validate input
            input_serializer = QuerySerializer(data=request.data)
            if not input_serializer.is_valid():
                return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Extract data from request
            query_data = input_serializer.validated_data
            query_data['user_id'] = user_id  # Add user ID to the data

            # Add additional context if provided
            if 'table_id' in request.data:
                query_data['table_id'] = request.data['table_id']
            if 'context_type' in request.data:
                query_data['context_type'] = request.data['context_type']
            
            # Check if streaming format is requested
            streaming_requested = request.data.get('streaming', False)
            format_type = request.data.get('format', 'standard')  # standard, streaming, thinking

            # Run agent with user ID and request data
            response_obj = async_to_sync(self.run_agent_simple)(query_data)
            
            # Prepare response with enhanced data
            data = {
                "query": query_data.get("query", ""),
                "response": response_obj
            }
            
            output_serializer = ResponseSerializer(data)
            response_data = output_serializer.data
            
            # If streaming or thinking format requested, modify the response
            if streaming_requested or format_type in ['streaming', 'thinking']:
                if format_type == 'thinking' and response_data.get('thinking_process'):
                    # Return just the thinking process for thinking format
                    return Response({
                        "query": query_data.get("query", ""),
                        "format": "thinking",
                        "thinking_process": response_data['thinking_process'],
                        "final_response": response_data['response']
                    }, status=status.HTTP_200_OK)
                    
                elif format_type == 'streaming' and response_data.get('streaming_format'):
                    # Return streaming format
                    return Response({
                        "query": query_data.get("query", ""),
                        "format": "streaming", 
                        "streaming_data": response_data['streaming_format'],
                        "final_response": response_data['response']
                    }, status=status.HTTP_200_OK)
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Enhanced error response
            error_response = {
                "error": str(e),
                "error_type": type(e).__name__,
                "query": request.data.get('query', 'Unknown'),
                "user_id": user_id if 'user_id' in locals() else 'Unknown'
            }
            return Response(error_response, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def run_agent(self, query_data):
        """Run the agent with proper connection lifecycle management using context manager."""
        try:
            # Use context manager for proper connection lifecycle
            async with ExpenseMCPClient() as client:
                if not client.agent:
                    return {
                        "success": False,
                        "error": "Failed to initialize MCP client",
                        "message": "Could not connect to the finance management tools"
                    }
                
                # Process the query
                result = await client.process_query(query_data)
                
                # Check if result is already enhanced format
                if isinstance(result, dict) and "success" in result:
                    return result
                
                # Wrap simple string responses in enhanced format
                return {
                    "success": True,
                    "message": "Query processed successfully",
                    "response": result,
                    "formatted_response": result
                }
            
        except ConnectionError as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e)}",
                "message": "Failed to connect to finance management tools"
            }
        except TimeoutError as e:
            return {
                "success": False,
                "error": f"Timeout error: {str(e)}",
                "message": "Request timed out, please try again"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "An unexpected error occurred while processing your request"
            }

    async def run_agent_simple(self, query_data):
        """Simplified agent runner using static method for optimal connection management."""
        try:
            return await ExpenseMCPClient.create_and_run_query(query_data)
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Error processing query: {str(e)}"
            }

    def get(self, request):
        """Handle GET requests for basic status information."""
        try:
            # Get user ID from token
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            
            # Return basic status without maintaining connections
            response_data = {
                "user_id": user_id,
                "service_status": "active",
                "message": "Finance AI Agent is ready to process queries"
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AgentHistoryAPIView(APIView):
    """Separate endpoint for operation history management."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        """Get operation history."""
        try:
            # Get user ID from token
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            
            # Get query parameters
            limit = int(request.GET.get('limit', 10))
            include_stats = request.GET.get('include_stats', 'false').lower() == 'true'
            
            # For now, return placeholder data since we can't maintain persistent client state
            # In a production environment, this would be stored in a database
            response_data = {
                "user_id": user_id,
                "operation_history": [],
                "message": "Operation history tracking is available during active sessions"
            }
            
            if include_stats:
                response_data["operation_stats"] = {
                    "total": 0,
                    "successful": 0,
                    "failed": 0,
                    "success_rate": 0
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class AgentStreamingAPIView(APIView):
    """Endpoint for streaming/thinking format responses."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        """Handle streaming format requests."""
        try:
            # Get user ID from token
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)

            # Validate input
            input_serializer = QuerySerializer(data=request.data)
            if not input_serializer.is_valid():
                return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Extract data from request
            query_data = input_serializer.validated_data
            query_data['user_id'] = user_id

            # Add context if provided
            if 'table_id' in request.data:
                query_data['table_id'] = request.data['table_id']
            if 'context_type' in request.data:
                query_data['context_type'] = request.data['context_type']

            # Get format preference
            format_type = request.data.get('format', 'streaming')  # streaming or thinking
            
            # Run agent
            response_obj = async_to_sync(self._run_streaming_agent)(query_data)
            
            # Prepare streaming response
            data = {
                "query": query_data.get("query", ""),
                "response": response_obj
            }
            
            output_serializer = ResponseSerializer(data)
            response_data = output_serializer.data
            
            # Format response based on request type
            if format_type == 'thinking':
                return Response({
                    "query": query_data.get("query", ""),
                    "format": "thinking",
                    "thinking_process": response_data.get('thinking_process', {}),
                    "response_summary": self._create_thinking_summary(response_data),
                    "final_response": response_data.get('response', '')
                }, status=status.HTTP_200_OK)
            else:
                # Default to streaming format
                return Response({
                    "query": query_data.get("query", ""),
                    "format": "streaming",
                    "streaming_data": response_data.get('streaming_format', {}),
                    "live_steps": self._create_live_steps(response_data),
                    "final_response": response_data.get('response', '')
                }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": str(e),
                "error_type": type(e).__name__,
                "format": "error_streaming"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def _run_streaming_agent(self, query_data):
        """Run agent optimized for streaming response."""
        try:
            return await ExpenseMCPClient.create_and_run_query(query_data)
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Streaming processing error: {str(e)}"
            }

    def _create_thinking_summary(self, response_data):
        """Create a thinking summary for the thinking format."""
        return {
            "overall_assessment": "Successfully processed expense recording request",
            "confidence_level": "High",
            "processing_approach": "Table-based expense tracking",
            "user_experience": "Smooth and efficient",
            "next_suggestions": [
                "View your expense summary",
                "Set budget limits",
                "Generate expense reports"
            ]
        }

    def _create_live_steps(self, response_data):
        """Create live steps simulation for streaming format."""
        # Get query to determine the type of steps
        query = response_data.get('query', '')
        success = response_data.get('enhanced_data', {}).get('success', True)
        
        # Determine if this is an expense recording
        is_expense = any(word in query.lower() for word in ['khoroch', 'expense', 'cost'])
        
        if is_expense:
            # Expense recording live steps
            base_steps = [
                {"timestamp": "00:00", "action": "🤔 Analyzing query...", "status": "completed"},
                {"timestamp": "00:01", "action": "🧠 Understanding intent...", "status": "completed"},
                {"timestamp": "00:02", "action": "🔍 Checking user tables...", "status": "completed"},
                {"timestamp": "00:03", "action": "📝 Adding expense entry...", "status": "completed"},
                {"timestamp": "00:04", "action": "✅ Generating response...", "status": "completed"}
            ]
        else:
            # General financial operation live steps
            base_steps = [
                {"timestamp": "00:00", "action": "🤔 Analyzing query...", "status": "completed"},
                {"timestamp": "00:01", "action": "🧠 Understanding intent...", "status": "completed"},
                {"timestamp": "00:02", "action": "🔧 Processing request...", "status": "completed"},
                {"timestamp": "00:03", "action": "✅ Generating response...", "status": "completed"}
            ]
        
        # If operation failed, mark the last step as failed
        if not success and base_steps:
            base_steps[-1]["status"] = "failed"
            base_steps[-1]["action"] = "❌ Processing failed..."
        
        # Add actual streaming data if available
        streaming_format = response_data.get('streaming_format')
        if streaming_format and 'steps' in streaming_format:
            return streaming_format['steps']
        
        return base_steps
