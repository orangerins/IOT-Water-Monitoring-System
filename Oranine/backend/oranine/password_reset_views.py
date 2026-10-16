
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.utils.encoding import force_str
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)
from django.utils.encoding import force_bytes

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle


User = get_user_model()


class PasswordResetThrottle(AnonRateThrottle):
    scope = "password_reset"


GENERIC_RESPONSE = (
    "If an account is registered with that email, "
    "password reset instructions have been sent."
)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def request_password_reset(request):
    email = str(
        request.data.get("email") or ""
    ).strip().lower()

    if not email:
        return Response(
            {"error": "Please enter your email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"error": "Please enter a valid email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Do not reveal whether an email is registered.
    # Do not issue tokens to inactive accounts.
    users = User.objects.filter(
        email__iexact=email,
        is_active=True,
    )

    frontend_url = getattr(
        settings,
        "PASSWORD_RESET_FRONTEND_URL",
        "http://localhost:8081/",
    )

    for user in users:
        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        token = default_token_generator.make_token(user)

        query = urlencode({
            "reset_uid": uid,
            "reset_token": token,
        })

        separator = (
            "&" if "?" in frontend_url else "?"
        )

        reset_link = (
            f"{frontend_url}{separator}{query}"
        )

        subject = "Oranine - Reset Your Password"

        message = (
            f"Hello {user.username},\n\n"
            "We received a request to reset your "
            "Oranine account password.\n\n"
            "Open this link to create a new password:\n"
            f"{reset_link}\n\n"
            "This link expires after the configured "
            "password reset period.\n\n"
            "If you did not request this change, "
            "you can ignore this email.\n\n"
            "Oranine Water Quality Monitoring System"
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

    return Response({
        "message": GENERIC_RESPONSE,
    })


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def confirm_password_reset(request):
    uid = str(
        request.data.get("uid") or ""
    ).strip()

    reset_token = str(
        request.data.get("token") or ""
    ).strip()

    new_password = (
        request.data.get("new_password") or ""
    )

    confirm_password = (
        request.data.get("confirm_password") or ""
    )

    if not all([
        uid,
        reset_token,
        new_password,
        confirm_password,
    ]):
        return Response(
            {"error": "Please complete all fields."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_password != confirm_password:
        return Response(
            {"error": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_id = force_str(
            urlsafe_base64_decode(uid)
        )

        user = User.objects.get(
            pk=user_id,
            is_active=True,
        )
    except (
        TypeError,
        ValueError,
        OverflowError,
        UnicodeDecodeError,
        User.DoesNotExist,
    ):
        return Response(
            {
                "error": (
                    "This password reset link is "
                    "invalid or has expired."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not default_token_generator.check_token(
        user,
        reset_token,
    ):
        return Response(
            {
                "error": (
                    "This password reset link is "
                    "invalid or has expired."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(
            new_password,
            user=user,
        )
    except ValidationError as exc:
        return Response(
            {"error": exc.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        # Recheck while holding the account lock.
        locked_user = User.objects.select_for_update().get(
            pk=user.pk
        )

        if not default_token_generator.check_token(
            locked_user,
            reset_token,
        ):
            return Response(
                {
                    "error": (
                        "This password reset link is "
                        "invalid or has expired."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        locked_user.set_password(new_password)
        locked_user.save(update_fields=["password"])

        # Revoke existing Django REST Framework
        # authentication tokens after password reset.
        Token.objects.filter(
            user=locked_user
        ).delete()

    return Response({
        "message": (
            "Password reset successfully. "
            "You can now sign in with your new password."
        )
    })
