import sys
import os

# Django setup (do not remove)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_api.settings.development')
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
import django
django.setup()

# MCP & Django imports
from mcp.server.fastmcp import FastMCP
from django.utils.timezone import now
from asgiref.sync import sync_to_async  # ✅ Added for async compatibility
from expense_api.apps.llm.models import User, Category

# MCP server
mcp = FastMCP("database_operations")

# ✅ Tool 1: insert_user with async-compatible Django ORM access
@mcp.tool()
async def insert_user(name: str, email: str) -> str:
    """
    Insert a new user into the system.

    Parameters:
    - name: Full name of the user
    - email: Email address (must be unique)

    Returns:
    - Success or error message
    """
    try:
        exists = await sync_to_async(User.objects.filter(email=email).exists)()
        if exists:
            return "Error: A user with this email already exists."

        await sync_to_async(User.objects.create)(name=name, email=email)
        return f"User '{name}' inserted successfully."

    except Exception as e:
        return f"Error: {str(e)}"

# ✅ Tool 2: insert_category_table with async compatibility
@mcp.tool()
async def insert_category_table(use_id: str, table: dict, table_category: str) -> str:
    """
    Insert a new Category entry for the given user.

    Parameters:
    - use_id: ID of the user as a string
    - table: JSON structure containing columns, rows, notes
    - table_category: Name/category label for the table

    Returns:
    - Status message
    """
    print("inside server")
    try:
        user = await sync_to_async(User.objects.get)(id=use_id)
        await sync_to_async(Category.objects.create)(
            user=user,
            table=table,
            table_category=table_category,
            created_at=now()
        )
        return "Category inserted successfully."
    
    except User.DoesNotExist:
        return "Error: User not found."
    
    except Exception as e:
        return f"Error: {str(e)}"

# ✅ MCP entry point
if __name__ == "__main__":
    mcp.run(transport='stdio')

print("DB Server is running")
