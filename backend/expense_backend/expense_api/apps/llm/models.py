from django.db import models

class User(models.Model):
    id = models.AutoField(primary_key=True)    
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    # password_hash = models.CharField(max_length=255)
    # created_at = models.DateTimeField(auto_now_add=True)
    
class Category(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    table = models.JSONField()
    table_category = models.CharField()
    created_at = models.DateTimeField(auto_now_add=True)



