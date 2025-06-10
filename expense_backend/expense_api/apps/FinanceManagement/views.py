from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from django.http import JsonResponse
import time

from ..user_auth.authentication import IsAuthenticatedCustom, decode_refresh_token, generate_access_token, generate_refresh_token
from ..user_auth.permission import JWTAuthentication

from .models import DynamicTableData, JsonTable, JsonTableRow
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
            
            
class GetTableContentView(APIView):
    def get(self, request): 
        try:
            tables = JsonTable.objects.all()
            result = []

            for table in tables:
                table_dict = {
                    "id": table.table.id,  # Refers to DynamicTableData's ID
                    "data": {
                        "headers": table.headers,  # JSONField is already a list
                        "rows": [
                            row.data for row in table.rows.all()  # Access rows via related_name
                        ]
                    }
                }
                result.append(table_dict)

            return JsonResponse(result, safe=False, status=status.HTTP_200_OK)

        except Exception as e:
            return JsonResponse(
                {"error": "Failed to fetch table data", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AddRowView(APIView):
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            new_row = request.data.get("row")

            if not table_id or not isinstance(new_row, dict):
                return Response({
                    "error": "Invalid input. 'tableId' must be provided and 'row' must be a dictionary."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the JsonTable instance (raises 404 if not found)
            json_table = get_object_or_404(JsonTable, table_id=table_id)

            # Optional: Validate if row keys match table headers
            if not all(key in json_table.headers for key in new_row.keys()):
                return Response({
                    "error": "Row keys do not match table headers.",
                    "expected_headers": json_table.headers
                }, status=status.HTTP_400_BAD_REQUEST)

            # Save the new row
            JsonTableRow.objects.create(table=json_table, data=new_row)

            return Response({"message": "Row added successfully.", "data":new_row}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateTableWithHeadersView(APIView):
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

            table_name = request.data.get("table_name")
            headers = request.data.get("headers", [])
            description = request.data.get("description", "")

            if not table_name or not headers:
                return Response({
                    "error": "Table name and headers are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create the DynamicTableData instance
            table_data = DynamicTableData.objects.create(
                table_name=table_name,
                user=user,
                description=description
            )

            # Create the JsonTable instance
            json_table = JsonTable.objects.create(
                table=table_data,
                headers=headers
            )

            # Return success response
            return Response({
                "message": "Table created successfully.",
                "data": {
                    "id": table_data.id,
                    "table_name": table_data.table_name,
                    "headers": json_table.headers,
                    "created_at": table_data.created_at,
                    "description": table_data.description
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddColumnView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            new_header = request.data.get("header")

            if not table_id or not new_header:
                return Response({
                    "error": "'tableId' and 'header' are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch JsonTable
            json_table = get_object_or_404(JsonTable, pk=table_id)

            # Check if header already exists
            if new_header in json_table.headers:
                return Response({
                    "error": f"Header '{new_header}' already exists."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Add the new header
            json_table.headers.append(new_header)
            json_table.save()

            # Add empty values for existing rows
            for row in json_table.rows.all():
                row.data[new_header] = ""
                row.save()

            return Response({
                "message": "Column added successfully.",
                "headers": json_table.headers
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeleteColumnView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            header_to_delete = request.data.get("header")

            if not table_id or not isinstance(header_to_delete, str):
                return Response({
                    "error": "'tableId' and 'header' (string) are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch JsonTable
            json_table = get_object_or_404(JsonTable, pk=table_id)

            # Check if header exists
            if header_to_delete not in json_table.headers:
                return Response({
                    "error": f"Header '{header_to_delete}' does not exist in the table."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Remove the header from the headers list
            json_table.headers.remove(header_to_delete)
            json_table.save()

            # Remove the header key from all rows
            for row in json_table.rows.all():
                if header_to_delete in row.data:
                    del row.data[header_to_delete]
                    row.save()

            return Response({
                "message": f"Column '{header_to_delete}' deleted successfully.",
                "headers": json_table.headers
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeleteRowView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            row_id = request.data.get("rowId")

            if not table_id or row_id is None:
                return Response({
                    "error": "'tableId' and 'rowId' are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch JsonTable
            json_table = get_object_or_404(JsonTable, pk=table_id)

            # Find and delete the row
            try:
                if isinstance(row_id, str):
                    # Find row by data key 'id'
                    row = json_table.rows.get(data__id=row_id)
                else:
                    # Find row by primary key
                    row = json_table.rows.get(pk=row_id)
                
                row.delete()
                
                return Response({
                    "message": "Row deleted successfully."
                }, status=status.HTTP_200_OK)

            except JsonTableRow.DoesNotExist:
                return Response({
                    "error": f"Row with ID '{row_id}' not found in table."
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateTableView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def patch(self, request, *args, **kwargs):
        try:
            table_id = request.data.get('tableId')
            row_id = request.data.get('rowId')
            new_row_data = request.data.get('newRowData')
            
            if not all([table_id, row_id, new_row_data]):
                return JsonResponse({
                    'error': 'Missing required fields: tableId, rowId, newRowData'
                }, status=400)
            
            # Get table
            json_table = JsonTable.objects.get(pk=table_id)
            
            # Get specific row
            if isinstance(row_id, str):
                # Find row by data key 'id'
                row = json_table.rows.get(data__id=row_id)
            else:
                # Find row by primary key
                row = json_table.rows.get(pk=row_id)
            
            # Update row data
            row.data.update(new_row_data)
            row.save()
            
            return JsonResponse({
                'status': 'success',
                'updated_row': row.data
            })
            
        except Exception as e:
            return JsonResponse(
                {'error': str(e)},
                status=400
            )
                