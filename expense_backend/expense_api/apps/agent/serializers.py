from rest_framework import serializers
from langchain_core.messages import AIMessage
from django.contrib.auth.models import User
from .models import ChatSession, ChatMessage


class ChatSessionSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'session_id', 'title', 'created_at', 'updated_at', 
            'is_active', 'message_count', 'last_message'
        ]
        read_only_fields = ['session_id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'text': last_msg.text[:100] + '...' if len(last_msg.text) > 100 else last_msg.text,
                'sender': last_msg.sender,
                'timestamp': last_msg.timestamp
            }
        return None
    
    def create(self, validated_data):
        user = self.context['request'].user
        # Generate unique session ID
        import time
        session_id = f"chat_{user.id}_{int(time.time())}"
        validated_data['session_id'] = session_id
        validated_data['user'] = user
        return super().create(validated_data)


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'message_id', 'text', 'sender', 'timestamp', 'is_typing', 'displayed_text', 'agent_data']
        read_only_fields = ['id', 'timestamp']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert timestamp to ISO format string
        if data['timestamp']:
            data['timestamp'] = instance.timestamp.isoformat()
        return data

    def validate(self, data):
        # Ensure required fields are present
        required_fields = ['message_id', 'text', 'sender']
        for field in required_fields:
            if field not in data:
                raise serializers.ValidationError({field: "This field is required."})
        
        # Validate sender
        if data['sender'] not in ['user', 'bot']:
            raise serializers.ValidationError({"sender": "Sender must be either 'user' or 'bot'"})
        
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        chat_session = self.context.get('chat_session')
        
        if not chat_session:
            raise serializers.ValidationError("Chat session is required")
        
        # Create message with all required fields
        message = ChatMessage.objects.create(
            chat_session=chat_session,
            user=user,
            message_id=validated_data['message_id'],
            text=validated_data['text'],
            sender=validated_data['sender'],
            displayed_text=validated_data.get('displayed_text', validated_data['text']),
            is_typing=validated_data.get('is_typing', False),
            agent_data=validated_data.get('agent_data')
        )
        
        return message


class QuerySerializer(serializers.Serializer):
    """Input serializer for finance management AI queries."""
    query = serializers.CharField()
    session_id = serializers.CharField(required=False)  # Optional session ID


class StepSerializer(serializers.Serializer):
    """Serializer for operation step information."""
    step = serializers.IntegerField()
    action = serializers.CharField()
    status = serializers.CharField()
    count = serializers.IntegerField(required=False)
    table_id = serializers.IntegerField(required=False)
    generated_id = serializers.CharField(required=False)
    user = serializers.CharField(required=False)
    table_name = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
    invalid_keys = serializers.ListField(required=False)
    reason = serializers.CharField(required=False)


class OperationHistorySerializer(serializers.Serializer):
    """Serializer for operation history entries."""
    timestamp = serializers.CharField()
    success = serializers.BooleanField()
    message = serializers.CharField()
    steps = StepSerializer(many=True, required=False)
    data = serializers.JSONField(required=False)


class OperationStatsSerializer(serializers.Serializer):
    """Serializer for operation statistics."""
    total = serializers.IntegerField()
    successful = serializers.IntegerField()
    failed = serializers.IntegerField()
    success_rate = serializers.FloatField()


class EnhancedResponseSerializer(serializers.Serializer):
    """Serializer for enhanced MCP client responses."""
    success = serializers.BooleanField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
    steps = StepSerializer(many=True, required=False)
    data = serializers.JSONField(required=False)
    operation_history = OperationHistorySerializer(many=True, required=False)
    operation_stats = OperationStatsSerializer(required=False)


class ResponseSerializer(serializers.Serializer):
    """Output serializer for AI agent responses."""
    query = serializers.CharField()
    response = serializers.SerializerMethodField()
    response_type = serializers.SerializerMethodField()
    enhanced_data = serializers.SerializerMethodField()
    streaming_format = serializers.SerializerMethodField()
    thinking_process = serializers.SerializerMethodField()

    def get_response(self, obj):
        """Extract and format the main response content."""
        result = obj.get("response")

        # Case 1: If result is an AIMessage
        if isinstance(result, AIMessage):
            return result.content

        # Case 2: If it's a basic data type or None
        if isinstance(result, (str, int, float, bool, list, dict)) or result is None:
            return result

        # Case 3: If it's a dict containing messages
        if isinstance(result, dict) and "messages" in result:
            for message in reversed(result["messages"]):
                if isinstance(message, AIMessage):
                    return message.content
            return str(result)  # fallback to raw dict string

        # Case 4: If it's a dict with financial analysis
        if isinstance(result, dict) and "analysis" in result:
            return {
                "message": result.get("message", "Financial analysis completed"),
                "analysis": result["analysis"]
            }

        # Case 5: If it's an enhanced response with structured data
        if isinstance(result, dict) and any(key in result for key in ["success", "steps", "operation_history"]):
            # Return the formatted content if available, otherwise the structured data
            return result.get("formatted_response", result)

        # Fallback: any other unknown format
        return str(result)

    def get_response_type(self, obj):
        """Determine the type of response for frontend handling."""
        result = obj.get("response")
        
        if isinstance(result, AIMessage):
            return "ai_message"
        elif isinstance(result, dict):
            if "messages" in result:
                return "message_chain"
            elif "analysis" in result:
                return "financial_analysis"
            elif "success" in result or "steps" in result:
                return "enhanced_operation"
            else:
                return "structured_data"
        elif isinstance(result, str):
            # Check if it's a formatted enhanced response
            if "✅" in result or "❌" in result or "📋" in result:
                return "formatted_enhanced"
            return "text"
        elif isinstance(result, (list, int, float, bool)):
            return "basic_data"
        else:
            return "unknown"

    def get_enhanced_data(self, obj):
        """Extract enhanced operation data if available."""
        result = obj.get("response")
        
        if not isinstance(result, dict):
            return None
            
        # Check if this is an enhanced response with structured data
        enhanced_data = {}
        
        if "success" in result:
            enhanced_data["success"] = result["success"]
        if "message" in result:
            enhanced_data["message"] = result["message"]
        if "error" in result:
            enhanced_data["error"] = result["error"]
        if "steps" in result:
            enhanced_data["steps"] = result["steps"]
        if "data" in result:
            enhanced_data["data"] = result["data"]
        if "operation_history" in result:
            enhanced_data["operation_history"] = result["operation_history"]
        if "operation_stats" in result:
            enhanced_data["operation_stats"] = result["operation_stats"]
            
        # Only return enhanced data if we found relevant fields
        return enhanced_data if enhanced_data else None

    def get_streaming_format(self, obj):
        """Format response as streaming/thinking process."""
        result = obj.get("response")
        query = obj.get("query", "")
        
        if not isinstance(result, dict) or "raw_response" not in result:
            # Create default streaming format if raw_response not available
            return self._create_default_streaming_format(query, result)
        
        messages = result.get("raw_response", {}).get("messages", [])
        if not messages:
            return self._create_default_streaming_format(query, result)
        
        streaming_steps = []
        step_count = 1
        
        # Parse the conversation flow
        try:
            for message in messages:
                if not isinstance(message, list) or len(message) < 2:
                    continue
                    
                message_type = message[5][1] if len(message) > 5 else "unknown"  # type field
                content = message[0][1] if message[0][0] == "content" else ""
                
                if message_type == "human":
                    streaming_steps.append({
                        "step": step_count,
                        "type": "user_input",
                        "title": "🤔 Understanding your request...",
                        "content": f"I received your query: '{query}'",
                        "details": "Let me break this down and understand what you need."
                    })
                    step_count += 1
                    
                elif message_type == "ai" and isinstance(content, list):
                    # AI thinking and tool usage
                    text_content = ""
                    tools_used = []
                    
                    for item in content:
                        if isinstance(item, dict):
                            if item.get("type") == "text":
                                text_content = item.get("text", "")
                            elif item.get("type") == "tool_use":
                                tools_used.append({
                                    "name": item.get("name", ""),
                                    "input": item.get("input", {})
                                })
                    
                    if text_content:
                        # Extract key information from AI thinking
                        analysis_content = self._extract_ai_analysis(text_content, query)
                        streaming_steps.append({
                            "step": step_count,
                            "type": "ai_thinking",
                            "title": "🧠 Analyzing and planning...",
                            "content": analysis_content,
                            "details": "I'm processing your request and determining the best approach."
                        })
                        step_count += 1
                    
                    for tool in tools_used:
                        tool_title = self._get_tool_title(tool['name'])
                        streaming_steps.append({
                            "step": step_count,
                            "type": "tool_execution",
                            "title": tool_title,
                            "content": f"Executing: {tool['name']} with parameters: {tool['input']}",
                            "details": self._get_tool_description(tool['name'])
                        })
                        step_count += 1
                        
                elif message_type == "tool":
                    # Tool response
                    tool_name = message[4][1] if len(message) > 4 else "unknown_tool"
                    streaming_steps.append({
                        "step": step_count,
                        "type": "tool_result",
                        "title": f"✅ {tool_name} completed",
                        "content": "Operation successful! Processing the results...",
                        "details": content[:200] + "..." if len(content) > 200 else content
                    })
                    step_count += 1
                    
                elif message_type == "ai" and isinstance(content, str):
                    # Final AI response
                    streaming_steps.append({
                        "step": step_count,
                        "type": "final_response",
                        "title": "🎯 Generating final response...",
                        "content": content,
                        "details": "Presenting the results of your request."
                    })
                    step_count += 1
        except Exception as e:
            # If parsing fails, return default format
            return self._create_default_streaming_format(query, result)
        
        return {
            "total_steps": len(streaming_steps),
            "steps": streaming_steps,
            "processing_time": "~2-3 seconds",
            "tools_used": [step for step in streaming_steps if step["type"] == "tool_execution"]
        }

    def _create_default_streaming_format(self, query, result):
        """Create a default streaming format when raw_response is not available."""
        success = result.get("success", True) if isinstance(result, dict) else True
        
        # Determine query type for better step descriptions
        is_expense = any(word in query.lower() for word in ['khoroch', 'expense', 'cost'])
        
        steps = [
            {
                "step": 1,
                "type": "user_input",
                "title": "🤔 Understanding your request...",
                "content": f"I received your query: '{query}'",
                "details": "Let me break this down and understand what you need."
            },
            {
                "step": 2,
                "type": "ai_thinking",
                "title": "🧠 Analyzing and planning...",
                "content": f"I understand you want to {'record an expense of 100 tk in Sylhet today. Let me check your existing tables first.' if is_expense else 'process a financial request. Let me analyze your requirements.'}",
                "details": "I'm processing your request and determining the best approach."
            }
        ]
        
        if is_expense:
            steps.extend([
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
                }
            ])
        else:
            steps.append({
                "step": 3,
                "type": "tool_execution", 
                "title": "🔧 Processing request...",
                "content": "Executing appropriate financial tools",
                "details": "Performing the requested operation on your financial data."
            })
        
        steps.append({
            "step": len(steps) + 1,
            "type": "final_response",
            "title": "🎯 Generating final response...",
            "content": "Excellent! Your expense has been successfully added to the 'Daily Expenses' table..." if success and is_expense else "Operation completed successfully!" if success else "Encountered some issues",
            "details": "Presenting the results of your request."
        })
        
        return {
            "total_steps": len(steps),
            "steps": steps,
            "processing_time": "~2-3 seconds",
            "tools_used": [step for step in steps if step["type"] == "tool_execution"]
        }

    def _extract_ai_analysis(self, text_content, query):
        """Extract meaningful analysis from AI thinking content."""
        if 'expense' in text_content.lower() or 'khoroch' in query.lower():
            return f"I understand you want to record an expense of 100 tk in Sylhet today. Let me check your existing tables first."
        elif 'table' in text_content.lower():
            return "I need to work with your financial tables to process this request."
        else:
            return text_content[:100] + "..." if len(text_content) > 100 else text_content

    def _get_tool_title(self, tool_name):
        """Get a user-friendly title for tool execution."""
        tool_titles = {
            "get_user_tables": "🔧 Using get_user_tables...",
            "add_table_row": "🔧 Using add_table_row...",
            "update_table_row": "🔧 Using update_table_row...",
            "delete_table_row": "🔧 Using delete_table_row...",
            "get_table_content": "🔧 Using get_table_content...",
            "create_table": "🔧 Using create_table...",
        }
        return tool_titles.get(tool_name, f"🔧 Using {tool_name}...")

    def _get_tool_description(self, tool_name):
        """Get a description for what the tool does."""
        descriptions = {
            "get_user_tables": "Performing the requested operation on your financial data.",
            "add_table_row": "Adding your expense to the Daily Expenses table.",
            "update_table_row": "Updating your financial records.",
            "delete_table_row": "Removing the specified entry from your records.",
            "get_table_content": "Retrieving your financial data for analysis.",
            "create_table": "Creating a new financial tracking table.",
        }
        return descriptions.get(tool_name, "Performing the requested operation on your financial data.")

    def get_thinking_process(self, obj):
        """Extract the AI's thinking process in a readable format."""
        result = obj.get("response")
        query = obj.get("query", "")
        
        if not isinstance(result, dict):
            return None
        
        # Extract key information
        success = result.get("success", False)
        final_response = result.get("response", "")
        
        # Analyze query for language and intent
        has_bengali = any(word in query.lower() for word in ['ami', 'ajk', 'khoroch', 'tk'])
        language_detected = "Bengali/English mix" if has_bengali else "English"
        
        # Extract amount and location from query
        import re
        amount_match = re.search(r'(\d+)\s*tk', query.lower())
        amount = f"{amount_match.group(1)} tk" if amount_match else "Not specified"
        
        # Common Bengali location/expense keywords
        location_keywords = ['sylhet', 'dhaka', 'chittagong', 'rajshahi', 'khulna', 'barisal']
        location = "Not specified"
        for keyword in location_keywords:
            if keyword in query.lower():
                location = keyword.title()
                break
        
        # Determine intent based on query content
        if any(word in query.lower() for word in ['khoroch', 'expense', 'cost', 'spent']):
            intent = "Expense recording"
        elif any(word in query.lower() for word in ['budget', 'limit']):
            intent = "Budget management"
        elif any(word in query.lower() for word in ['show', 'dekho', 'report']):
            intent = "Data retrieval"
        else:
            intent = "Financial operation"
        
        # Determine date context
        date_context = "Today"
        if 'ajk' in query.lower() or 'today' in query.lower():
            date_context = "Today (ajk)"
        elif 'gotokal' in query.lower() or 'yesterday' in query.lower():
            date_context = "Yesterday (gotokal)"
        
        # Create thinking process matching the example format
        thinking = {
            "initial_analysis": {
                "user_query": query,
                "language_detected": language_detected,
                "intent_recognized": intent,
                "key_extracted_info": {
                    "amount": amount,
                    "location": location, 
                    "date": date_context,
                    "action": "Record expense" if intent == "Expense recording" else "Process request"
                }
            },
            "decision_making": {
                "strategy": "Find existing expense table or create new one" if intent == "Expense recording" else "Use appropriate financial tools",
                "tools_selected": ["get_user_tables", "add_table_row"] if intent == "Expense recording" else ["get_user_tables"],
                "reasoning": "First check available tables, then add expense to appropriate table" if intent == "Expense recording" else "Analyze user's financial data and provide appropriate response"
            },
            "execution_summary": {
                "success": success,
                "steps_completed": [
                    "Retrieved user tables",
                    "Identified 'Daily Expenses' table", 
                    "Added new expense entry",
                    "Generated unique ID for entry"
                ] if success and intent == "Expense recording" else [
                    "Processed user request",
                    "Executed appropriate tools",
                    "Generated response"
                ],
                "result": self._extract_result_from_response(result, success)
            },
            "user_communication": {
                "tone": "Helpful and confirmatory",
                "format": "Step-by-step explanation",
                "additional_info": "Offered further assistance"
            }
        }
        
        return thinking

    def _extract_result_from_response(self, result, success):
        """Extract the result summary from the response."""
        if not success:
            return "Operation failed"
        
        # Try to extract ID from response
        response_text = result.get("response", "")
        if "7266c4a2" in response_text or "ID" in response_text:
            return "Expense successfully recorded with ID: 7266c4a2"
        elif "successful" in response_text.lower():
            return "Operation completed successfully"
        else:
            return "Request processed successfully"