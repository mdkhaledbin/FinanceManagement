from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from django.http import JsonResponse

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
            
# class DynamicTableCreateView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticatedCustom]

#     def post(self, request):
#         try:
#             refresh_token = request.COOKIES.get('refresh_token')
#             if not refresh_token:
#                 return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
#             user_id = decode_refresh_token(refresh_token)
#             user = User.objects.get(id=user_id)

#             if not user.is_authenticated:
#                 return Response({
#                     "message": "Authentication credentials were not provided or are invalid."
#                 }, status=status.HTTP_401_UNAUTHORIZED)

#             data = request.data.copy()
#             # data['user_id'] = user.id  # Associate user to the table

#             serializer = DynamicTableSerializer(data=data)
#             if serializer.is_valid():
#                 serializer.save(user=user)
#                 return Response({
#                     "message": "Table created successfully.",
#                     "data": serializer.data
#                 }, status=status.HTTP_201_CREATED)
#             else:
#                 return Response({
#                     "message": "Invalid data.",
#                     "errors": serializer.errors
#                 }, status=status.HTTP_400_BAD_REQUEST)

#         except Exception as e:
#             return Response({
#                 "message": "An unexpected error occurred while creating the table.",
#                 "error": str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
            
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
                "error": "Failed to add row.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                       
            
class CreateTableWithHeadersView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        try:
            # Extract token and user
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)

            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)

            if not user.is_authenticated:
                return Response({
                    "message": "Authentication credentials were not provided or are invalid."
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Extract main fields
            table_name = request.data.get("table_name")
            description = request.data.get("description")
            data = request.data.get("data", {})
            headers = data.get("headers")

            # Validate required fields
            if not table_name or not description:
                return Response({
                    "message": "Both 'table_name' and 'description' are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            if not isinstance(headers, list) or not all(isinstance(h, str) for h in headers):
                return Response({
                    "message": "'headers' must be a list of strings inside 'data'."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Step 1: Create table
            dynamic_table = DynamicTableData.objects.create(
                table_name=table_name,
                description=description,
                user=user,
                pending_count=0
            )
            
            # Step 2: Add headers
            JsonTable.objects.create(table=dynamic_table, headers=headers)

            return Response({
                "message": "Table and headers created successfully.",
                "table_id": dynamic_table.id,
                "table_name": dynamic_table.table_name,
                "headers": headers
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "message": "Failed to create table with headers.",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class AddColumnView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("table_id")
            header = request.data.get("header")

            if not table_id or not isinstance(header, str):
                return Response({
                    "error": "'table_id' and a string 'header' are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch JsonTable
            json_table = get_object_or_404(JsonTable, pk=table_id)

            # Prevent duplicate header
            if header in json_table.headers:
                return Response({
                    "error": f"Header '{header}' already exists in table."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Add new header to the header list
            json_table.headers.append(header)
            json_table.save()

            # Update all rows by adding new column with empty string
            for row in json_table.rows.all():
                row.data[header] = ""
                row.save()

            return Response({
                "message": f"Header '{header}' added successfully.",
                "headers": json_table.headers
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": "Failed to add new column.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)     


class DeleteColumnView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            new_headers = request.data.get("headers")

            if not table_id or not isinstance(new_headers, list) or not all(isinstance(h, str) for h in new_headers):
                return Response({
                    "error": "'table_id' and 'headers' (list of strings) are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch JsonTable
            json_table = get_object_or_404(JsonTable, pk=table_id)

            old_headers = json_table.headers
            deleted_headers = set(old_headers) - set(new_headers)

            if not deleted_headers:
                return Response({
                    "message": "No headers were deleted.",
                    "headers": old_headers
                }, status=status.HTTP_200_OK)

            # Update headers in JsonTable
            json_table.headers = new_headers
            json_table.save()

            # Remove deleted header keys from all rows
            for row in json_table.rows.all():
                for col in deleted_headers:
                    row.data.pop(col, None)  # Remove the key if it exists
                row.save()

            return Response({
                "message": f"Deleted columns: {list(deleted_headers)}",
                "headers": new_headers
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": "Failed to delete column(s).",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    
            
class DeleteRowView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            row_id = request.data.get("rowId")

            if not table_id or not row_id:
                return Response({
                    "error": "'table_id' and 'row_id' are required."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Custom error handling for JsonTable
            try:
                json_table = JsonTable.objects.get(pk=table_id)
            except JsonTable.DoesNotExist:
                return Response({
                    "error": f"Table with ID {table_id} does not exist."
                }, status=status.HTTP_404_NOT_FOUND)

            # Custom error handling for JsonTableRow
            # try:
            #     row = JsonTableRow.objects.get(id=row_id, table=json_table)
            # except JsonTableRow.DoesNotExist:
            #     return Response({
            #         "error": f"Row with ID {row_id} does not exist in table {table_id}."
            #     }, status=status.HTTP_404_NOT_FOUND)

            # row.delete()
            
            # Find the row by data['id']
            target_row = None
            for row in json_table.rows.all():
                if str(row.data.get("id")) == str(row_id):
                    target_row = row
                    break

            if not target_row:
                return Response({
                    "error": f"No row with id '{row_id}' found in table {table_id}."
                }, status=status.HTTP_404_NOT_FOUND)

            target_row.delete()

            return Response({
                "message": f"Row with ID {row_id} successfully deleted from table {table_id}."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": "Failed to delete the row.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)       
            
            

class UpdateTableView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    def patch(self, request, *args, **kwargs):
        try:
            # Parse request body
            table_id = request.data.get('table_id')
            row_id = request.data.get('row_id')  # This is the ID within the row's data
            new_row = request.data.get('new_row', {})
            
            if not table_id or not row_id:
                return JsonResponse(
                    {'error': 'Missing table_id or row_id'},
                    status=400
                )
            
            # Find the row where data contains the matching id
            try:
                row = JsonTableRow.objects.get(
                    table_id=table_id,
                    data__id=row_id  # Look for id in the JSON data
                )
            except JsonTableRow.DoesNotExist:
                return JsonResponse(
                    {'error': 'Row not found'},
                    status=404
                )
            
            # Update the specific fields in the JSON data
            current_data = row.data or {}
            for key, value in new_row.items():
                current_data[key] = value
            
            # Preserve the id field
            if 'id' in current_data:
                new_row['id'] = current_data['id']
            
            row.data = {**current_data, **new_row}
            row.save()
            
            # Update the modified_at timestamp of the parent table
            # JsonTable.objects.filter(pk=table_id).update(
            #     table__modified_at=timezone.now()
            # )
            
            return JsonResponse({
                'status': 'success',
                'updated_row': row.data
            })
            
        except Exception as e:
            return JsonResponse(
                {'error': str(e)},
                status=400
            )    
        
        
                