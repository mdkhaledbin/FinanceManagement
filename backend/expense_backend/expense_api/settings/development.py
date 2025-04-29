from .base import *

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE'),
        'NAME': BASE_DIR / env('DB_NAME'),
    }
}
