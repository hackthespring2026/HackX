from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Complaint


class ComplaintAPITest(APITestCase):

    def setUp(self):
        User = get_user_model()

        self.user1 = User.objects.create_user(
            username='userA',
            password='darshan3187'
        )

        self.user2 = User.objects.create_user(
            username='userB',
            password='darshan3187'
        )

        self.admin = User.objects.create_user(
            username='admin',
            password='darshan3187',
            is_staff=True
        )

        response = self.client.post(reverse('token_obtain_pair'), {
            "username": "userA",
            "password": "darshan3187"
        })
        self.user1_token = response.data['access']

        response = self.client.post(reverse('token_obtain_pair'), {
            "username": "userB",
            "password": "darshan3187"
        })
        self.user2_token = response.data['access']

        response = self.client.post(reverse('token_obtain_pair'), {
            "username": "admin",
            "password": "darshan3187"
        })
        self.admin_token = response.data['access']

    def test_user_can_create_complaint(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user1_token)

        data = {
            "title": "Broken Road",
            "description": "Big pothole",
            "category": "GARBAGE",
            "street": "Main Street",
            "area": "Main Area",
            "city": "Main City",
            "state": "Main State",
            "pincode": 123456
        }

        response = self.client.post('/api/complaints/', data)
        print(response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)
        self.assertEqual(Complaint.objects.first().user, self.user1)

    def test_user_cannot_see_others_complaints(self):
        Complaint.objects.create(
            title="Test",
            description="Test desc",
            category="Road",
            street="Main Street",
            area="Main Area",
            city="Main City",
            state="Main State",
            pincode=123456,
            user=self.user1
        )

        response = self.client.post(reverse('token_obtain_pair'), {
            "username": "userB",
            "password": "darshan3187"
        })
        token = response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        response = self.client.get('/api/complaints/')

        self.assertEqual(len(response.data), 0)

    def test_admin_can_see_all_complaints(self):
        Complaint.objects.create(
            title="Test",
            description="Test desc",
            category="Road",
            street="Main Street",
            area="Main Area",
            city="Main City",
            state="Main State",
            pincode=123456,
            user=self.user1
        )

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.admin_token)

        response = self.client.get('/api/complaints/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_invalid_status_transition(self):
        complaint = Complaint.objects.create(
            title="Test",
            description="Test desc",
            category="Road",
            street="Main Street",
            area="Main Area",
            city="Main City",
            state="Main State",
            pincode=123456,
            user=self.user1
        )

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.admin_token)

        response = self.client.patch(
            f'/api/complaints/{complaint.id}/update_status/',
            {"status": "RESOLVED_BY_AUTHORITY"}
        )

        self.assertEqual(response.status_code, 400)
