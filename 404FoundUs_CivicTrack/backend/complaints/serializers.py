from rest_framework import serializers
from .models import Complaint, ComplaintFeedback


class ComplaintSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ('status', 'user_confirmation', 'created_at', 'updated_at')


class ComplaintStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status']


class ComplaintFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintFeedback
        fields = ['reason', 'comment']
        read_only_fields = ('user', 'complaint', 'created_at')
