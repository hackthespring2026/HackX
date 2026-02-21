from django.db import models

class POSLog(models.Model):
    """Digital record from the Cashier's POS UI"""
    transaction_id = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=50)  # SALE, SHIFT_END, NO_SALE
    amount = models.FloatField(default=0.0)
    payment_mode = models.CharField(max_length=20, default='CASH')  # CASH, UPI, CARD
    timestamp = models.DateTimeField(auto_now_add=True)

class AnomalyAlert(models.Model):
    """The Flag from the AI / Anomaly Engine"""
    type_choices = [
        ('UNAUTH',          'Unauthorized Access'),
        ('POCKET',          'Hand-to-Pocket'),
        ('DRAWER_NO_SALE',  'Drawer Opened Without Sale'),
        ('PROLONGED_OPEN',  'Drawer Open Too Long'),
        ('MISMATCH',        'POS Log Mismatch'),
        ('TRAJECTORY',      'Hand-to-Pocket Trajectory'),
        ('VIDEO_CLIP',      'Video Clip Alert'),
    ]
    anomaly_type      = models.CharField(max_length=20, choices=type_choices)
    confidence        = models.FloatField(default=1.0)
    video_clip        = models.CharField(max_length=500, blank=True, null=True)
    timestamp         = models.DateTimeField(auto_now_add=True)
    is_verified       = models.BooleanField(default=False)
    blockchain_tx     = models.CharField(max_length=100, blank=True)
    rule_violated     = models.CharField(max_length=200, blank=True, null=True)
    safety_mode_active = models.BooleanField(default=False)
    # Extra context for camera-agnostic tier
    tier_source       = models.CharField(
        max_length=20,
        default='VISUAL',
        choices=[
            ('VISUAL',    'Direct YOLO Vision'),
            ('POS_LOGIC', 'POS Log Heuristic'),
            ('TRAJECTORY','Side-Angle Trajectory'),
            ('IOT_SIM',   'Simulated IoT Sensor'),
        ]
    )
    details           = models.TextField(blank=True, null=True)  # JSON extra context

class WorkShift(models.Model):
    cashier_name  = models.CharField(max_length=100)
    start_time    = models.DateTimeField(auto_now_add=True)
    end_time      = models.DateTimeField(null=True, blank=True)
    initial_cash  = models.FloatField(default=0.0)
    expected_cash = models.FloatField(default=0.0)
    actual_cash   = models.FloatField(default=0.0)
    discrepancy   = models.FloatField(default=0.0)
    is_active     = models.BooleanField(default=True)

class SafetyLog(models.Model):
    shift                  = models.ForeignKey(WorkShift, on_delete=models.CASCADE)
    timestamp              = models.DateTimeField(auto_now_add=True)
    action                 = models.CharField(max_length=10)  # ON / OFF
    linked_transaction_id  = models.CharField(max_length=100, blank=True, null=True)

class DrawerEvent(models.Model):
    """
    Simulates drawer open/close events.
    In production: driven by a $5 magnetic sensor or IoT vibration sensor.
    In demo: driven by the Sentinel Dashboard UI buttons.
    """
    STATUS_CHOICES = [('OPEN', 'Open'), ('CLOSED', 'Closed')]
    status                  = models.CharField(max_length=10, choices=STATUS_CHOICES)
    timestamp               = models.DateTimeField(auto_now_add=True)
    linked_transaction_id   = models.CharField(max_length=100, blank=True, null=True)
    duration_seconds        = models.FloatField(null=True, blank=True)  # filled on CLOSE
    anomaly_triggered       = models.BooleanField(default=False)
    anomaly_reason          = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']