"""
ASGI config for expense_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
import environ  # ✅ add this line

# Initialize environment variables
env = environ.Env()
environ.Env.read_env()  # Reads from .env file

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings.production')

application = get_asgi_application()
