from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from sentinel.views import POSLogViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'pos-logs', POSLogViewSet, basename='poslog')
router.register(r'alerts', AlertViewSet, basename='alert')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # This creates /api/pos-logs/ and /api/alerts/
]

# Allow access to video clips in the 'media' folder
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)