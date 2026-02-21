import json
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from web3 import Web3
from decouple import config
from django.utils import timezone
from datetime import timedelta

from .models import POSLog, AnomalyAlert, WorkShift, SafetyLog, DrawerEvent
from .serializers import (
    POSLogSerializer, AlertSerializer,
    WorkShiftSerializer, SafetyLogSerializer, DrawerEventSerializer
)

# ─────────────────────────────────────────
#  Helper: fire an anomaly alert
# ─────────────────────────────────────────
def _fire_alert(anomaly_type, rule_violated, details, tier_source, confidence=1.0):
    """Create an AnomalyAlert and anchor it to blockchain."""
    alert = AnomalyAlert.objects.create(
        anomaly_type=anomaly_type,
        confidence=confidence,
        rule_violated=rule_violated,
        details=json.dumps(details),
        tier_source=tier_source,
    )
    # Blockchain anchor
    try:
        w3 = Web3(Web3.HTTPProvider(config('SEPOLIA_RPC_URL')))
        account = w3.eth.account.from_key(config('PRIVATE_KEY'))
        contract = w3.eth.contract(
            address=config('CONTRACT_ADDRESS'),
            abi=json.loads(config('CONTRACT_ABI'))
        )
        evidence_hash = w3.keccak(
            text=f"{anomaly_type}_{alert.timestamp}_{rule_violated}"
        ).hex()
        nonce = w3.eth.get_transaction_count(account.address, 'pending')
        base_fee = w3.eth.get_block('latest')['baseFeePerGas']
        # Bump the base fee by 25% and priority by heavily to blast through the stuck tx
        bumped_base_fee = int(base_fee * 1.25)
        max_priority = w3.to_wei('5', 'gwei')
        tx = contract.functions.anchorEvent(
            anomaly_type, evidence_hash
        ).build_transaction({
            'chainId': 11155111,
            'gas': 300000,
            'maxFeePerGas': bumped_base_fee + max_priority,
            'maxPriorityFeePerGas': max_priority,
            'nonce': nonce,
        })
        signed = w3.eth.account.sign_transaction(tx, private_key=config('PRIVATE_KEY'))
        tx_hash = w3.to_hex(w3.eth.send_raw_transaction(signed.raw_transaction))
        alert.blockchain_tx = tx_hash
        alert.is_verified = True
        alert.save()
        print(f"✅ [{anomaly_type}] anchored → {tx_hash}")
    except Exception as e:
        print(f"❌ Blockchain error for {anomaly_type}: {e}")
    return alert


# ─────────────────────────────────────────
#  POS Log ViewSet
# ─────────────────────────────────────────
class POSLogViewSet(viewsets.ModelViewSet):
    queryset = POSLog.objects.all().order_by('-timestamp')
    serializer_class = POSLogSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # ── Rule 3: Velocity / Cash Mismatch ──────────────────────────────
        # If sale amount is 3× the rolling average of last 5 sales → flag
        if request.data.get('event_type') == 'SALE':
            try:
                amount = float(request.data.get('amount', 0))
                recent = POSLog.objects.filter(
                    event_type='SALE'
                ).order_by('-timestamp')[:5]
                if recent.count() >= 3:
                    avg = sum(r.amount for r in recent) / recent.count()
                    if avg > 0 and amount > avg * 3:
                        _fire_alert(
                            anomaly_type='MISMATCH',
                            rule_violated=f'Sale ₹{amount:.0f} is {amount/avg:.1f}× avg ₹{avg:.0f}',
                            details={'amount': amount, 'rolling_avg': avg},
                            tier_source='POS_LOGIC',
                            confidence=0.85,
                        )
            except Exception as e:
                print(f"Velocity check error: {e}")

        return response


# ─────────────────────────────────────────
#  Drawer Event ViewSet  (Tier 1 Core)
# ─────────────────────────────────────────
PROLONGED_OPEN_SECONDS = 15   # flag if drawer open longer than this
NO_SALE_WINDOW_SECONDS = 8    # look-back window for a matching SALE

class DrawerEventViewSet(viewsets.ModelViewSet):
    queryset = DrawerEvent.objects.all().order_by('-timestamp')
    serializer_class = DrawerEventSerializer

    def create(self, request, *args, **kwargs):
        incoming_status = request.data.get('status', '').upper()
        linked_tx       = request.data.get('linked_transaction_id', '')

        # ── Rule 1: Drawer OPEN without a recent SALE ─────────────────────
        if incoming_status == 'OPEN':
            window_start = timezone.now() - timedelta(seconds=NO_SALE_WINDOW_SECONDS)
            recent_sale  = POSLog.objects.filter(
                event_type='SALE',
                timestamp__gte=window_start
            ).exists()

            if not recent_sale:
                reason = f'Drawer opened with no SALE in last {NO_SALE_WINDOW_SECONDS}s'
                # Create the event first so we have an ID
                event = DrawerEvent.objects.create(
                    status='OPEN',
                    linked_transaction_id=linked_tx,
                    anomaly_triggered=True,
                    anomaly_reason=reason,
                )
                _fire_alert(
                    anomaly_type='DRAWER_NO_SALE',
                    rule_violated=reason,
                    details={'drawer_event_id': event.id, 'linked_tx': linked_tx},
                    tier_source='POS_LOGIC',
                    confidence=0.95,
                )
                return Response(DrawerEventSerializer(event).data,
                                status=status.HTTP_201_CREATED)

        # ── Rule 2: Drawer CLOSE — check duration ─────────────────────────
        if incoming_status == 'CLOSED':
            last_open = DrawerEvent.objects.filter(status='OPEN').order_by('-timestamp').first()
            duration  = None
            reason    = None
            anomaly   = False

            if last_open:
                duration = (timezone.now() - last_open.timestamp).total_seconds()
                if duration > PROLONGED_OPEN_SECONDS:
                    reason  = f'Drawer open for {duration:.1f}s (limit {PROLONGED_OPEN_SECONDS}s)'
                    anomaly = True

            event = DrawerEvent.objects.create(
                status='CLOSED',
                linked_transaction_id=linked_tx,
                duration_seconds=duration,
                anomaly_triggered=anomaly,
                anomaly_reason=reason,
            )

            if anomaly:
                _fire_alert(
                    anomaly_type='PROLONGED_OPEN',
                    rule_violated=reason,
                    details={'drawer_event_id': event.id, 'duration_s': duration},
                    tier_source='POS_LOGIC',
                    confidence=0.9,
                )

            return Response(DrawerEventSerializer(event).data,
                            status=status.HTTP_201_CREATED)

        # Default path (no anomaly)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Summary stats for the dashboard."""
        total      = DrawerEvent.objects.count()
        anomalies  = DrawerEvent.objects.filter(anomaly_triggered=True).count()
        last_open  = DrawerEvent.objects.filter(status='OPEN').order_by('-timestamp').first()
        currently_open = last_open is not None and not DrawerEvent.objects.filter(
            status='CLOSED', timestamp__gt=last_open.timestamp
        ).exists()

        return Response({
            'total_events':    total,
            'total_anomalies': anomalies,
            'currently_open':  currently_open,
            'open_since':      last_open.timestamp if currently_open and last_open else None,
        })


# ─────────────────────────────────────────
#  WorkShift ViewSet
# ─────────────────────────────────────────
class WorkShiftViewSet(viewsets.ModelViewSet):
    queryset = WorkShift.objects.all().order_by('-start_time')
    serializer_class = WorkShiftSerializer

    @action(detail=False, methods=['post'])
    def start(self, request):
        WorkShift.objects.filter(is_active=True).update(
            is_active=False, end_time=timezone.now()
        )
        return super().create(request)

    @action(detail=False, methods=['post'])
    def end(self, request):
        # Use filter().first() to avoid MultipleObjectsReturned
        shift = WorkShift.objects.filter(is_active=True).order_by('-start_time').first()
        if not shift:
            return Response({"error": "No active shift found"}, status=404)
        shift.end_time    = timezone.now()
        shift.actual_cash = request.data.get('actual_cash', 0.0)
        shift.is_active   = False
        # Close any other stale active shifts too
        WorkShift.objects.filter(is_active=True).exclude(pk=shift.pk).update(
            is_active=False, end_time=timezone.now()
        )
        total_sales = 0
        logs = POSLog.objects.filter(
            timestamp__gte=shift.start_time,
            timestamp__lte=shift.end_time
        )
        for log in logs:
            if log.event_type == 'SALE':
                total_sales += log.amount
            elif log.event_type == 'REFUND':
                total_sales -= abs(log.amount)
        shift.expected_cash = shift.initial_cash + total_sales
        shift.discrepancy   = shift.actual_cash - shift.expected_cash
        shift.save()
        return Response(WorkShiftSerializer(shift).data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        # Use filter().first() to avoid MultipleObjectsReturned
        shift = WorkShift.objects.filter(is_active=True).order_by('-start_time').first()
        if not shift:
            return Response({"active": False})
        total_sales = 0
        logs = POSLog.objects.filter(timestamp__gte=shift.start_time)
        for log in logs:
            if log.event_type == 'SALE' and log.payment_mode == 'CASH':
                total_sales += log.amount
            elif log.event_type == 'REFUND' and log.payment_mode == 'CASH':
                total_sales -= abs(log.amount)
        current_balance = shift.initial_cash + total_sales
        data = WorkShiftSerializer(shift).data
        data['expected_cash'] = current_balance
        return Response(data)


# ─────────────────────────────────────────
#  Safety Log ViewSet
# ─────────────────────────────────────────
class SafetyLogViewSet(viewsets.ModelViewSet):
    queryset = SafetyLog.objects.all().order_by('-timestamp')
    serializer_class = SafetyLogSerializer


# ─────────────────────────────────────────
#  Alert ViewSet
# ─────────────────────────────────────────
class AlertViewSet(viewsets.ModelViewSet):
    queryset = AnomalyAlert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer

    def create(self, request, *args, **kwargs):
        # Check Safety Mode status
        is_safe = False
        try:
            active_shift = WorkShift.objects.filter(is_active=True).first()
            if active_shift:
                last_log = SafetyLog.objects.filter(
                    shift=active_shift
                ).order_by('-timestamp').first()
                if last_log and last_log.action == 'ON':
                    is_safe = True
        except Exception:
            pass

        if is_safe:
            request.data['safety_mode_active'] = True

        response   = super().create(request, *args, **kwargs)
        alert_data = response.data

        # Blockchain anchor for manually-created alerts
        try:
            w3 = Web3(Web3.HTTPProvider(config('SEPOLIA_RPC_URL')))
            account  = w3.eth.account.from_key(config('PRIVATE_KEY'))
            contract = w3.eth.contract(
                address=config('CONTRACT_ADDRESS'),
                abi=json.loads(config('CONTRACT_ABI'))
            )
            evidence_hash = w3.keccak(
                text=f"{alert_data['anomaly_type']}_{alert_data['timestamp']}"
            ).hex()
            nonce       = w3.eth.get_transaction_count(account.address, 'pending')
            base_fee    = w3.eth.get_block('latest')['baseFeePerGas']
            bumped_base_fee = int(base_fee * 1.25)
            max_priority = w3.to_wei('5', 'gwei')
            tx = contract.functions.anchorEvent(
                alert_data['anomaly_type'], evidence_hash
            ).build_transaction({
                'chainId': 11155111,
                'gas': 300000,
                'maxFeePerGas': bumped_base_fee + max_priority,
                'maxPriorityFeePerGas': max_priority,
                'nonce': nonce,
            })
            signed   = w3.eth.account.sign_transaction(tx, private_key=config('PRIVATE_KEY'))
            tx_hash  = w3.to_hex(w3.eth.send_raw_transaction(signed.raw_transaction))
            alert    = AnomalyAlert.objects.get(id=alert_data['id'])
            alert.blockchain_tx = tx_hash
            alert.is_verified   = True
            alert.save()
            print(f"✅ Alert anchored to Sepolia: {tx_hash}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"❌ Blockchain Error: {e}")

        return response