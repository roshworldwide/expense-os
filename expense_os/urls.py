"""
URL Configuration — expense_os app
Bastian Build Expense OS — The RoSh Worldwide
"""

from django.urls import path
from . import views

app_name = 'expense_os'

urlpatterns = [
    # Dashboard (HTML view)
    path('', views.dashboard, name='dashboard'),

    # REST API endpoints
    path('api/expenses/', views.expense_list_create, name='expense-list-create'),
    path('api/expenses/<int:pk>/', views.expense_detail, name='expense-detail'),
]
