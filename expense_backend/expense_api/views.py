from django.http import HttpResponse

def home(request):
    return HttpResponse("This is the home page.")

def about(request):
    return HttpResponse("This is the about page.")

def contact(request):
    return HttpResponse("This is the contact page.")
