from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED_BY_AUTHORITY', 'Resolved by Authority - Waiting User Confirmation'),
        ('CLOSED', 'Closed (Confirmed by User)'),
        ('REOPENED', 'Reopened by User'),
    ]
    CATEGORY_CHOICES = [
        ('GARBAGE', 'Garbage'),
        ('STREETLIGHT', 'Street Light'),
        ('POTHOLE', 'Pothole'),
        ('WATER_LEAKAGE', 'Water Leakage'),
        ('DRAINAGE', 'Drainage'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints'
    )

    title = models.CharField(max_length=150)
    description = models.TextField()

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    street = models.CharField(max_length=255)
    area = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.IntegerField()

    image = models.ImageField(upload_to='complaints/', null=True, blank=True)

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    user_confirmation = models.BooleanField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.status}"
    
class ComplaintFeedback(models.Model):

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    reason = models.CharField(max_length=340, default="Reason not provided")
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback on Complaint {self.complaint.id}"

