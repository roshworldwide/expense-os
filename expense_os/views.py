"""
Views — Bastian Build Expense OS
The RoSh Worldwide

Contains:
  1. Dashboard view (renders the main HTML template)
  2. RESTful API views for UpcomingExpense CRUD (GET/POST/PUT/DELETE)
"""

from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import UpcomingExpense
from .serializers import UpcomingExpenseSerializer


# ---------------------------------------------------------------------------
# Dashboard View (HTML)
# ---------------------------------------------------------------------------
def dashboard(request):
    """Render the main Expense Chargesheet dashboard."""
    return render(request, 'expense_os/dashboard.html')


# ---------------------------------------------------------------------------
# REST API — List / Create
# ---------------------------------------------------------------------------
@api_view(['GET', 'POST'])
def expense_list_create(request):
    """
    GET  → Return all upcoming expenses (ordered by due date).
    POST → Create a new upcoming expense entry.
    """
    if request.method == 'GET':
        expenses = UpcomingExpense.objects.all()
        serializer = UpcomingExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UpcomingExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# REST API — Retrieve / Update / Delete
# ---------------------------------------------------------------------------
@api_view(['GET', 'PUT', 'DELETE'])
def expense_detail(request, pk):
    """
    GET    → Retrieve a single expense by ID.
    PUT    → Update an existing expense.
    DELETE → Remove an expense from the chargesheet.
    """
    try:
        expense = UpcomingExpense.objects.get(pk=pk)
    except UpcomingExpense.DoesNotExist:
        return Response(
            {'error': 'Expense not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        serializer = UpcomingExpenseSerializer(expense)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UpcomingExpenseSerializer(expense, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        expense.delete()
        return Response(
            {'message': 'Expense deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT,
        )
