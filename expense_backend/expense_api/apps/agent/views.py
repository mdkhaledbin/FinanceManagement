from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from asgiref.sync import async_to_sync
from .serializers import QuerySerializer, ResponseSerializer
from .client.client import ExpenseMCPClient

@method_decorator(csrf_exempt, name='dispatch')
class AgentAPIView(APIView):
    def post(self, request):
        input_serializer = QuerySerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query = input_serializer.validated_data["query"]

        try:
            # This is the ONLY correct way to call an async method from a sync view
            response_obj = async_to_sync(self.run_agent)(query)
            data = {
                "query": query,
                "response": response_obj
            }
            output_serializer = ResponseSerializer(data)
            return Response(output_serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def run_agent(self, query):
        async def runner():
            client = ExpenseMCPClient()
            await client.connect()
            print(query)
            result = await client.process_query(query)
            await client.disconnect()
            return result
        return runner()  # ✅ returns coroutine, not nested run()
