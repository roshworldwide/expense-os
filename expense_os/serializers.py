"""
Serializers — Bastian Build Expense OS
The RoSh Worldwide

DRF serializer for the UpcomingExpense model.
"""

from rest_framework import serializers
from .models import UpcomingExpense


class UpcomingExpenseSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for upcoming expenses."""

    class Meta:
        model = UpcomingExpense
        fields = [
            'id',
            'title',
            'amount',
            'due_date',
            'priority',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """Ensure expense amount is positive."""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value
