#!/usr/bin/env python3
"""
Finance Management MCP Server

This MCP server provides tools for managing dynamic tables, expenses, and financial data
through the Model Context Protocol. It wraps Django ORM operations and exposes them
as callable tools for AI agents.
"""

import sys
import os
import json
import uuid
from typing import Optional

# Django setup - MUST be done before any Django imports
sys.path.insert(0, '/home/mehedi/03_Projects/FinanceManagement/expense_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_api.settings.development')

import django
from django.conf import settings

# Ensure Django is properly configured
if not settings.configured:
    django.setup()
else:
    # If already configured, just ensure apps are loaded
    django.apps.apps.populate(settings.INSTALLED_APPS)

# Now we can safely import Django models and MCP
from mcp.server.fastmcp import FastMCP
from django.utils.timezone import now
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from django.db import transaction
from expense_api.apps.FinanceManagement.models import DynamicTableData, JsonTable, JsonTableRow
from expense_api.apps.FinanceManagement.serializers import DynamicTableSerializer

# MCP server
mcp = FastMCP("finance_management")

# ✅ Tool 1: Get all tables for a user
@mcp.tool()
async def get_user_tables(user_id: int) -> str:
    """
    Get all dynamic tables for a user.
    
    Parameters:
    - user_id: User ID to fetch tables for
    
    Returns:
    - JSON string with tables data or error message
    """
    try:
        user_exists = await sync_to_async(User.objects.filter(id=user_id).exists)()
        if not user_exists:
            return json.dumps({"success": False, "error": "User not found"})
        
        user = await sync_to_async(User.objects.get)(id=user_id)
        tables = await sync_to_async(lambda: list(DynamicTableData.objects.filter(user=user)))()
        
        if not tables:
            return json.dumps({
                "success": True,
                "message": "No tables found for user",
                "data": []
            })
        
        serializer_data = await sync_to_async(
            lambda: DynamicTableSerializer(tables, many=True).data
        )()
        
        return json.dumps({
            "success": True,
            "message": f"Found {len(tables)} tables",
            "data": serializer_data
        })
        
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 2: Create a new table with headers
@mcp.tool()
async def create_table(user_id: int, table_name: str, description: str, headers: str) -> str:
    """
    Create a new table with headers.
    
    Parameters:
    - user_id: User ID who owns the table
    - table_name: Name of the table
    - description: Description of the table
    - headers: JSON string of column headers array
    
    Returns:
    - JSON string with success status and table data
    """
    try:
        # Parse headers from JSON string
        headers_list = json.loads(headers) if isinstance(headers, str) else headers
        
        if not isinstance(headers_list, list) or not all(isinstance(h, str) for h in headers_list):
            return json.dumps({"success": False, "error": "Headers must be a list of strings"})
        
        if not table_name.strip():
            return json.dumps({"success": False, "error": "Table name cannot be empty"})
        
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def create_table_sync():
            with transaction.atomic():
                dynamic_table = DynamicTableData.objects.create(
                    table_name=table_name.strip(),
                    description=description.strip(),
                    user=user,
                    pending_count=0
                )
                JsonTable.objects.create(table=dynamic_table, headers=headers_list)
                return dynamic_table
        
        dynamic_table = await create_table_sync()
        
        return json.dumps({
            "success": True,
            "message": "Table created successfully",
            "data": {
                "table_id": dynamic_table.id,
                "table_name": dynamic_table.table_name,
                "description": dynamic_table.description,
                "headers": headers_list
            }
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except json.JSONDecodeError:
        return json.dumps({"success": False, "error": "Invalid JSON format for headers"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 3: Add a new row to a table
@mcp.tool()
async def add_table_row(table_id: int, row_data: str) -> str:
    """
    Add a new row to an existing table.
    
    Parameters:
    - table_id: ID of the table to add row to
    - row_data: JSON string of row data as key-value pairs
    
    Returns:
    - JSON string with success status
    """
    try:
        # Parse row data from JSON string
        row_dict = json.loads(row_data) if isinstance(row_data, str) else row_data
        
        if not isinstance(row_dict, dict):
            return json.dumps({"success": False, "error": "Row data must be a dictionary"})
        
        json_table = await sync_to_async(JsonTable.objects.get)(pk=table_id)
        
        # Add unique ID if not present
        if 'id' not in row_dict:
            row_dict['id'] = str(uuid.uuid4())[:8]
        
        await sync_to_async(JsonTableRow.objects.create)(table=json_table, data=row_dict)
        
        return json.dumps({
            "success": True,
            "message": "Row added successfully",
            "data": row_dict
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except json.JSONDecodeError:
        return json.dumps({"success": False, "error": "Invalid JSON format for row data"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 4: Update an existing row
@mcp.tool()
async def update_table_row(table_id: int, row_id: str, new_data: str) -> str:
    """
    Update an existing row in a table.
    
    Parameters:
    - table_id: ID of the table
    - row_id: ID of the row to update
    - new_data: JSON string of new data to update
    
    Returns:
    - JSON string with success status
    """
    try:
        new_data_dict = json.loads(new_data) if isinstance(new_data, str) else new_data
        
        row = await sync_to_async(JsonTableRow.objects.get)(
            table_id=table_id,
            data__id=row_id
        )
        
        @sync_to_async
        def update_row():
            current_data = row.data or {}
            current_data.update(new_data_dict)
            row.data = current_data
            row.save()
            return row.data
        
        updated_data = await update_row()
        
        return json.dumps({
            "success": True,
            "message": "Row updated successfully",
            "data": updated_data
        })
        
    except JsonTableRow.DoesNotExist:
        return json.dumps({"success": False, "error": "Row not found"})
    except json.JSONDecodeError:
        return json.dumps({"success": False, "error": "Invalid JSON format for new data"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 5: Delete a row from a table
@mcp.tool()
async def delete_table_row(table_id: int, row_id: str) -> str:
    """
    Delete a row from a table.
    
    Parameters:
    - table_id: ID of the table
    - row_id: ID of the row to delete
    
    Returns:
    - JSON string with success status
    """
    try:
        json_table = await sync_to_async(JsonTable.objects.get)(pk=table_id)
        
        @sync_to_async
        def delete_row():
            for row in json_table.rows.all():
                if str(row.data.get("id")) == str(row_id):
                    row.delete()
                    return True
            return False
        
        deleted = await delete_row()
        
        if not deleted:
            return json.dumps({"success": False, "error": f"Row with id '{row_id}' not found"})
        
        return json.dumps({
            "success": True,
            "message": f"Row {row_id} deleted successfully"
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 6: Get table content
@mcp.tool()
async def get_table_content(user_id: int, table_id: Optional[int] = None) -> str:
    """
    Get complete content of all tables or specific table.
    
    Parameters:
    - user_id: User ID to filter tables
    - table_id: Optional specific table ID to fetch
    
    Returns:
    - JSON string with table content
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def get_tables():
            if table_id:
                tables = JsonTable.objects.filter(table_id=table_id, table__user=user)
            else:
                tables = JsonTable.objects.filter(table__user=user)
            
            result = []
            for table in tables:
                table_dict = {
                    "id": table.table.id,
                    "table_name": table.table.table_name,
                    "description": table.table.description,
                    "data": {
                        "headers": table.headers,
                        "rows": [row.data for row in table.rows.all()]
                    }
                }
                result.append(table_dict)
            return result
        
        result = await get_tables()
        
        return json.dumps({
            "success": True,
            "message": f"Found {len(result)} tables",
            "data": result
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 7: Add a column to a table
@mcp.tool()
async def add_table_column(table_id: int, header: str) -> str:
    """
    Add a new column to an existing table.
    
    Parameters:
    - table_id: ID of the table
    - header: Name of the new column header
    
    Returns:
    - JSON string with success status
    """
    try:
        json_table = await sync_to_async(JsonTable.objects.get)(pk=table_id)
        
        if header in json_table.headers:
            return json.dumps({"success": False, "error": f"Header '{header}' already exists"})
        
        @sync_to_async
        def add_column():
            json_table.headers.append(header)
            json_table.save()
            
            # Update all rows with empty value for new column
            for row in json_table.rows.all():
                row.data[header] = ""
                row.save()
            
            return json_table.headers
        
        updated_headers = await add_column()
        
        return json.dumps({
            "success": True,
            "message": f"Column '{header}' added successfully",
            "headers": updated_headers
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 8: Delete columns from a table
@mcp.tool()
async def delete_table_columns(table_id: int, new_headers: str) -> str:
    """
    Delete columns from a table by providing new headers list.
    
    Parameters:
    - table_id: ID of the table
    - new_headers: JSON string of headers to keep (others will be deleted)
    
    Returns:
    - JSON string with success status
    """
    try:
        new_headers_list = json.loads(new_headers) if isinstance(new_headers, str) else new_headers
        json_table = await sync_to_async(JsonTable.objects.get)(pk=table_id)
        
        @sync_to_async
        def delete_columns():
            old_headers = json_table.headers
            deleted_headers = set(old_headers) - set(new_headers_list)
            
            if not deleted_headers:
                return old_headers, []
            
            json_table.headers = new_headers_list
            json_table.save()
            
            # Update rows to remove deleted columns
            for row in json_table.rows.all():
                for col in deleted_headers:
                    row.data.pop(col, None)
                row.save()
            
            return new_headers_list, list(deleted_headers)
        
        updated_headers, deleted_headers = await delete_columns()
        
        return json.dumps({
            "success": True,
            "message": f"Deleted columns: {deleted_headers}" if deleted_headers else "No columns deleted",
            "headers": updated_headers
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except json.JSONDecodeError:
        return json.dumps({"success": False, "error": "Invalid JSON format for headers"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 9: Update table metadata
@mcp.tool()
async def update_table_metadata(user_id: int, table_id: int, table_name: Optional[str] = None, 
                               description: Optional[str] = None, pending_count: Optional[int] = None) -> str:
    """
    Update table name, description, or pending count.
    
    Parameters:
    - user_id: User ID who owns the table
    - table_id: ID of the table to update
    - table_name: New table name (optional)
    - description: New description (optional)
    - pending_count: New pending count (optional)
    
    Returns:
    - JSON string with success status
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        table = await sync_to_async(DynamicTableData.objects.get)(id=table_id, user=user)
        
        @sync_to_async
        def update_metadata():
            updated = False
            
            if table_name is not None:
                table.table_name = table_name
                updated = True
            if description is not None:
                table.description = description
                updated = True
            if pending_count is not None:
                table.pending_count = pending_count
                updated = True
            
            if updated:
                table.save()
                return DynamicTableSerializer(table).data, True
            return None, False
        
        serializer_data, was_updated = await update_metadata()
        
        if was_updated:
            return json.dumps({
                "success": True,
                "message": "Table updated successfully",
                "data": serializer_data
            })
        else:
            return json.dumps({"success": False, "error": "No fields to update"})
            
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except DynamicTableData.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 10: Delete a table
@mcp.tool()
async def delete_table(user_id: int, table_id: int) -> str:
    """
    Delete a table and all its data.
    
    Parameters:
    - user_id: User ID who owns the table
    - table_id: ID of the table to delete
    
    Returns:
    - JSON string with success status
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        table = await sync_to_async(DynamicTableData.objects.get)(id=table_id, user=user)
        
        @sync_to_async
        def delete_table_sync():
            with transaction.atomic():
                table_name = table.table_name
                table.delete()  # This will cascade delete JsonTable and JsonTableRow
                return table_name
        
        deleted_table_name = await delete_table_sync()
        
        return json.dumps({
            "success": True,
            "message": f"Table '{deleted_table_name}' deleted successfully"
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except DynamicTableData.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ MCP entry point
if __name__ == "__main__":
    mcp.run(transport='stdio')
    print("Finance Management Server is running")