from django.http import HttpResponse

def home(request):
    return HttpResponse("This is the llm page.")

def about(request):
    return HttpResponse("This is the about llm page.")

def contact(request):
    return HttpResponse("This is the about contact page.")
