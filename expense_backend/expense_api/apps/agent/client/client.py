import os
import sys
import json
from contextlib import AsyncExitStack
from typing import Dict, Any, List, Optional

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
10. `delete_table(user_id: int, table_id: int)` - Delete entire table

Instructions:
- Parse natural language queries about expenses, budgets, and financial tracking
- Extract relevant information like amounts, categories, dates, descriptions
- Use appropriate tools to perform requested operations
- When adding expenses, create proper row data with appropriate headers
- For Bengali/mixed language queries, understand the intent and extract structured data
- Always include user_id in operations (this will be provided in the query data)
- Pay attention to the detailed step information returned by each tool
- Provide comprehensive feedback including operation steps when available

The tools now return enhanced responses with step-by-step information:
- Each operation includes a "steps" array showing progress
- Steps have status: "in_progress", "completed", "failed", "skipped"
- Failed steps include error details for better debugging
- Successful operations include metadata like counts, IDs, and names

Example Queries:
"ami gotokal sylhet e 100 tk khoroch korechi" 
→ Extract: amount=100, location/category=sylhet, date=yesterday
→ Tool: add_table_row with appropriate table_id and structured data

"Show me my expenses for this month"
→ Tool: get_table_content to retrieve and analyze data

"Create a new budget table for transport expenses"
→ Tool: create_table with appropriate headers like [Date, Amount, Description, Vehicle]

Always provide helpful responses, explain the steps taken, and confirm successful operations.
If any step fails, explain what went wrong and suggest next actions.
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
        self.operation_history = []  # Track operation history

    @staticmethod
    def read_config_json():
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, "mcpConfig.json")
        print(f"[INFO] Loading MCP config from: {config_path}")
        try:
            with open(config_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"❌ Failed to read config file: {e}")
            sys.exit(1)

    def parse_tool_response(self, response_str: str) -> Dict[str, Any]:
        """Parse and enhance tool response with step information."""
        try:
            response_data = json.loads(response_str)
            
            # Store operation in history
            operation_record = {
                "timestamp": self._get_timestamp(),
                "success": response_data.get("success", False),
                "message": response_data.get("message", ""),
                "steps": response_data.get("steps", []),
                "data": response_data.get("data")
            }
            self.operation_history.append(operation_record)
            
            return response_data
        except json.JSONDecodeError:
            return {"success": False, "error": "Invalid JSON response", "steps": []}

    def format_step_summary(self, steps: List[Dict]) -> str:
        """Format step information for user-friendly display."""
        if not steps:
            return ""
        
        summary = "\n📋 **Operation Steps:**\n"
        for step in steps:
            step_num = step.get("step", "?")
            action = step.get("action", "Unknown action")
            status = step.get("status", "unknown")
            
            # Status icons
            status_icon = {
                "completed": "✅",
                "in_progress": "⏳", 
                "failed": "❌",
                "skipped": "⏭️"
            }.get(status, "❓")
            
            summary += f"{status_icon} **Step {step_num}:** {action}"
            
            # Add additional metadata
            if status == "completed":
                if "count" in step:
                    summary += f" (Found: {step['count']})"
                elif "table_id" in step:
                    summary += f" (ID: {step['table_id']})"
                elif "generated_id" in step:
                    summary += f" (Generated ID: {step['generated_id']})"
                elif "user" in step:
                    summary += f" (User: {step['user']})"
                elif "table_name" in step:
                    summary += f" (Table: {step['table_name']})"
                    
            elif status == "failed":
                if "error" in step:
                    summary += f" - **Error:** {step['error']}"
                if "invalid_keys" in step:
                    summary += f" - **Invalid keys:** {step['invalid_keys']}"
                    
            elif status == "skipped":
                if "reason" in step:
                    summary += f" - **Reason:** {step['reason']}"
            
            summary += "\n"
        
        return summary

    def format_enhanced_response(self, response_data: Dict[str, Any], original_query: str) -> str:
        """Format the complete response with steps and data."""
        success = response_data.get("success", False)
        message = response_data.get("message", "")
        steps = response_data.get("steps", [])
        data = response_data.get("data")
        error = response_data.get("error")
        
        formatted_response = ""
        
        # Main result
        if success:
            formatted_response += f"✅ **Success:** {message}\n"
        else:
            formatted_response += f"❌ **Failed:** {error or message}\n"
        
        # Step summary
        if steps:
            formatted_response += self.format_step_summary(steps)
        
        # Data summary
        if data and success:
            formatted_response += "\n📊 **Result Data:**\n"
            if isinstance(data, list) and len(data) > 0:
                formatted_response += f"- Found {len(data)} items\n"
                # Show first few items as preview
                for i, item in enumerate(data[:3]):
                    if isinstance(item, dict):
                        name = item.get("table_name") or item.get("name") or f"Item {i+1}"
                        formatted_response += f"  • {name}\n"
            elif isinstance(data, dict):
                if "table_id" in data:
                    formatted_response += f"- **Table ID:** {data['table_id']}\n"
                if "table_name" in data:
                    formatted_response += f"- **Table Name:** {data['table_name']}\n"
                if "headers" in data:
                    formatted_response += f"- **Headers:** {', '.join(data['headers'])}\n"
        
        # Suggestions for failed operations
        if not success and steps:
            failed_step = next((s for s in steps if s.get("status") == "failed"), None)
            if failed_step:
                formatted_response += "\n💡 **Suggestions:**\n"
                step_action = failed_step.get("action", "")
                
                if "user" in step_action.lower():
                    formatted_response += "- Check if the user ID is correct\n"
                elif "table" in step_action.lower():
                    formatted_response += "- Verify the table exists and you have access\n"
                elif "json" in step_action.lower():
                    formatted_response += "- Check the JSON format of your data\n"
                elif "validating" in step_action.lower():
                    formatted_response += "- Review the input parameters and try again\n"
        
        return formatted_response

    @staticmethod
    def _get_timestamp():
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()

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
            query_text = str(query_data)

        full_prompt = f"""{PROMPT_TEMPLATE}

USER CONTEXT:
{context}

Process this request and use the appropriate tools to help the user.
When you receive tool responses, look for the 'steps' array and provide detailed feedback about the operation progress.
"""

        try:
            response = await self.agent.ainvoke({"messages": full_prompt}, {"recursion_limit": 100})

            # Extract response content
            final_response = ""
            if isinstance(response, dict) and "messages" in response:
                messages = response["messages"]
                for message in reversed(messages):
                    if hasattr(message, 'content'):
                        final_response = message.content
                        break
                if not final_response:
                    final_response = str(response)
            elif hasattr(response, 'content'):
                final_response = response.content
            else:
                final_response = str(response)

            # Try to enhance the response if it contains tool results
            try:
                if "{" in final_response and "}" in final_response:
                    # Look for JSON-like structures that might be tool responses
                    import re
                    json_matches = re.findall(r'\{[^{}]*"success"[^{}]*\}', final_response)
                    for json_match in json_matches:
                        try:
                            tool_response = json.loads(json_match)
                            enhanced = self.format_enhanced_response(tool_response, query_text)
                            final_response = final_response.replace(json_match, enhanced)
                        except:
                            continue
            except:
                pass  # If enhancement fails, return original response

            return final_response

        except Exception as e:
            error_msg = f"❌ Error processing query: {str(e)}"
            print(error_msg)
            return error_msg

    def get_operation_history(self, limit: int = 10) -> List[Dict]:
        """Get recent operation history."""
        return self.operation_history[-limit:] if self.operation_history else []

    def get_operation_stats(self) -> Dict[str, Any]:
        """Get statistics about operations."""
        if not self.operation_history:
            return {"total": 0, "success_rate": 0}
        
        total = len(self.operation_history)
        successful = sum(1 for op in self.operation_history if op.get("success", False))
        
        return {
            "total": total,
            "successful": successful,
            "failed": total - successful,
            "success_rate": (successful / total) * 100 if total > 0 else 0
        }

    async def run_interactive_loop(self):
        if not self.agent:
            await self.connect()
        print("\n🚀 Enhanced Finance MCP Client Ready! Type 'quit' to exit.")
        print("💡 New features: Detailed step tracking, operation history, enhanced error reporting")
        
        while True:
            query = input("\nQuery: ").strip()
            if query.lower() in {"quit", "exit"}:
                break
            elif query.lower() == "history":
                history = self.get_operation_history()
                print(f"\n📜 Recent Operations ({len(history)}):")
                for i, op in enumerate(history, 1):
                    status = "✅" if op["success"] else "❌"
                    print(f"{i}. {status} {op['message']} ({op['timestamp']})")
                continue
            elif query.lower() == "stats":
                stats = self.get_operation_stats()
                print(f"\n📊 Operation Statistics:")
                print(f"Total operations: {stats['total']}")
                print(f"Success rate: {stats['success_rate']:.1f}%")
                continue
                
            print("\n⚙️ Processing...")
            # Simulate query with user_id for testing
            query_data = {"query": query, "user_id": 1}
            response = await self.process_query(query_data)
            print("\n📤 Response:")
            print(response)