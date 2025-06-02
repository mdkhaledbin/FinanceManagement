"""
WSGI config for expense_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""
import os
import environ  # ✅ add this line

# Initialize environment variables
env = environ.Env()
environ.Env.read_env()  # Reads from .env file

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')

application = get_wsgi_application()
