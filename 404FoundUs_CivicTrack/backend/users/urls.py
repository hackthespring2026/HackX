from django.urls import path
from .views import RegisterView, ProfileView, UserListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('', UserListView.as_view(), name='user-list'),
]
