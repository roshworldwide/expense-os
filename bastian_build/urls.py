"""
URL Configuration — bastian_build project
Bastian Build Expense OS — The RoSh Worldwide
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('expense_os.urls')),
]
