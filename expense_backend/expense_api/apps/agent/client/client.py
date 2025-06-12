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
You are an advanced intelligent data management and tracking assistant with sophisticated analysis capabilities.

Your job is to understand natural language queries and intelligently manage any type of data through smart analysis and organization.

You have access to the following tools for managing data:

1. `get_user_tables(user_id: int)` - Get all tables belonging to a user
2. `create_table(user_id: int, table_name: str, description: str, headers: list)` - Create new data tracking table
3. `add_table_row(table_id: int, row_data: dict)` - Add data entry to a table
4. `update_table_row(table_id: int, row_id: str, new_data: dict)` - Update existing data entry
5. `delete_table_row(table_id: int, row_id: str)` - Delete a data entry
6. `get_table_content(user_id: int, table_id?: int)` - Get table data for analysis
7. `add_table_column(table_id: int, header: str)` - Add new column to table
8. `delete_table_columns(table_id: int, new_headers: list)` - Remove columns from table
9. `update_table_metadata(user_id: int, table_id: int, ...)` - Update table name/description
10. `delete_table(user_id: int, table_id: int)` - Delete entire table

## ADVANCED INTELLIGENCE INSTRUCTIONS:

### 🧠 DATA ANALYSIS & PATTERN RECOGNITION:
- Analyze user's data patterns and tracking behaviors
- Identify categories, frequency, trends, and seasonal patterns
- Detect anomalies and suggest optimizations
- Recognize recurring entries and suggest automation
- Provide insights on data organization and tracking habits

### 🎯 INTELLIGENT TABLE MATCHING:
- **Step 1**: Always get user's existing tables first with `get_user_tables(user_id)`
- **Step 2**: Analyze table names, descriptions, and purposes to find best matches
- **Step 3**: Use semantic similarity to match query intent with table purpose
- **Step 4**: Consider table usage patterns and relevance scores

**Table Matching Logic:**
- Match data type (books, inventory, expenses, habits, projects, collections, etc.)
- Match tracking period (daily, weekly, monthly, yearly, event-based)
- Match context/location (home, work, library, specific places)
- Match measurement units (count, amount, rating, status, etc.)
- Consider table creation date and usage frequency

### 📊 SMART CONTENT ANALYSIS:
- Get table content with `get_table_content()` to understand data structure
- Analyze existing column headers and data patterns
- Suggest new columns if current structure is insufficient
- Recommend data standardization and organization improvements
- Identify missing or inconsistent data entries

### 🔄 ADAPTIVE DECISION MAKING:
1. **For Data Recording:**
   - Find most relevant existing table based on type/category/context
   - If no perfect match, find closest table and adapt structure
   - Only create new table if no reasonable existing option
   - Suggest merging similar tables if too many exist

2. **For Data Retrieval:**
   - Analyze which tables contain relevant information
   - Combine data from multiple tables if needed
   - Provide comprehensive analysis with trends and insights
   - Generate smart filters based on query intent

3. **For Data Organization:**
   - Analyze data patterns to suggest better organization
   - Compare current data with historical patterns
   - Identify areas for improvement
   - Predict future data needs based on trends

### 🌐 MULTI-LANGUAGE & CONTEXT INTELLIGENCE:
- Parse Bengali, English, and mixed language queries intelligently
- Extract context-specific information (dates: ajk=today, gotokal=yesterday)
- Understand different tracking terminologies and local contexts
- Handle various measurement units and counting systems

### 📈 ENHANCED QUERY PROCESSING:

**Example Smart Processing:**

"ami ajk 5 ta boi porechi" (I read 5 books today)
→ **Analysis:** Bengali data entry, count=5, item=books, date=today
→ **Table Search:** Look for tables with keywords: "book", "reading", "library", "daily"
→ **Best Match Logic:** 
   - Priority 1: "Book Reading Log" or "Reading Tracker"
   - Priority 2: "Daily Activities" with book column
   - Priority 3: General activity/habit tracker
→ **Action:** Add to best matching table with proper categorization

"ami inventory te 50 ta pen ache" (I have 50 pens in inventory)
→ **Analysis:** Inventory tracking, count=50, item=pens, type=stock
→ **Table Search:** Find tables with "inventory", "stock", "supplies"
→ **Smart Analysis:** Track inventory levels, suggest reorder points
→ **Action:** Update or add inventory record with quantity tracking

"show me my book reading progress this month"
→ **Analysis:** Data retrieval request, category=books, period=current month
→ **Table Search:** Find tables containing book/reading data
→ **Smart Analysis:** Calculate total books, reading rate, compare with goals
→ **Insights:** Provide reading statistics, suggest reading goals

"create table for tracking gym workouts"
→ **Analysis:** New table creation, category=fitness, type=workout tracking
→ **Smart Suggestions:** Recommend columns based on workout tracking best practices
→ **Table Design:** [Date, Exercise, Sets, Reps, Weight, Duration, Notes]

### 🎯 RESPONSE INTELLIGENCE:
- Always explain WHY a particular table was selected
- Provide confidence scores for matches (High/Medium/Low)
- Suggest improvements to data structure when relevant
- Give proactive data organization insights and recommendations
- Warn about potential issues (duplicate entries, inconsistent data, etc.)

### 📋 STEP-BY-STEP PROCESSING:
1. **Parse & Understand:** Extract intent, entities, and context from any domain
2. **Analyze Existing Data:** Get tables and analyze data patterns
3. **Find Best Match:** Use intelligent matching algorithms for any data type
4. **Execute Action:** Perform requested operation with domain-specific best practices
5. **Provide Insights:** Give meaningful feedback and data organization suggestions
6. **Learn & Adapt:** Remember user preferences and tracking patterns

### 🏷️ SUPPORTED DATA TYPES & USE CASES:
- **Personal Tracking:** Books read, movies watched, habits, goals, mood
- **Inventory Management:** Stock counts, supplies, collections, assets
- **Financial Records:** Expenses, income, budgets, savings, investments
- **Project Management:** Tasks, milestones, time tracking, progress
- **Health & Fitness:** Workouts, meals, weight, sleep, medications
- **Academic:** Study hours, grades, assignments, course progress
- **Professional:** Work hours, meetings, deadlines, performance metrics
- **Household:** Chores, maintenance, bills, family activities
- **Collections:** Books, movies, games, stamps, coins, anything collectible
- **Social:** Events, contacts, relationships, social activities

Always provide comprehensive feedback including:
- Why specific tables were chosen for the data type
- Data organization and tracking insights
- Suggestions for better data management
- Confidence levels in recommendations
- Next best actions for improved tracking

Remember: You are a universal data management assistant - help users track, organize, and analyze ANY type of information efficiently!
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
                config = json.load(f)
            
            # Dynamically resolve server script path
            server_script_path = os.path.join(script_dir, "..", "servers", "finance_mcp_server.py")
            server_script_path = os.path.abspath(server_script_path)
            
            # Check if server script exists
            if not os.path.exists(server_script_path):
                raise FileNotFoundError(f"MCP server script not found at: {server_script_path}")
            
            # Replace placeholder with actual path
            for server_name, server_config in config.get("mcpServers", {}).items():
                if "args" in server_config:
                    server_config["args"] = [
                        arg.replace("{SERVER_SCRIPT_PATH}", server_script_path) 
                        for arg in server_config["args"]
                    ]
                    print(f"[INFO] Resolved server path for {server_name}: {server_script_path}")
            
            return config
        except Exception as e:
            print(f"❌ Failed to read config file: {e}")
            print(f"❌ Config path attempted: {config_path}")
            print(f"❌ Script directory: {script_dir}")
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
        """Format the complete response with intelligent analysis and insights."""
        success = response_data.get("success", False)
        message = response_data.get("message", "")
        steps = response_data.get("steps", [])
        data = response_data.get("data")
        error = response_data.get("error")
        
        formatted_response = ""
        
        # Main result with intelligence indicator
        if success:
            formatted_response += f"🎯 **Intelligent Analysis Complete:** {message}\n"
        else:
            formatted_response += f"❌ **Analysis Failed:** {error or message}\n"
        
        # Step summary with smart insights
        if steps:
            formatted_response += self.format_step_summary_enhanced(steps, original_query)
        
        # Intelligent data analysis
        if data and success:
            formatted_response += "\n🧠 **AI Analysis Results:**\n"
            confidence_score = self._calculate_confidence_score(response_data, original_query)
            formatted_response += f"- **Confidence Level:** {confidence_score}\n"
            
            if isinstance(data, list) and len(data) > 0:
                formatted_response += f"- **Tables Analyzed:** {len(data)} tables\n"
                
                # Analyze table relevance
                best_match = self._find_best_table_match(data, original_query)
                if best_match:
                    formatted_response += f"- **Best Match:** {best_match['name']} (Relevance: {best_match['score']}%)\n"
                
                # Show table analysis
                for i, item in enumerate(data[:3]):
                    if isinstance(item, dict):
                        table_name = item.get("table_name") or item.get("name") or f"Table {i+1}"
                        relevance = self._calculate_table_relevance(item, original_query)
                        formatted_response += f"  • {table_name} - Relevance: {relevance}%\n"
                        
            elif isinstance(data, dict):
                if "table_id" in data:
                    formatted_response += f"- **Target Table ID:** {data['table_id']}\n"
                if "table_name" in data:
                    formatted_response += f"- **Table Selected:** {data['table_name']}\n"
                if "headers" in data:
                    formatted_response += f"- **Data Structure:** {', '.join(data['headers'])}\n"
        
        # Smart recommendations
        recommendations = self._generate_smart_recommendations(response_data, original_query)
        if recommendations:
            formatted_response += "\n💡 **Smart Recommendations:**\n"
            for rec in recommendations:
                formatted_response += f"- {rec}\n"
        
        # Financial insights
        insights = self._generate_financial_insights(response_data, original_query)
        if insights:
            formatted_response += "\n📊 **Financial Insights:**\n"
            for insight in insights:
                formatted_response += f"- {insight}\n"
        
        return formatted_response

    def format_step_summary_enhanced(self, steps: List[Dict], query: str) -> str:
        """Enhanced step summary with intelligence indicators."""
        if not steps:
            return ""
        
        summary = "\n📋 **Intelligent Processing Steps:**\n"
        for step in steps:
            step_num = step.get("step", "?")
            action = step.get("action", "Unknown action")
            status = step.get("status", "unknown")
            
            # Enhanced status icons with intelligence
            status_icon = {
                "completed": "🎯",  # Smart completion
                "in_progress": "🧠",  # AI thinking
                "failed": "⚠️",
                "skipped": "⏭️"
            }.get(status, "❓")
            
            summary += f"{status_icon} **Step {step_num}:** {action}"
            
            # Add intelligence metadata
            if status == "completed":
                if "analysis_score" in step:
                    summary += f" (Analysis Score: {step['analysis_score']}%)"
                elif "confidence" in step:
                    summary += f" (Confidence: {step['confidence']}%)"
                elif "count" in step:
                    summary += f" (Found: {step['count']} items)"
                elif "table_id" in step:
                    summary += f" (Selected: Table #{step['table_id']})"
                elif "match_score" in step:
                    summary += f" (Match: {step['match_score']}%)"
                    
            elif status == "failed":
                if "error" in step:
                    summary += f" - **Issue:** {step['error']}"
                if "suggestion" in step:
                    summary += f" - **Suggestion:** {step['suggestion']}"
                    
            summary += "\n"
        
        return summary

    def _calculate_confidence_score(self, response_data: Dict, query: str) -> str:
        """Calculate AI confidence score based on response quality."""
        score = 85  # Base confidence
        
        # Adjust based on data quality
        if response_data.get("success", False):
            score += 10
        else:
            score -= 20
            
        # Adjust based on step completion
        steps = response_data.get("steps", [])
        if steps:
            completed_steps = sum(1 for step in steps if step.get("status") == "completed")
            total_steps = len(steps)
            if total_steps > 0:
                completion_rate = (completed_steps / total_steps) * 100
                score = (score + completion_rate) / 2
        
        # Classify confidence
        if score >= 90:
            return "Very High (90%+)"
        elif score >= 75:
            return "High (75-89%)"
        elif score >= 60:
            return "Medium (60-74%)"
        else:
            return "Low (<60%)"

    def _find_best_table_match(self, tables: List[Dict], query: str) -> Dict:
        """Find the best matching table based on semantic analysis."""
        if not tables:
            return None
            
        best_match = None
        highest_score = 0
        
        # Keywords for different categories
        query_lower = query.lower()
        expense_keywords = ['khoroch', 'expense', 'cost', 'spent', 'buy', 'purchase']
        location_keywords = ['sylhet', 'dhaka', 'chittagong', 'travel']
        time_keywords = ['daily', 'monthly', 'yearly', 'ajk', 'today']
        
        for table in tables:
            if not isinstance(table, dict):
                continue
                
            table_name = table.get("table_name", "").lower()
            description = table.get("description", "").lower()
            
            score = 0
            
            # Check for expense-related matches
            if any(keyword in query_lower for keyword in expense_keywords):
                if any(keyword in table_name for keyword in expense_keywords):
                    score += 40
                if 'expense' in table_name or 'cost' in table_name:
                    score += 30
                    
            # Check for location matches
            for location in location_keywords:
                if location in query_lower and location in table_name:
                    score += 35
                    
            # Check for time period matches
            for time_word in time_keywords:
                if time_word in query_lower and time_word in table_name:
                    score += 25
                    
            # General name similarity
            if 'daily' in table_name and ('ajk' in query_lower or 'today' in query_lower):
                score += 20
                
            if score > highest_score:
                highest_score = score
                best_match = {
                    "name": table.get("table_name", "Unknown"),
                    "score": min(score, 95),  # Cap at 95%
                    "id": table.get("id")
                }
        
        return best_match

    def _calculate_table_relevance(self, table: Dict, query: str) -> int:
        """Calculate relevance percentage for a specific table."""
        if not isinstance(table, dict):
            return 0
            
        table_name = table.get("table_name", "").lower()
        query_lower = query.lower()
        
        relevance = 20  # Base relevance
        
        # Keyword matching
        expense_words = ['expense', 'khoroch', 'cost']
        location_words = ['sylhet', 'dhaka', 'travel']
        
        for word in expense_words:
            if word in query_lower and word in table_name:
                relevance += 25
                
        for word in location_words:
            if word in query_lower and word in table_name:
                relevance += 30
                
        # Time relevance
        if ('ajk' in query_lower or 'today' in query_lower) and 'daily' in table_name:
            relevance += 20
            
        return min(relevance, 95)

    def _generate_smart_recommendations(self, response_data: Dict, query: str) -> List[str]:
        """Generate intelligent recommendations based on the operation."""
        recommendations = []
        
        if response_data.get("success", False):
            # Success recommendations
            if 'expense' in query.lower() or 'khoroch' in query.lower():
                recommendations.append("Set up budget alerts for this category")
                recommendations.append("Track similar expenses to identify patterns")
                recommendations.append("Consider using expense categories for better analysis")
            
            if 'sylhet' in query.lower() or 'travel' in query.lower():
                recommendations.append("Create a dedicated travel budget tracker")
                recommendations.append("Compare travel costs across different destinations")
                
        else:
            # Failure recommendations
            recommendations.append("Try rephrasing your query with more specific details")
            recommendations.append("Check if the table structure matches your data")
            recommendations.append("Consider creating a new table for this expense type")
            
        return recommendations[:3]  # Limit to top 3

    def _generate_financial_insights(self, response_data: Dict, query: str) -> List[str]:
        """Generate financial insights based on the operation."""
        insights = []
        
        # Amount-based insights
        if '100' in query and 'tk' in query:
            insights.append("Small expense recorded - good for daily tracking")
            insights.append("Consider setting daily spending limits")
            
        # Location-based insights
        if 'sylhet' in query.lower():
            insights.append("Travel expenses detected - track accommodation and food separately")
            
        # Pattern insights
        if response_data.get("success", False):
            insights.append("Regular expense tracking builds better financial habits")
            
        return insights[:2]  # Limit to top 2

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
        """Properly disconnect all MCP sessions and cleanup resources."""
        if self.exit_stack:
            try:
                # Close all sessions first
                for session_name, session in self.sessions.items():
                    try:
                        debug_print(f"Closing session: {session_name}")
                        # Don't await session close as it might be already closed
                    except Exception as e:
                        debug_print(f"Warning: Error closing session {session_name}: {e}")
                
                # Clear sessions before closing exit stack
                self.sessions.clear()
                
                # Use aclose instead of manual __aexit__
                await self.exit_stack.aclose()
                debug_print("✅ Exit stack closed successfully")
                
            except Exception as e:
                debug_print(f"Warning: Error during disconnect: {e}")
                # Continue with cleanup even if there are errors
            finally:
                # Reset all state regardless of errors
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
            return {
                "success": False,
                "error": "Agent not initialized",
                "message": "❌ Agent not initialized"
            }

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
            raw_response = None
            
            if isinstance(response, dict) and "messages" in response:
                messages = response["messages"]
                raw_response = response
                for message in reversed(messages):
                    if hasattr(message, 'content'):
                        final_response = message.content
                        break
                if not final_response:
                    final_response = str(response)
            elif hasattr(response, 'content'):
                final_response = response.content
                raw_response = response
            else:
                final_response = str(response)
                raw_response = response

            # Try to extract structured tool responses
            structured_data = self._extract_structured_response(final_response, query_text)
            
            # Return enhanced response structure
            return {
                "success": True,
                "message": "Query processed successfully",
                "query": query_text,
                "response": final_response,
                "formatted_response": final_response,
                "raw_response": raw_response,
                "operation_stats": self.get_operation_stats(),
                **structured_data  # Merge any extracted structured data
            }

        except Exception as e:
            error_msg = f"❌ Error processing query: {str(e)}"
            print(error_msg)
            
            # Record failed operation
            self.operation_history.append({
                "timestamp": self._get_timestamp(),
                "success": False,
                "message": error_msg,
                "query": query_text,
                "error": str(e),
                "steps": [{
                    "step": 1,
                    "action": "Processing query",
                    "status": "failed",
                    "error": str(e)
                }]
            })
            
            return {
                "success": False,
                "error": str(e),
                "message": error_msg,
                "query": query_text,
                "steps": [{
                    "step": 1,
                    "action": "Processing query", 
                    "status": "failed",
                    "error": str(e)
                }],
                "operation_stats": self.get_operation_stats()
            }

    def _extract_structured_response(self, response_text: str, query: str) -> Dict[str, Any]:
        """Extract structured data from response text."""
        structured_data = {}
        
        try:
            # Look for JSON-like structures in the response
            import re
            json_matches = re.findall(r'\{[^{}]*"success"[^{}]*\}', response_text)
            
            for json_match in json_matches:
                try:
                    tool_response = json.loads(json_match)
                    if "steps" in tool_response:
                        structured_data["steps"] = tool_response["steps"]
                    if "data" in tool_response:
                        structured_data["data"] = tool_response["data"]
                    if "success" in tool_response:
                        structured_data["tool_success"] = tool_response["success"]
                    break  # Use first valid JSON found
                except json.JSONDecodeError:
                    continue
            
            # Check for operation indicators in text
            if "✅" in response_text:
                structured_data["contains_success"] = True
            if "❌" in response_text:
                structured_data["contains_error"] = True
            if "📋" in response_text:
                structured_data["contains_steps"] = True
            if "📊" in response_text:
                structured_data["contains_data"] = True
                
        except Exception as e:
            # If extraction fails, just return empty dict
            pass
            
        return structured_data

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

    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()
        return False

    @staticmethod
    async def create_and_run_query(query_data, anthropic_api_key=None):
        """Static method to create client, run query, and cleanup in one go."""
        async with ExpenseMCPClient(anthropic_api_key) as client:
            if not client.agent:
                return {
                    "success": False,
                    "error": "Failed to initialize MCP client",
                    "message": "Could not connect to the finance management tools"
                }
            return await client.process_query(query_data)