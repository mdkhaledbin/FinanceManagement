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
import time

# Django setup - MUST be done before any Django imports
# Calculate the backend path dynamically
current_script_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_script_dir, "..", "..", "..", "..")
backend_path = os.path.abspath(backend_path)

# Allow override via environment variable
backend_path = os.environ.get('FINANCE_BACKEND_PATH', backend_path)
django_settings = os.environ.get('DJANGO_SETTINGS_MODULE', 'expense_api.settings.development')

sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', django_settings)

print(f"[INFO] MCP Server starting from: {current_script_dir}")
print(f"[INFO] Backend path resolved to: {backend_path}")
print(f"[INFO] Django settings module: {django_settings}")

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
from expense_api.apps.agent.models import ChatSession, ChatMessage
from expense_api.apps.agent.serializers import ChatSessionSerializer, ChatMessageSerializer

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
async def create_table(user_id: int, table_name: str, description: str, headers) -> str:
    """
    Create a new table with headers.
    
    Parameters:
    - user_id: User ID who owns the table
    - table_name: Name of the table
    - description: Description of the table
    - headers: List of column headers or JSON string of headers array
    
    Returns:
    - JSON string with success status and table data
    """
    try:
        # Handle both string and list inputs for headers
        if isinstance(headers, str):
            try:
                headers_list = json.loads(headers)
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": "Invalid JSON format for headers"})
        elif isinstance(headers, list):
            headers_list = headers
        else:
            return json.dumps({"success": False, "error": "Headers must be a list or JSON string"})
        
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
                    description=description.strip() if description else "",
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
                "headers": headers_list,
                "user_id": user.id,
                "created_at": dynamic_table.created_at.isoformat()
            }
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 3: Add a new row to a table
@mcp.tool()
async def add_table_row(table_id: int, row_data) -> str:
    """
    Add a new row to an existing table.
    
    Parameters:
    - table_id: ID of the table to add row to
    - row_data: Row data as dictionary or JSON string
    
    Returns:
    - JSON string with success status
    """
    try:
        # Handle both string and dict inputs
        if isinstance(row_data, str):
            try:
                row_dict = json.loads(row_data)
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": "Invalid JSON format for row data"})
        elif isinstance(row_data, dict):
            row_dict = row_data
        else:
            return json.dumps({"success": False, "error": "Row data must be a dictionary or JSON string"})
        
        # Get JsonTable by the table_id (which is the primary key from DynamicTableData)
        json_table = await sync_to_async(JsonTable.objects.get)(table_id=table_id)
        
        # Add unique ID if not present
        if 'id' not in row_dict:
            row_dict['id'] = str(uuid.uuid4())[:8]
        
        # Create the row
        await sync_to_async(JsonTableRow.objects.create)(table=json_table, data=row_dict)
        
        return json.dumps({
            "success": True,
            "message": "Row added successfully",
            "data": row_dict
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 4: Update an existing row
@mcp.tool()
async def update_table_row(table_id: int, row_id: str, new_data) -> str:
    """
    Update an existing row in a table.
    
    Parameters:
    - table_id: ID of the table
    - row_id: ID of the row to update
    - new_data: New data to update as dictionary or JSON string
    
    Returns:
    - JSON string with success status
    """
    try:
        # Handle both string and dict inputs
        if isinstance(new_data, str):
            try:
                new_data_dict = json.loads(new_data)
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": "Invalid JSON format for new data"})
        elif isinstance(new_data, dict):
            new_data_dict = new_data
        else:
            return json.dumps({"success": False, "error": "New data must be a dictionary or JSON string"})
        
        # Find the row using table_id and the id within the JSON data
        row = await sync_to_async(JsonTableRow.objects.get)(
            table__table_id=table_id,
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
async def delete_table_columns(table_id: int, new_headers) -> str:
    """
    Delete columns from a table by providing new headers list.
    
    Parameters:
    - table_id: ID of the table
    - new_headers: List of headers to keep or JSON string (others will be deleted)
    
    Returns:
    - JSON string with success status
    """
    try:
        # Handle both string and list inputs
        if isinstance(new_headers, str):
            try:
                new_headers_list = json.loads(new_headers)
            except json.JSONDecodeError:
                return json.dumps({"success": False, "error": "Invalid JSON format for headers"})
        elif isinstance(new_headers, list):
            new_headers_list = new_headers
        else:
            return json.dumps({"success": False, "error": "Headers must be a list or JSON string"})
            
        json_table = await sync_to_async(JsonTable.objects.get)(table_id=table_id)
        
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

# ✅ Tool 11: Delete a single column from a table
@mcp.tool()
async def delete_single_column(table_id: int, header: str) -> str:
    """
    Delete a single column from a table.
    
    Parameters:
    - table_id: ID of the table
    - header: Name of the column header to delete
    
    Returns:
    - JSON string with success status
    """
    try:
        json_table = await sync_to_async(JsonTable.objects.get)(pk=table_id)
        
        if header not in json_table.headers:
            return json.dumps({"success": False, "error": f"Header '{header}' does not exist in the table"})
        
        @sync_to_async
        def delete_column():
            # Remove the header from the headers list
            json_table.headers.remove(header)
            json_table.save()
            
            # Remove the header key from all rows
            for row in json_table.rows.all():
                if header in row.data:
                    del row.data[header]
                    row.save()
            
            return json_table.headers
        
        updated_headers = await delete_column()
        
        return json.dumps({
            "success": True,
            "message": f"Column '{header}' deleted successfully",
            "headers": updated_headers
        })
        
    except JsonTable.DoesNotExist:
        return json.dumps({"success": False, "error": "Table not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ============ CHAT SESSION MANAGEMENT TOOLS ============

# ✅ Tool 12: Create a new chat session
@mcp.tool()
async def create_chat_session(user_id: int, title: str = "New Chat") -> str:
    """
    Create a new chat session for a user.
    
    Parameters:
    - user_id: User ID who owns the session
    - title: Title for the chat session
    
    Returns:
    - JSON string with session data
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def create_session():
            session_id = f"chat_{user_id}_{int(time.time())}"
            session = ChatSession.objects.create(
                user=user,
                session_id=session_id,
                title=title
            )
            return ChatSessionSerializer(session).data
        
        session_data = await create_session()
        
        return json.dumps({
            "success": True,
            "message": "Chat session created successfully",
            "data": session_data
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 13: Get all chat sessions for a user
@mcp.tool()
async def get_chat_sessions(user_id: int) -> str:
    """
    Get all active chat sessions for a user.
    
    Parameters:
    - user_id: User ID to fetch sessions for
    
    Returns:
    - JSON string with sessions data
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def get_sessions():
            sessions = ChatSession.objects.filter(user=user, is_active=True)
            return ChatSessionSerializer(sessions, many=True).data
        
        sessions_data = await get_sessions()
        
        return json.dumps({
            "success": True,
            "message": f"Found {len(sessions_data)} chat sessions",
            "data": sessions_data
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 14: Get chat session details
@mcp.tool()
async def get_chat_session(user_id: int, session_id: str) -> str:
    """
    Get specific chat session details.
    
    Parameters:
    - user_id: User ID who owns the session
    - session_id: Session ID to retrieve
    
    Returns:
    - JSON string with session data
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def get_session():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            return ChatSessionSerializer(session).data
        
        session_data = await get_session()
        
        return json.dumps({
            "success": True,
            "message": "Chat session retrieved successfully",
            "data": session_data
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 15: Update chat session
@mcp.tool()
async def update_chat_session(user_id: int, session_id: str, title: Optional[str] = None, is_active: Optional[bool] = None) -> str:
    """
    Update chat session details.
    
    Parameters:
    - user_id: User ID who owns the session
    - session_id: Session ID to update
    - title: New title for the session (optional)
    - is_active: Active status (optional)
    
    Returns:
    - JSON string with updated session data
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def update_session():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            updated = False
            
            if title is not None:
                session.title = title
                updated = True
            if is_active is not None:
                session.is_active = is_active
                updated = True
            
            if updated:
                session.save()
                return ChatSessionSerializer(session).data, True
            return None, False
        
        session_data, was_updated = await update_session()
        
        if was_updated:
            return json.dumps({
                "success": True,
                "message": "Chat session updated successfully",
                "data": session_data
            })
        else:
            return json.dumps({"success": False, "error": "No fields to update"})
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 16: Delete chat session
@mcp.tool()
async def delete_chat_session(user_id: int, session_id: str) -> str:
    """
    Delete (soft delete) a chat session.
    
    Parameters:
    - user_id: User ID who owns the session
    - session_id: Session ID to delete
    
    Returns:
    - JSON string with success status
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def delete_session():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            session.is_active = False
            session.save()
            return session.title
        
        session_title = await delete_session()
        
        return json.dumps({
            "success": True,
            "message": f"Chat session '{session_title}' deleted successfully"
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ============ CHAT MESSAGE MANAGEMENT TOOLS ============

# ✅ Tool 17: Save chat message
@mcp.tool()
async def save_chat_message(user_id: int, session_id: str, message_id: str, text: str, sender: str, 
                           is_typing: bool = False, displayed_text: Optional[str] = None, 
                           agent_data: Optional[str] = None) -> str:
    """
    Save a chat message to a session.
    
    Parameters:
    - user_id: User ID who owns the message
    - session_id: Session ID to save message to
    - message_id: Unique message ID
    - text: Message text content
    - sender: Message sender ('user' or 'bot')
    - is_typing: Whether this is a typing indicator (optional)
    - displayed_text: Text to display (optional, defaults to text)
    - agent_data: Additional agent data as JSON string (optional)
    
    Returns:
    - JSON string with message data
    """
    try:
        if sender not in ['user', 'bot']:
            return json.dumps({"success": False, "error": "Sender must be 'user' or 'bot'"})
        
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def save_message():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            
            # Parse agent_data if provided
            parsed_agent_data = None
            if agent_data:
                try:
                    parsed_agent_data = json.loads(agent_data)
                except json.JSONDecodeError:
                    parsed_agent_data = {"raw": agent_data}
            
            message = ChatMessage.objects.create(
                chat_session=session,
                user=user,
                message_id=message_id,
                text=text,
                sender=sender,
                is_typing=is_typing,
                displayed_text=displayed_text or text,
                agent_data=parsed_agent_data
            )
            
            # Update session timestamp
            session.save()
            
            return ChatMessageSerializer(message).data
        
        message_data = await save_message()
        
        return json.dumps({
            "success": True,
            "message": "Chat message saved successfully",
            "data": message_data
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 18: Get chat messages
@mcp.tool()
async def get_chat_messages(user_id: int, session_id: str, limit: Optional[int] = 100) -> str:
    """
    Get chat messages from a session.
    
    Parameters:
    - user_id: User ID who owns the session
    - session_id: Session ID to get messages from
    - limit: Maximum number of messages to return (optional, default 100)
    
    Returns:
    - JSON string with messages data
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def get_messages():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            messages = ChatMessage.objects.filter(chat_session=session).order_by('timestamp')
            
            if limit:
                messages = messages[:limit]
            
            return {
                "session_info": {
                    "session_id": session.session_id,
                    "title": session.title
                },
                "messages": ChatMessageSerializer(messages, many=True).data
            }
        
        result = await get_messages()
        
        return json.dumps({
            "success": True,
            "message": f"Retrieved {len(result['messages'])} messages",
            "data": result
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 19: Clear chat messages
@mcp.tool()
async def clear_chat_messages(user_id: int, session_id: str) -> str:
    """
    Clear all messages from a chat session.
    
    Parameters:
    - user_id: User ID who owns the session
    - session_id: Session ID to clear messages from
    
    Returns:
    - JSON string with success status
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def clear_messages():
            session = ChatSession.objects.get(session_id=session_id, user=user)
            deleted_count = ChatMessage.objects.filter(chat_session=session).delete()[0]
            return deleted_count
        
        deleted_count = await clear_messages()
        
        return json.dumps({
            "success": True,
            "message": f"Cleared {deleted_count} messages from chat session"
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except ChatSession.DoesNotExist:
        return json.dumps({"success": False, "error": "Chat session not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 20: Search tables by name or description
@mcp.tool()
async def search_tables(user_id: int, query: str) -> str:
    """
    Search user's tables by name or description.
    
    Parameters:
    - user_id: User ID to search tables for
    - query: Search query string
    
    Returns:
    - JSON string with matching tables
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def search():
            from django.db.models import Q
            tables = DynamicTableData.objects.filter(
                user=user
            ).filter(
                Q(table_name__icontains=query) | Q(description__icontains=query)
            )
            return DynamicTableSerializer(tables, many=True).data
        
        results = await search()
        
        return json.dumps({
            "success": True,
            "message": f"Found {len(results)} matching tables",
            "data": results
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ Tool 21: Get table statistics
@mcp.tool()
async def get_table_statistics(user_id: int, table_id: Optional[int] = None) -> str:
    """
    Get statistics for user's tables.
    
    Parameters:
    - user_id: User ID to get statistics for
    - table_id: Optional specific table ID (if None, returns all tables stats)
    
    Returns:
    - JSON string with statistics
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        
        @sync_to_async
        def get_stats():
            if table_id:
                tables = DynamicTableData.objects.filter(id=table_id, user=user)
            else:
                tables = DynamicTableData.objects.filter(user=user)
            
            stats = []
            for table in tables:
                try:
                    json_table = JsonTable.objects.get(table=table)
                    row_count = json_table.rows.count()
                    column_count = len(json_table.headers)
                except JsonTable.DoesNotExist:
                    row_count = 0
                    column_count = 0
                
                stats.append({
                    "table_id": table.id,
                    "table_name": table.table_name,
                    "description": table.description,
                    "row_count": row_count,
                    "column_count": column_count,
                    "pending_count": table.pending_count,
                    "created_at": table.created_at.isoformat(),
                    "modified_at": table.modified_at.isoformat()
                })
            
            return stats
        
        stats = await get_stats()
        
        return json.dumps({
            "success": True,
            "message": f"Statistics for {len(stats)} tables",
            "data": stats
        })
        
    except User.DoesNotExist:
        return json.dumps({"success": False, "error": "User not found"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

# ✅ MCP entry point
if __name__ == "__main__":
    mcp.run(transport='stdio')
    print("Finance Management Server is running")