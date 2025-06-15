from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from django.http import JsonResponse
import time
from django.db import models

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
            current_user = User.objects.get(id=user_id)
            
            # Get tables owned by the user
            owned_tables = DynamicTableData.objects.filter(user=current_user).distinct()
            
            # Get tables shared with the user
            shared_tables = DynamicTableData.objects.filter(shared_with=current_user).distinct()
            
            # Combine both querysets
            all_tables = owned_tables.union(shared_tables)
            
            # Serialize the tables
            serializer = DynamicTableSerializer(all_tables, many=True)
            
            return Response({
                "message": "Dynamic tables fetched successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request): 
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)
            
            # Get tables that user owns or has access to
            accessible_tables = DynamicTableData.objects.filter(
                models.Q(user=user) | models.Q(shared_with=user)
            )
            
            result = []

            for table_data in accessible_tables:
                try:
                    table = JsonTable.objects.get(table=table_data)
                    table_dict = {
                        "id": table.table.id,  # Refers to DynamicTableData's ID
                        "data": {
                            "headers": table.headers,  # JSONField is already a list
                            "rows": [
                                {
                                    "id": row.id,  # Include the row's ID
                                    **row.data  # Include all the row data
                                } for row in table.rows.all()  # Access rows via related_name
                            ]
                        }
                    }
                    result.append(table_dict)
                except JsonTable.DoesNotExist:
                    continue

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
            row = JsonTableRow.objects.create(table=json_table, data=new_row)
            # print(**new_row);
            # Include the row's ID in the response data
            response_data = {
                "id": row.id,  # Include the row's ID
                **new_row  # Include all the row data
            }

            return Response({
                "message": "Row added successfully.",
                "data": response_data
            }, status=status.HTTP_201_CREATED)

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
            print(user);

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


class DeleteTableView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    
    def delete(self, request, table_id):
        """Delete a table and all its associated data"""
        try:
            # Get user from token
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            user = User.objects.get(id=user_id)

            if not user.is_authenticated:
                return Response({
                    "message": "Authentication credentials were not provided or are invalid."
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Get the table and verify ownership
            try:
                table_data = DynamicTableData.objects.get(id=table_id, user=user)
            except DynamicTableData.DoesNotExist:
                return Response({
                    "error": "Table not found or you don't have permission to delete it."
                }, status=status.HTTP_404_NOT_FOUND)

            # Get the associated JsonTable if it exists
            try:
                json_table = JsonTable.objects.get(table=table_data)
                # Delete all rows first (cascade should handle this, but being explicit)
                json_table.rows.all().delete()
                # Delete the JsonTable
                json_table.delete()
            except JsonTable.DoesNotExist:
                # Table exists in DynamicTableData but not in JsonTable, that's okay
                pass

            # Store table name for response
            table_name = table_data.table_name
            
            # Delete the main table record
            table_data.delete()

            return Response({
                "message": f"Table '{table_name}' and all its data deleted successfully."
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": f"Failed to delete table: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EditHeaderView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]
    
    def post(self, request):
        try:
            table_id = request.data.get("tableId")
            old_header = request.data.get("oldHeader")
            new_header = request.data.get("newHeader")

            if not all([table_id, old_header, new_header]):
                return Response({
                    "error": "Missing required fields: tableId, oldHeader, newHeader"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get the JsonTable instance
            json_table = get_object_or_404(JsonTable, table_id=table_id)

            # Check if new header already exists
            if new_header in json_table.headers:
                return Response({
                    "error": f"Header '{new_header}' already exists."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update the header in the headers list
            header_index = json_table.headers.index(old_header)
            json_table.headers[header_index] = new_header
            json_table.save()

            # Update the header in all rows
            for row in json_table.rows.all():
                if old_header in row.data:
                    row.data[new_header] = row.data.pop(old_header)
                    row.save()

            return Response({
                "message": "Header updated successfully.",
                "data": {
                    "headers": json_table.headers
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ShareTableView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({'message': "Refresh token not provided."}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_id = decode_refresh_token(refresh_token)
            current_user = User.objects.get(id=user_id)
            
            table_id = request.data.get('table_id')
            friend_ids = request.data.get('friend_ids', [])
            action = request.data.get('action')  # 'share' or 'unshare'
            
            if not table_id or not action:
                return Response({
                    "error": "table_id and action are required."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                # Get the original table
                table = DynamicTableData.objects.get(id=table_id, user=current_user)
            except DynamicTableData.DoesNotExist:
                return Response({
                    "error": "Table not found or you don't have permission."
                }, status=status.HTTP_404_NOT_FOUND)
                
            if action == 'share':
                if not friend_ids:
                    return Response({
                        "error": "friend_ids are required for sharing."
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
                # Get all friends to share with
                friends_to_share = []
                
                # Get friends from both directions (same as FriendsListView)
                user_friends = current_user.profile.friends.all()
                friends_who_added_me = User.objects.filter(profile__friends=current_user)
                all_friends = user_friends.union(friends_who_added_me)
                
                for friend_id in friend_ids:
                    try:
                        friend = User.objects.get(id=friend_id)
                        # Check if friend is in the combined friends list
                        if friend in all_friends:
                            # Check if table is already shared with this friend
                            if not table.shared_with.filter(id=friend.id).exists():
                                friends_to_share.append(friend)
                        else:
                            return Response({
                                "error": f"{friend.username} is not your friend."
                            }, status=status.HTTP_403_FORBIDDEN)
                    except User.DoesNotExist:
                        continue
                
                # Add all friends at once to prevent multiple saves
                if friends_to_share:
                    # Use bulk_create to prevent duplicate entries
                    table.shared_with.add(*friends_to_share)
                    # Only update is_shared if it's not already True
                    if not table.is_shared:
                        table.is_shared = True
                        table.save()
                
                message = "Table shared successfully."
                
            elif action == 'unshare':
                if not friend_ids:
                    # Unshare with all friends
                    table.shared_with.clear()
                else:
                    # Remove all specified friends at once
                    friends_to_remove = User.objects.filter(id__in=friend_ids)
                    table.shared_with.remove(*friends_to_remove)
                            
                if not table.shared_with.exists():
                    table.is_shared = False
                    table.save()
                    
                message = "Table unshared successfully."
                
            else:
                return Response({
                    "error": "Invalid action. Use 'share' or 'unshare'."
                }, status=status.HTTP_400_BAD_REQUEST)
                
            return Response({
                "message": message,
                "table": {
                    "id": table.id,
                    "table_name": table.table_name,
                    "is_shared": table.is_shared,
                    "shared_with": [{"id": f.id, "username": f.username} for f in table.shared_with.all()]
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                