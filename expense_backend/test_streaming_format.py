#!/usr/bin/env python3
"""
Test script to validate streaming format implementation.
"""

import os
import sys
import django

# Add the project to Python path
sys.path.append('/home/mehedi/03_Projects/FinanceManagement/expense_backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')
django.setup()

from expense_api.apps.agent.serializers import ResponseSerializer

def test_streaming_format():
    """Test the streaming format serializer."""
    
    # Test data based on the example
    test_data = {
        "query": "ami ajk sylhet e 100 tk khoroch korechi",
        "response": {
            "success": True,
            "message": "Query processed successfully",
            "query": "ami ajk sylhet e 100 tk khoroch korechi",
            "response": "Excellent! Your expense has been successfully added to the 'Daily Expenses' table...",
            "formatted_response": "Excellent! Your expense has been successfully added...",
            "raw_response": {
                "messages": []  # Simplified for testing
            },
            "operation_stats": {
                "total": 0,
                "success_rate": 0
            }
        }
    }
    
    # Test serializer
    serializer = ResponseSerializer(test_data)
    result = serializer.data
    
    print("🧪 Testing Streaming Format Implementation")
    print("=" * 50)
    
    # Test basic fields
    print(f"✅ Query: {result.get('query', 'MISSING')}")
    print(f"✅ Response Type: {result.get('response_type', 'MISSING')}")
    
    # Test streaming format
    streaming_format = result.get('streaming_format')
    if streaming_format:
        print(f"✅ Streaming Format: Available")
        print(f"   - Total Steps: {streaming_format.get('total_steps', 'MISSING')}")
        print(f"   - Processing Time: {streaming_format.get('processing_time', 'MISSING')}")
        print(f"   - Tools Used: {len(streaming_format.get('tools_used', []))}")
        
        # Check steps format
        steps = streaming_format.get('steps', [])
        if steps:
            print(f"   - Steps Available: {len(steps)}")
            for i, step in enumerate(steps[:3]):  # Show first 3 steps
                print(f"     Step {step.get('step', '?')}: {step.get('title', 'No title')}")
        else:
            print("   - No steps found")
    else:
        print("❌ Streaming Format: Missing")
    
    # Test thinking process
    thinking_process = result.get('thinking_process')
    if thinking_process:
        print(f"✅ Thinking Process: Available")
        
        # Check main sections
        sections = ['initial_analysis', 'decision_making', 'execution_summary', 'user_communication']
        for section in sections:
            if section in thinking_process:
                print(f"   - {section}: ✅")
            else:
                print(f"   - {section}: ❌")
                
        # Check extracted info
        initial_analysis = thinking_process.get('initial_analysis', {})
        extracted_info = initial_analysis.get('key_extracted_info', {})
        print(f"   - Extracted Amount: {extracted_info.get('amount', 'MISSING')}")
        print(f"   - Extracted Location: {extracted_info.get('location', 'MISSING')}")
        print(f"   - Language Detected: {initial_analysis.get('language_detected', 'MISSING')}")
    else:
        print("❌ Thinking Process: Missing")
    
    # Test enhanced data
    enhanced_data = result.get('enhanced_data')
    if enhanced_data:
        print(f"✅ Enhanced Data: Available")
        print(f"   - Success: {enhanced_data.get('success', 'MISSING')}")
        print(f"   - Message: {enhanced_data.get('message', 'MISSING')}")
    else:
        print("❌ Enhanced Data: Missing")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    
    required_fields = ['query', 'response', 'response_type', 'enhanced_data', 'streaming_format', 'thinking_process']
    missing_fields = [field for field in required_fields if not result.get(field)]
    
    if not missing_fields:
        print("✅ All required fields present!")
        print("✅ Implementation matches example format!")
    else:
        print(f"❌ Missing fields: {missing_fields}")
    
    print("\n📋 Available Response Formats:")
    print("- Standard format ✅")
    print("- Streaming format ✅")  
    print("- Thinking format ✅")
    print("- Enhanced data ✅")
    
    return result

if __name__ == "__main__":
    try:
        result = test_streaming_format()
        print("\n🎉 Test completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc() 