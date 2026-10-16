
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    FishFarmerViewSet,
    PondViewSet,
    DeviceViewSet,
    SensorViewSet,
    ReadingViewSet,
    AlertViewSet,
    receive_device_readings,
)

from .auth_views import (
    register_user,
    login_user,
    current_user,
    update_profile,
    change_password,
    logout_user,
)

from .password_reset_views import (
    request_password_reset,
    confirm_password_reset,
)


# ============================================================
# API ROUTER
# ============================================================

router = DefaultRouter()

router.register(
    r"farmers",
    FishFarmerViewSet,
    basename="farmer",
)

router.register(
    r"ponds",
    PondViewSet,
    basename="pond",
)

router.register(
    r"devices",
    DeviceViewSet,
    basename="device",
)

router.register(
    r"sensors",
    SensorViewSet,
    basename="sensor",
)

router.register(
    r"readings",
    ReadingViewSet,
    basename="reading",
)

router.register(
    r"alerts",
    AlertViewSet,
    basename="alert",
)


# ============================================================
# API URL PATTERNS
# ============================================================

urlpatterns = [
    # Registration
    path(
        "auth/register/",
        register_user,
        name="auth-register",
    ),

    # Login
    path(
        "auth/login/",
        login_user,
        name="auth-login",
    ),

    # Current account
    path(
        "auth/me/",
        current_user,
        name="auth-me",
    ),

    # Edit farmer profile
    path(
        "auth/profile/update/",
        update_profile,
        name="auth-profile-update",
    ),

    # Change password while logged in
    path(
        "auth/change-password/",
        change_password,
        name="auth-change-password",
    ),

    # Request password reset email
    path(
        "auth/password-reset/",
        request_password_reset,
        name="auth-password-reset",
    ),

    # Confirm password reset
    path(
        "auth/password-reset/confirm/",
        confirm_password_reset,
        name="auth-password-reset-confirm",
    ),

    # Logout
    path(
        "auth/logout/",
        logout_user,
        name="auth-logout",
    ),

    # ESP32 sensor data ingestion
    path(
        "device/readings/",
        receive_device_readings,
        name="receive-device-readings",
    ),
]

urlpatterns += router.urls
