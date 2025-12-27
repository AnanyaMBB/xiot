from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'baseboards', views.BaseboardViewSet)
router.register(r'sensors', views.SensorViewSet)
router.register(r'actuators', views.ActuatorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('status/', views.SystemStatusView.as_view(), name='system_status'),
    path('lcd/command/', views.LCDCommandView.as_view(), name='lcd_command'),
    path('devices/register/', views.DeviceRegistrationView.as_view(), name='device_register'),
    path('devices/discover/', views.TriggerDiscoveryView.as_view(), name='trigger_discovery'),
]

