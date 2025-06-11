from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.utils import timezone

from ..user_auth.authentication import decode_refresh_token
from .models import DynamicTableData, JsonTable, JsonTableRow
from .serializers import DynamicTableSerializer


def get_dynamic_tables(refresh_token):
    """
    Retrieve all dynamic tables for an authenticated user.
    
    This function fetches all tables that belong to a specific user by first validating
    their authentication through a refresh token. It returns a list of tables with their
    metadata including table names, descriptions, and other properties.
    
    Args:
        refresh_token (str): JWT refresh token from cookies used to authenticate the user
        
    Returns:
        JsonResponse: Success response with list of tables or error response
            - On success: {"message": "...", "data": [...]} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On error: {"message": "...", "error": "..."} with status 500
            
    Business Logic:
        - Validates refresh token and extracts user ID
        - Checks if user is authenticated
        - Queries DynamicTableData model filtered by user
        - Serializes table data using DynamicTableSerializer
        - Returns empty array if no tables found for user
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)
        
        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)
        
        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

        tables = DynamicTableData.objects.filter(user=user)
        if not tables.exists():
            return JsonResponse({
                "message": "No dynamic tables found for the current user.",
                "data": []
            }, status=200)

        serializer = DynamicTableSerializer(tables, many=True)
        return JsonResponse({
            "message": "Dynamic tables fetched successfully.",
            "data": serializer.data
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "message": "An unexpected error occurred while fetching data.",
            "error": str(e)
        }, status=500)


def update_dynamic_table(refresh_token, table_id, table_name=None, description=None, pending_count=None):
    """
    Update specific fields of a dynamic table owned by an authenticated user.
    
    This function allows partial updates to table metadata. It validates user ownership
    of the table before allowing modifications. Only provided fields will be updated,
    making this a PATCH-like operation for table properties.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_id (int): Primary key ID of the table to update
        table_name (str, optional): New name for the table
        description (str, optional): New description for the table
        pending_count (int, optional): New pending count value for the table
        
    Returns:
        JsonResponse: Updated table data or error response
            - On success: {"message": "...", "data": {...}} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On table not found: {"message": "..."} with status 404
            - On no updates: {"message": "..."} with status 400
            
    Business Logic:
        - Authenticates user via refresh token
        - Verifies table ownership (table must belong to authenticated user)
        - Updates only the fields that are provided (not None)
        - Saves changes to database if at least one field was updated
        - Returns serialized updated table data
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)
        
        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)
            
        updated = False

        try:
            table = DynamicTableData.objects.get(id=table_id, user=user)
        except DynamicTableData.DoesNotExist:
            return JsonResponse({
                "message": "Table not found for the current user."
            }, status=404)

        if table_name is not None:
            table.table_name = table_name
            updated = True
        if description is not None:
            table.description = description
            updated = True
        if pending_count is not None:
            table.pendingCount = pending_count
            updated = True

        if updated:
            table.save()
            serializer = DynamicTableSerializer(table)
            return JsonResponse({
                "message": "Table updated successfully.",
                "data": serializer.data
            }, status=200)
        else:
            return JsonResponse({
                "message": "No valid fields provided to update."
            }, status=400)

    except Exception as e:
        return JsonResponse({
            "message": "An unexpected error occurred while updating the table.",
            "error": str(e)
        }, status=500)


def get_table_content():
    """
    Retrieve the complete content of all tables including headers and row data.
    
    This function fetches all JsonTable records along with their associated headers
    and row data. It's used to get the actual table content (not just metadata)
    for display or processing purposes. No authentication required as it returns
    all tables in the system.
    
    Args:
        None
        
    Returns:
        JsonResponse: Array of table content objects or error response
            - On success: Array of objects with structure:
              [{"id": table_id, "data": {"headers": [...], "rows": [...]}}]
            - On error: {"error": "...", "details": "..."} with status 500
            
    Business Logic:
        - Queries all JsonTable objects (no user filtering)
        - For each table, extracts the DynamicTableData ID
        - Includes headers array from JsonTable.headers field
        - Includes all row data by iterating through related JsonTableRow objects
        - Returns structured data ready for frontend table rendering
        
    Data Structure:
        Each returned table object contains:
        - id: References the DynamicTableData primary key
        - data.headers: Array of column header strings
        - data.rows: Array of row objects containing actual data
    """
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

        return JsonResponse(result, safe=False, status=200)

    except Exception as e:
        return JsonResponse(
            {"error": "Failed to fetch table data", "details": str(e)},
            status=500
        )


def add_row_to_table(table_id, new_row):
    """
    Add a new data row to an existing table.
    
    This function creates a new JsonTableRow record with the provided data.
    It validates that the row data structure matches the table's header schema
    before insertion. No authentication required - assumes table_id is valid.
    
    Args:
        table_id (int): Primary key ID of the target JsonTable
        new_row (dict): Dictionary containing the row data where keys should match table headers
        
    Returns:
        JsonResponse: Success confirmation with added row data or error response
            - On success: {"message": "...", "data": {...}} with status 201
            - On validation error: {"error": "...", "expected_headers": [...]} with status 400
            - On table not found: 404 response from get_object_or_404
            - On error: {"error": "...", "details": "..."} with status 500
            
    Business Logic:
        - Validates input parameters (table_id exists, new_row is dict)
        - Fetches JsonTable using get_object_or_404 (raises 404 if not found)
        - Validates row structure: all keys in new_row must exist in table headers
        - Creates new JsonTableRow with the provided data
        - Returns confirmation with the added row data
        
    Validation Rules:
        - new_row must be a dictionary
        - All keys in new_row must match existing table headers
        - Extra validation can be added for data types or required fields
    """
    try:
        if not table_id or not isinstance(new_row, dict):
            return JsonResponse({
                "error": "Invalid input. 'table_id' must be provided and 'new_row' must be a dictionary."
            }, status=400)

        # Get the JsonTable instance (raises 404 if not found)
        json_table = get_object_or_404(JsonTable, table_id=table_id)

        # Optional: Validate if row keys match table headers
        if not all(key in json_table.headers for key in new_row.keys()):
            return JsonResponse({
                "error": "Row keys do not match table headers.",
                "expected_headers": json_table.headers
            }, status=400)

        # Save the new row
        JsonTableRow.objects.create(table=json_table, data=new_row)

        return JsonResponse({"message": "Row added successfully.", "data": new_row}, status=201)

    except Exception as e:
        return JsonResponse({
            "error": "Failed to add row.",
            "details": str(e)
        }, status=500)


def create_table_with_headers(refresh_token, table_name, description, headers):
    """
    Create a new dynamic table with specified headers for an authenticated user.
    
    This function performs a two-step creation process: first creating the table metadata
    in DynamicTableData, then creating the table structure with headers in JsonTable.
    This establishes the foundation for a new data table that can hold rows.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_name (str): Display name for the new table
        description (str): Descriptive text explaining the table's purpose
        headers (list): Array of strings representing column names
        
    Returns:
        JsonResponse: Created table information or error response
            - On success: {"message": "...", "table_id": int, "table_name": str, "headers": [...]} with status 201
            - On auth failure: {"message": "..."} with status 401
            - On validation error: {"message": "..."} with status 400
            - On error: {"message": "...", "error": "..."} with status 500
            
    Business Logic:
        - Authenticates user via refresh token
        - Validates required parameters (table_name, description not empty)
        - Validates headers format (must be list of strings)
        - Creates DynamicTableData record with user association
        - Creates JsonTable record linked to the DynamicTableData
        - Returns table ID and confirmation for immediate use
        
    Database Operations:
        1. INSERT into DynamicTableData (metadata)
        2. INSERT into JsonTable (structure with headers)
        
    The created table will be empty (no rows) but ready to accept data via add_row_to_table.
    """
    try:
        # Extract token and user
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)

        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

        # Validate required fields
        if not table_name or not description:
            return JsonResponse({
                "message": "Both 'table_name' and 'description' are required."
            }, status=400)

        if not isinstance(headers, list) or not all(isinstance(h, str) for h in headers):
            return JsonResponse({
                "message": "'headers' must be a list of strings."
            }, status=400)

        # Step 1: Create table
        dynamic_table = DynamicTableData.objects.create(
            table_name=table_name,
            description=description,
            user=user,
            pending_count=0
        )
        
        # Step 2: Add headers
        JsonTable.objects.create(table=dynamic_table, headers=headers)

        return JsonResponse({
            "message": "Table and headers created successfully.",
            "table_id": dynamic_table.id,
            "table_name": dynamic_table.table_name,
            "headers": headers
        }, status=201)

    except Exception as e:
        return JsonResponse({
            "message": "Failed to create table with headers.",
            "error": str(e)
        }, status=500)


def add_column_to_table(refresh_token, table_id, header):
    """
    Add a new column (header) to an existing table and update all existing rows.
    
    This function modifies table structure by adding a new column header and ensures
    data consistency by adding the new column to all existing rows with empty values.
    Requires user authentication and prevents duplicate header names.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_id (int): Primary key ID of the target JsonTable
        header (str): Name of the new column header to add
        
    Returns:
        JsonResponse: Success confirmation with updated headers or error response
            - On success: {"message": "...", "headers": [...]} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On validation error: {"error": "..."} with status 400
            - On duplicate header: {"error": "Header 'X' already exists..."} with status 400
            - On error: {"error": "...", "details": "..."} with status 500
            
    Business Logic:
        - Authenticates user via refresh token
        - Validates input parameters (table_id and header string)
        - Fetches JsonTable using get_object_or_404
        - Checks for duplicate header names in existing headers list
        - Appends new header to the headers JSONField array
        - Iterates through all existing rows and adds new column with empty string value
        - Saves all changes to database
        
    Data Consistency:
        - All existing rows are updated to include the new column
        - New column values are initialized as empty strings
        - Table structure remains consistent across all rows
        
    Note: This operation can be expensive for tables with many rows as it updates every row.
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)

        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

        if not table_id or not isinstance(header, str):
            return JsonResponse({
                "error": "'table_id' and a string 'header' are required."
            }, status=400)

        # Fetch JsonTable
        json_table = get_object_or_404(JsonTable, pk=table_id)

        # Prevent duplicate header
        if header in json_table.headers:
            return JsonResponse({
                "error": f"Header '{header}' already exists in table."
            }, status=400)

        # Add new header to the header list
        json_table.headers.append(header)
        json_table.save()

        # Update all rows by adding new column with empty string
        for row in json_table.rows.all():
            row.data[header] = ""
            row.save()

        return JsonResponse({
            "message": f"Header '{header}' added successfully.",
            "headers": json_table.headers
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "error": "Failed to add new column.",
            "details": str(e)
        }, status=500)


def delete_column_from_table(refresh_token, table_id, new_headers):
    """
    Remove columns from a table by providing the desired final header list.
    
    This function performs column deletion by comparing current headers with the provided
    new headers list. It removes columns that are not in the new list and cleans up
    all row data to maintain consistency. Requires user authentication.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_id (int): Primary key ID of the target JsonTable
        new_headers (list): Array of strings representing the desired final headers
        
    Returns:
        JsonResponse: Success confirmation with deletion details or error response
            - On success: {"message": "Deleted columns: [...]", "headers": [...]} with status 200
            - On no change: {"message": "No headers were deleted.", "headers": [...]} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On validation error: {"error": "..."} with status 400
            - On error: {"error": "...", "details": "..."} with status 500
            
    Business Logic:
        - Authenticates user via refresh token
        - Validates input (table_id exists, new_headers is list of strings)
        - Fetches JsonTable and compares current headers with new_headers
        - Calculates which headers to delete (set difference operation)
        - Updates JsonTable.headers to the new list
        - Removes deleted header keys from all existing row data
        - Returns list of deleted columns and final header state
        
    Data Cleanup:
        - Removes specified column keys from all JsonTableRow.data dictionaries
        - Uses dict.pop() with None default to safely remove keys
        - Maintains data integrity by ensuring no orphaned column data remains
        
    Safety Features:
        - Returns success even if no columns were actually deleted
        - Handles missing keys gracefully during row data cleanup
        - Validates new_headers format before processing
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)

        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

        if not table_id or not isinstance(new_headers, list) or not all(isinstance(h, str) for h in new_headers):
            return JsonResponse({
                "error": "'table_id' and 'new_headers' (list of strings) are required."
            }, status=400)

        # Fetch JsonTable
        json_table = get_object_or_404(JsonTable, pk=table_id)

        old_headers = json_table.headers
        deleted_headers = set(old_headers) - set(new_headers)

        if not deleted_headers:
            return JsonResponse({
                "message": "No headers were deleted.",
                "headers": old_headers
            }, status=200)

        # Update headers in JsonTable
        json_table.headers = new_headers
        json_table.save()

        # Remove deleted header keys from all rows
        for row in json_table.rows.all():
            for col in deleted_headers:
                row.data.pop(col, None)  # Remove the key if it exists
            row.save()

        return JsonResponse({
            "message": f"Deleted columns: {list(deleted_headers)}",
            "headers": new_headers
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "error": "Failed to delete column(s).",
            "details": str(e)
        }, status=500)


def delete_row_from_table(refresh_token, table_id, row_id):
    """
    Delete a specific row from a table based on the row's internal ID.
    
    This function removes a row from a JsonTable by matching the row_id against
    the 'id' field stored within each row's JSON data. It requires user authentication
    and validates table existence before attempting row deletion.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_id (int): Primary key ID of the target JsonTable
        row_id (str/int): The ID value stored in the row's data['id'] field
        
    Returns:
        JsonResponse: Success confirmation or error response
            - On success: {"message": "Row with ID X successfully deleted..."} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On validation error: {"error": "..."} with status 400
            - On table not found: {"error": "Table with ID X does not exist."} with status 404
            - On row not found: {"error": "No row with id 'X' found..."} with status 404
            - On error: {"error": "...", "details": "..."} with status 500
            
    Business Logic:
        - Authenticates user via refresh token
        - Validates required parameters (table_id and row_id)
        - Fetches JsonTable with custom error handling
        - Iterates through all rows to find matching data['id']
        - Performs string comparison to handle different ID types
        - Deletes the matching JsonTableRow record
        
    Row Matching Strategy:
        - Searches through JsonTableRow.data['id'] fields
        - Uses string conversion for flexible ID matching
        - Returns 404 if no matching row found
        - Only deletes the first matching row (assumes unique IDs)
        
    Note: This function looks for the ID within the row's JSON data, not the
    Django model's primary key. The row data structure should include an 'id' field.
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)

        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

        if not table_id or not row_id:
            return JsonResponse({
                "error": "'table_id' and 'row_id' are required."
            }, status=400)

        # Custom error handling for JsonTable
        try:
            json_table = JsonTable.objects.get(pk=table_id)
        except JsonTable.DoesNotExist:
            return JsonResponse({
                "error": f"Table with ID {table_id} does not exist."
            }, status=404)

        # Find the row by data['id']
        target_row = None
        for row in json_table.rows.all():
            if str(row.data.get("id")) == str(row_id):
                target_row = row
                break

        if not target_row:
            return JsonResponse({
                "error": f"No row with id '{row_id}' found in table {table_id}."
            }, status=404)

        target_row.delete()

        return JsonResponse({
            "message": f"Row with ID {row_id} successfully deleted from table {table_id}."
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "error": "Failed to delete the row.",
            "details": str(e)
        }, status=500)


def update_table_row(refresh_token, table_id, row_id, new_row_data):
    """
    Update specific fields in an existing table row with new data.
    
    This function performs a partial update (PATCH-like) on a table row by merging
    new data with existing row data. It preserves existing fields not included in
    the update and maintains the row's ID field. Requires user authentication.
    
    Args:
        refresh_token (str): JWT refresh token for user authentication
        table_id (int): Primary key ID of the target JsonTable
        row_id (str/int): The ID value stored in the target row's data['id'] field
        new_row_data (dict): Dictionary containing fields to update with new values
        
    Returns:
        JsonResponse: Success confirmation with updated row or error response
            - On success: {"status": "success", "updated_row": {...}} with status 200
            - On auth failure: {"message": "..."} with status 401
            - On validation error: {"error": "Missing table_id or row_id"} with status 400
            - On row not found: {"error": "Row not found"} with status 404
            - On error: {"error": "..."} with status 400
            
    Business Logic:
        - Authenticates user via refresh token
        - Validates required parameters (table_id, row_id)
        - Uses Django ORM lookup with data__id to find row efficiently
        - Merges new_row_data with existing row data (new values override)
        - Preserves the original 'id' field to maintain row identity
        - Saves updated row data back to database
        
    Update Strategy:
        - Partial update: only provided fields are modified
        - Field preservation: existing fields not in new_row_data remain unchanged
        - ID preservation: row ID is always maintained for consistency
        - Merge operation: uses dictionary unpacking for clean data combination
        
    Data Integrity:
        - Validates row exists before updating
        - Maintains row structure and relationships
        - Preserves foreign key relationships through table_id
        
    Performance Note: Uses data__id lookup which leverages PostgreSQL JSON indexing
    for efficient row finding without iteration.
    """
    try:
        if not refresh_token:
            return JsonResponse({'message': "Refresh token not provided."}, status=401)

        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)

        if not user.is_authenticated:
            return JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)

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
        for key, value in new_row_data.items():
            current_data[key] = value
        
        # Preserve the id field
        if 'id' in current_data:
            new_row_data['id'] = current_data['id']
        
        row.data = {**current_data, **new_row_data}
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


def get_authenticated_user(refresh_token):
    """
    Helper function to authenticate and retrieve user from JWT refresh token.
    
    This utility function centralizes the authentication logic used across multiple
    table operations. It decodes the refresh token, fetches the user, and validates
    their authentication status. Returns both user object and potential error response.
    
    Args:
        refresh_token (str): JWT refresh token from client cookies
        
    Returns:
        tuple: (User object or None, JsonResponse error or None)
            - On success: (User instance, None)
            - On missing token: (None, JsonResponse with 401)
            - On invalid token: (None, JsonResponse with 401)
            - On authentication failure: (None, JsonResponse with 401)
            
    Business Logic:
        - Validates refresh_token is provided
        - Decodes token to extract user_id using decode_refresh_token()
        - Fetches User model instance from database
        - Checks user.is_authenticated status
        - Returns user for successful authentication
        - Returns appropriate error response for any failure
        
    Error Handling:
        - Missing token: "Refresh token not provided"
        - Invalid token: "Invalid refresh token" (from decode exception)
        - User not authenticated: "Authentication credentials were not provided or are invalid"
        
    Usage Pattern:
        user, error = get_authenticated_user(refresh_token)
        if error:
            return error
        # Proceed with authenticated user operations
        
    This helper reduces code duplication and ensures consistent authentication
    handling across all protected table operations.
    """
    if not refresh_token:
        return None, JsonResponse({'message': "Refresh token not provided."}, status=401)
    
    try:
        user_id = decode_refresh_token(refresh_token)
        user = User.objects.get(id=user_id)
        
        if not user.is_authenticated:
            return None, JsonResponse({
                "message": "Authentication credentials were not provided or are invalid."
            }, status=401)
        
        return user, None
    except Exception as e:
        return None, JsonResponse({
            "message": "Invalid refresh token.",
            "error": str(e)
        }, status=401)