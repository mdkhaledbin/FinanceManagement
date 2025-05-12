from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .serializers import UserSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, CategorySerializer

# import json

# @csrf_exempt
# def create_user(request):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         serializer = UserSerializer(data=data)

#         if serializer.is_valid():  # ✅ Call the method
#             serializer.save()
#             return JsonResponse(serializer.data, status=201)
#         return JsonResponse(serializer.errors, status=400)
    
#     return JsonResponse({'error': 'Only POST method allowed'}, status=405)

# @csrf_exempt
# def create_user(request):
#     if request.method == 'POST':
#         try:
#             data = json.loads(request.body)
#             name = data.get('name')
#             email = data.get('email')

#             if not name or not email:
#                 return JsonResponse({'error': 'Missing name or email'}, status=400)
#             if User.objects.filter(email=email).exists():
#                 return JsonResponse({'error': 'Email already exists'}, status=400)

#             user = User.objects.create(
#                 id=uuid.uuid4(),
#                 name=name,
#                 email=email
#             )

#             return JsonResponse({
#                 'id': str(user.id),
#                 'name': user.name,
#                 'email': user.email
#             }, status=201)

#         except json.JSONDecodeError:
#             return JsonResponse({'error': 'Invalid JSON'}, status=400)

#     return JsonResponse({'error': 'Only POST method allowed'}, status=405)

@api_view(['POST'])
def create_user(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_table(request):
    serializer = CategorySerializer(data = request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status= status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def home(request):
    return HttpResponse("This is the llm page.")

def about(request):
    return HttpResponse("This is the about llm page.")

def contact(request):
    return HttpResponse("This is the about contact page.")
