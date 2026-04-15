"""
Admin — Bastian Build Expense OS
"""

from django.contrib import admin
from .models import UpcomingExpense


@admin.register(UpcomingExpense)
class UpcomingExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'due_date', 'priority', 'status', 'created_at')
    list_filter = ('priority', 'status')
    search_fields = ('title',)
    ordering = ('due_date',)
