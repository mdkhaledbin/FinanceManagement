from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
# from rest_framework.permissions import IsAuthenticated

from ..user_auth.authentication import IsAuthenticatedCustom, decode_refresh_token, generate_access_token, generate_refresh_token
from ..user_auth.permission import JWTAuthentication

from .models import DynamicTableData
from .serializers import DynamicTableSerializer

class DynamicTableListView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom] 

    def get(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)
            
            if not user.is_authenticated:
                return Response({
                    "message": "Authentication credentials were not provided or are invalid."
                }, status=status.HTTP_401_UNAUTHORIZED)

            tables = DynamicTableData.objects.filter(user=user)
            if not tables.exists():
                return Response({
                    "message": "No dynamic tables found for the current user.",
                    "data": []
                }, status=status.HTTP_200_OK)

            serializer = DynamicTableSerializer(tables, many=True)
            return Response({
                "message": "Dynamic tables fetched successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "message": "An unexpected error occurred while fetching data.",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
class DynamicTableUpdateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom] 

    def put(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)

            if not user.is_authenticated:
                return Response({
                    "message": "Authentication credentials were not provided or are invalid."
                }, status=status.HTTP_401_UNAUTHORIZED)
                
            data = request.data
            updated = False

            try:
                table = DynamicTableData.objects.get(id=data['id'], user=user)
            except DynamicTableData.DoesNotExist:
                return Response({
                    "message": "Table not found for the current user."
                }, status=status.HTTP_404_NOT_FOUND)

            if 'table_name' in data:
                table.table_name = data['table_name']
                updated = True
            if 'description' in data:
                table.description = data['description']
                updated = True
            if 'pendingCount' in data:
                table.pendingCount = data['pendingCount']
                updated = True

            if updated:
                table.save()
                serializer = DynamicTableSerializer(table)
                return Response({
                    "message": "Table updated successfully.",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "message": "No valid fields provided to update."
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "message": "An unexpected error occurred while updating the table.",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class DynamicTableCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)

            if not user.is_authenticated:
                return Response({
                    "message": "Authentication credentials were not provided or are invalid."
                }, status=status.HTTP_401_UNAUTHORIZED)

            data = request.data.copy()
            # data['user_id'] = user.id  # Associate user to the table

            serializer = DynamicTableSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=user)
                return Response({
                    "message": "Table created successfully.",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    "message": "Invalid data.",
                    "errors": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                "message": "An unexpected error occurred while creating the table.",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            