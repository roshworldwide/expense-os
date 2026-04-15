"""
Models — Bastian Build Expense OS
The RoSh Worldwide

Defines the UpcomingExpense model that powers the Expense Chargesheet.
"""

from django.db import models


class UpcomingExpense(models.Model):
    """A single upcoming operational liability tracked on the chargesheet."""

    PRIORITY_CHOICES = [
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
        ('LOW', 'Low'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    title = models.CharField(max_length=255, help_text="Expense title / description")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Amount in INR")
    due_date = models.DateField(help_text="Deadline for this expense")
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        help_text="Priority level of the expense",
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text="Current status of the expense",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'upcoming_expenses'
        ordering = ['due_date', '-priority']
        verbose_name = 'Upcoming Expense'
        verbose_name_plural = 'Upcoming Expenses'

    def __str__(self):
        return f"{self.title} — ₹{self.amount} [{self.priority}]"
