import os
import sys
import json
from contextlib import AsyncExitStack

from django.conf import settings

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from langchain_mcp_adapters.tools import load_mcp_tools
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage


DEBUG = os.environ.get("MCP_DEBUG", "false").lower() == "true"

def debug_print(*args, **kwargs):
    if DEBUG:
        print("[DEBUG]", *args, **kwargs)


PROMPT_TEMPLATE = """
You are an intelligent expense tracker and financial data assistant.

Your job is to understand the user's natural language queries and invoke the appropriate finance management tools.

You have access to the following tools for managing financial data:

1. `get_user_tables(user_id: int)` - Get all tables belonging to a user
2. `create_table(user_id: int, table_name: str, description: str, headers: list)` - Create new expense/budget table
3. `add_table_row(table_id: int, row_data: dict)` - Add expense entry to a table
4. `update_table_row(table_id: int, row_id: str, new_data: dict)` - Update existing expense entry
5. `delete_table_row(table_id: int, row_id: str)` - Delete an expense entry
6. `get_table_content(user_id: int, table_id?: int)` - Get table data for analysis
7. `add_table_column(table_id: int, header: str)` - Add new column to table
8. `delete_table_columns(table_id: int, new_headers: list)` - Remove columns from table
9. `update_table_metadata(user_id: int, table_id: int, ...)` - Update table name/description

Instructions:
- Parse natural language queries about expenses, budgets, and financial tracking
- Extract relevant information like amounts, categories, dates, descriptions
- Use appropriate tools to perform requested operations
- When adding expenses, create proper row data with appropriate headers
- For Bengali/mixed language queries, understand the intent and extract structured data
- Always include user_id in operations (this will be provided in the query data)

Example Queries:
"ami gotokal sylhet e 100 tk khoroch korechi" 
→ Extract: amount=100, location/category=sylhet, date=yesterday
→ Tool: add_table_row with appropriate table_id and structured data

"Show me my expenses for this month"
→ Tool: get_table_content to retrieve and analyze data

"Create a new budget table for transport expenses"
→ Tool: create_table with appropriate headers like [Date, Amount, Description, Vehicle]

Always provide helpful responses and confirm successful operations.
"""


class ExpenseMCPClient:

    def __init__(self, anthropic_api_key=None):
        self.anthropic_api_key = anthropic_api_key or getattr(
            settings, "ANTHROPIC_API_KEY", os.getenv("ANTHROPIC_API_KEY")
        )
        if not self.anthropic_api_key:
            raise ValueError("Anthropic API key is required.")
        self.exit_stack = None
        self.client = None
        self.agent = None
        self.available_tools = []
        self.sessions = {}

    @staticmethod
    def read_config_json():
        config_path = os.getenv("mcpConfig")
        if not config_path:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(script_dir, "mcpConfig.json")
            print(f"[INFO] mcpConfig not set. Falling back to: {config_path}")
        try:
            with open(config_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Failed to read config file: {e}")
            sys.exit(1)

    async def connect(self):
        config = self.read_config_json()
        mcp_servers = config.get("mcpServers", {})
        if not mcp_servers:
            print("❌ No MCP servers found in the configuration.")
            return

        self.exit_stack = AsyncExitStack()
        tools = []

        try:
            for server_name, server_info in mcp_servers.items():
                print(f"\n🔗 Connecting to MCP Server: {server_name}...")
                server_params = StdioServerParameters(
                    command=server_info["command"],
                    args=server_info["args"]
                )
                try:
                    read, write = await self.exit_stack.enter_async_context(stdio_client(server_params))
                    session = await self.exit_stack.enter_async_context(ClientSession(read, write))
                    await session.initialize()
                    server_tools = await load_mcp_tools(session)
                    for tool in server_tools:
                        print(f"🔧 Loaded tool: {tool.name}")
                        tools.append(tool)
                    print(f"✅ Loaded {len(server_tools)} tools from {server_name}")
                    if not self.client:
                        self.client = session
                    self.sessions[server_name] = session
                except Exception as e:
                    print(f"❌ Failed to connect to server '{server_name}': {e}")

            if not tools:
                print("❌ No tools loaded from any server.")
                return

            self.available_tools = tools

        except Exception as e:
            print(f"❌ Exception during MCP connection: {e}")
            return

        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620",
            temperature=0,
            anthropic_api_key=self.anthropic_api_key
        )

        self.agent = create_react_agent(llm, self.available_tools)
        return self.agent

    async def disconnect(self):
        if self.exit_stack:
            await self.exit_stack.aclose()
            self.exit_stack = None
            self.client = None
            self.available_tools = []
            self.sessions = {}
            self.agent = None
            return "✅ Disconnected"
        return "ℹ️ Not connected"

    async def process_query(self, query_data):
        if not self.agent:
            await self.connect()
        if not self.agent:
            return "❌ Agent not initialized"

        # Format the query with context
        if isinstance(query_data, dict):
            query_text = query_data.get('query', str(query_data))
            user_id = query_data.get('user_id', 'unknown')
            context = f"User ID: {user_id}\nQuery: {query_text}"
            if 'table_id' in query_data:
                context += f"\nTable ID: {query_data['table_id']}"
            if 'context_type' in query_data:
                context += f"\nContext: {query_data['context_type']}"
        else:
            context = f"Query: {query_data}"

        full_prompt = f"""{PROMPT_TEMPLATE}

USER CONTEXT:
{context}

Process this request and use the appropriate tools to help the user.
"""

        try:
            response = await self.agent.ainvoke({"messages": full_prompt}, {"recursion_limit": 100})

            if isinstance(response, dict) and "messages" in response:
                # Extract the last AI message
                messages = response["messages"]
                for message in reversed(messages):
                    if hasattr(message, 'content'):
                        return message.content
                return str(response)
            elif hasattr(response, 'content'):
                return response.content
            else:
                return str(response)

        except Exception as e:
            error_msg = f"❌ Error processing query: {str(e)}"
            print(error_msg)
            return error_msg

    async def run_interactive_loop(self):
        if not self.agent:
            await self.connect()
        print("\n🚀 Finance MCP Client Ready! Type 'quit' to exit.")
        while True:
            query = input("\nQuery: ").strip()
            if query.lower() in {"quit", "exit"}:
                break
            print("\n⚙️ Processing...")
            # Simulate query with user_id for testing
            query_data = {"query": query, "user_id": 1}
            response = await self.process_query(query_data)
            print("\n📤 Response:")
            print(response)
