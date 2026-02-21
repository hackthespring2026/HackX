from rest_framework import serializers
from .models import POSLog, AnomalyAlert, WorkShift, SafetyLog, DrawerEvent

class POSLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = POSLog
        fields = '__all__'

class WorkShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkShift
        fields = '__all__'

class SafetyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyLog
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnomalyAlert
        fields = '__all__'

class DrawerEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = DrawerEvent
        fields = '__all__'
        read_only_fields = ['duration_seconds', 'anomaly_triggered', 'anomaly_reason']