from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Complaint, ComplaintFeedback
from .serializers import (
    ComplaintSerializer,
    ComplaintStatusUpdateSerializer,
    ComplaintFeedbackSerializer
)
from .permissions import IsOwnerOrAdmin


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff:
            return Complaint.objects.all()

        return Complaint.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        return Response(
            {"error": "Direct update not allowed. Use specific actions."},
            status=status.HTTP_403_FORBIDDEN
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {"error": "Direct update not allowed. Use specific actions."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def destroy(self, request, *args, **kwargs):
        complaint = self.get_object()
        if complaint.status != 'PENDING':
            return Response(
                {"error": "Only pending complaints can be deleted."},
                status=400
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin])
    def edit_fields(self, request, pk=None):
        complaint = self.get_object()

        if complaint.status != "PENDING":
            return Response(
            {"error": "Only pending complaints can be edited."},
            status=400
        )

        serializer = ComplaintSerializer(
            complaint,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        serializer = ComplaintStatusUpdateSerializer(
            complaint, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        new_status = serializer.validated_data.get("status")
        current_status = complaint.status

        allowed_transitions = {
            'PENDING': ['IN_PROGRESS'],
            'IN_PROGRESS': ['RESOLVED_BY_AUTHORITY'],
            'REOPENED': ['IN_PROGRESS'],
            'RESOLVED_BY_AUTHORITY': [],
            'CLOSED': []
        }

        if new_status not in allowed_transitions.get(current_status, []):
            return Response(
                {"error": f"Invalid transition from {current_status} to {new_status}"},
                status=400
            )

        if new_status == 'RESOLVED_BY_AUTHORITY':
            complaint.user_confirmation = None

        complaint.status = new_status
        complaint.save()

        return Response({"message": f"Status updated to {new_status}"})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrAdmin])
    def confirm_solution(self, request, pk=None):
        complaint = self.get_object()

        if complaint.status != 'RESOLVED_BY_AUTHORITY':
            return Response(
                {"error": "Complaint is not awaiting confirmation."},
                status=400
            )

        confirmed = request.data.get("confirmed")

        if confirmed is True:
            complaint.status = 'CLOSED'
            complaint.user_confirmation = True
            complaint.save()
            return Response({"message": "Complaint closed successfully."})

        elif confirmed is False:
            complaint.status = 'REOPENED'
            complaint.user_confirmation = False
            complaint.save()
            return Response({"message": "Complaint reopened. Please provide feedback."})

        return Response(
            {"error": "'confirmed' field must be true or false."},
            status=400
        )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated , IsOwnerOrAdmin])
    def submit_feedback(self, request, pk=None):
        complaint = self.get_object()

        if complaint.status != 'REOPENED':
            return Response(
                {"error": "Feedback allowed only for reopened complaints."},
                status=400
            )

        if complaint.feedbacks.exists():
            return Response(
                {"error": "Feedback already submitted."},
                status=400
            )

        serializer = ComplaintFeedbackSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(
                user=request.user,
                complaint=complaint
            )
            return Response({"message": "Feedback submitted successfully."})

        return Response(serializer.errors, status=400)

