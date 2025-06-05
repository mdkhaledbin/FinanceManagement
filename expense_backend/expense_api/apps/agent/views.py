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
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        try:
            # Get user ID from token
            # refresh_token = request.COOKIES.get('refresh_token')
            # if not refresh_token:
                # return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            # user_id = decode_refresh_token(refresh_token)

            user_id = 1
            
            # Validate input
            input_serializer = QuerySerializer(data=request.data)
            if not input_serializer.is_valid():
                return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Extract data from request
            query_data = input_serializer.validated_data
            query_data['user_id'] = user_id  # Add user ID to the data

            # Run agent with user ID and request data
            response_obj = async_to_sync(self.run_agent)(query_data)
            
            # Prepare response
            data = {
                "query": query_data.get("query", ""),
                "response": response_obj
            }
            
            output_serializer = ResponseSerializer(data)
            return Response(output_serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def run_agent(self, query_data):
        async def runner():
            client = ExpenseMCPClient()
            await client.connect()
            result = await client.process_query(query_data)
            await client.disconnect()
            return result
        return runner()
