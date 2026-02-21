from django.contrib import admin
from .models import Complaint, ComplaintFeedback


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'user',
        'category',
        'status',
        'created_at',
    )

    list_filter = (
        'status',
        'category',
        'created_at',
    )

    search_fields = (
        'title',
        'description',
        'location',
        'user__username',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )


@admin.register(ComplaintFeedback)
class ComplaintFeedbackAdmin(admin.ModelAdmin):
    readonly_fields = ('created_at',)
