#!/usr/bin/env python3
"""
Example of the new streaming and thinking format responses for the Finance AI Agent.
"""

# Example 1: Standard Response (existing format)
standard_response = {
    "query": "ami ajk sylhet e 100 tk khoroch korechi",
    "response": "Excellent! Your expense has been successfully added...",
    "response_type": "enhanced_operation",
    "enhanced_data": {
        "success": True,
        "message": "Query processed successfully"
    }
}

# Example 2: Streaming Format Response
streaming_response = {
    "query": "ami ajk sylhet e 100 tk khoroch korechi",
    "format": "streaming",
    "streaming_data": {
        "total_steps": 5,
        "processing_time": "~2-3 seconds",
        "steps": [
            {
                "step": 1,
                "type": "user_input",
                "title": "🤔 Understanding your request...",
                "content": "I received your query: 'ami ajk sylhet e 100 tk khoroch korechi'",
                "details": "Let me break this down and understand what you need."
            },
            {
                "step": 2,
                "type": "ai_thinking",
                "title": "🧠 Analyzing and planning...",
                "content": "I understand you want to record an expense of 100 tk in Sylhet today. Let me check your existing tables first.",
                "details": "I'm processing your request and determining the best approach."
            },
            {
                "step": 3,
                "type": "tool_execution",
                "title": "🔧 Using get_user_tables...",
                "content": "Executing: get_user_tables with parameters: {'user_id': 1}",
                "details": "Performing the requested operation on your financial data."
            },
            {
                "step": 4,
                "type": "tool_execution", 
                "title": "🔧 Using add_table_row...",
                "content": "Executing: add_table_row with parameters: {'table_id': 8, 'row_data': {...}}",
                "details": "Adding your expense to the Daily Expenses table."
            },
            {
                "step": 5,
                "type": "final_response",
                "title": "🎯 Generating final response...",
                "content": "Excellent! Your expense has been successfully added to the 'Daily Expenses' table...",
                "details": "Presenting the results of your request."
            }
        ],
        "tools_used": [
            {
                "step": 3,
                "type": "tool_execution",
                "title": "🔧 Using get_user_tables..."
            },
            {
                "step": 4,
                "type": "tool_execution",
                "title": "🔧 Using add_table_row..."
            }
        ]
    },
    "live_steps": [
        {"timestamp": "00:00", "action": "🤔 Analyzing query...", "status": "completed"},
        {"timestamp": "00:01", "action": "🧠 Understanding intent...", "status": "completed"},
        {"timestamp": "00:02", "action": "🔍 Checking user tables...", "status": "completed"},
        {"timestamp": "00:03", "action": "📝 Adding expense entry...", "status": "completed"},
        {"timestamp": "00:04", "action": "✅ Generating response...", "status": "completed"}
    ],
    "final_response": "Excellent! Your expense has been successfully added..."
}

# Example 3: Thinking Format Response
thinking_response = {
    "query": "ami ajk sylhet e 100 tk khoroch korechi",
    "format": "thinking",
    "thinking_process": {
        "initial_analysis": {
            "user_query": "ami ajk sylhet e 100 tk khoroch korechi",
            "language_detected": "Bengali/English mix",
            "intent_recognized": "Expense recording",
            "key_extracted_info": {
                "amount": "100 tk",
                "location": "Sylhet",
                "date": "Today (ajk)",
                "action": "Record expense"
            }
        },
        "decision_making": {
            "strategy": "Find existing expense table or create new one",
            "tools_selected": ["get_user_tables", "add_table_row"],
            "reasoning": "First check available tables, then add expense to appropriate table"
        },
        "execution_summary": {
            "success": True,
            "steps_completed": [
                "Retrieved user tables",
                "Identified 'Daily Expenses' table",
                "Added new expense entry",
                "Generated unique ID for entry"
            ],
            "result": "Expense successfully recorded with ID: 7266c4a2"
        },
        "user_communication": {
            "tone": "Helpful and confirmatory",
            "format": "Step-by-step explanation",
            "additional_info": "Offered further assistance"
        }
    },
    "response_summary": {
        "overall_assessment": "Successfully processed expense recording request",
        "confidence_level": "High",
        "processing_approach": "Table-based expense tracking",
        "user_experience": "Smooth and efficient",
        "next_suggestions": [
            "View your expense summary",
            "Set budget limits", 
            "Generate expense reports"
        ]
    },
    "final_response": "Excellent! Your expense has been successfully added..."
}

# Example API Calls:

# 1. Request standard format (default)
"""
POST /agent/query/
{
    "query": "ami ajk sylhet e 100 tk khoroch korechi"
}
"""

# 2. Request streaming format
"""
POST /agent/query/
{
    "query": "ami ajk sylhet e 100 tk khoroch korechi",
    "format": "streaming"
}
"""

# 3. Request thinking format
"""
POST /agent/query/
{
    "query": "ami ajk sylhet e 100 tk khoroch korechi", 
    "format": "thinking"
}
"""

# 4. Use dedicated streaming endpoint
"""
POST /agent/streaming/
{
    "query": "ami ajk sylhet e 100 tk khoroch korechi",
    "format": "streaming"  # or "thinking"
}
"""

print("✅ Streaming and Thinking format examples created!")
print("\nKey Features:")
print("- 🎭 Multiple response formats: standard, streaming, thinking")  
print("- 🔄 Real-time step-by-step processing visualization")
print("- 🧠 AI thinking process breakdown")
print("- ⚡ Live action timestamps")
print("- 🛠️ Tool usage tracking") 
print("- 📊 Enhanced user experience") 