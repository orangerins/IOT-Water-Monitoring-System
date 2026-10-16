
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import FishFarmer


User = get_user_model()


# ============================================================
# HELPERS
# ============================================================

def error_response(message, http_status=400):
    return Response(
        {"error": message},
        status=http_status,
    )


def get_farmer_for_user(user):
    """
    Return the farmer explicitly linked to this user.

    For accounts created before the relationship
    was introduced, safely link one matching
    unclaimed farmer record by email.

    Never take a farmer record belonging to
    another Django user.
    """
    farmer = FishFarmer.objects.filter(
        user=user
    ).first()

    if farmer is not None:
        return farmer

    email = (user.email or "").strip()

    if not email:
        return None

    with transaction.atomic():
        matches = list(
            FishFarmer.objects.select_for_update().filter(
                email__iexact=email
            )[:2]
        )

        if len(matches) != 1:
            return None

        farmer = matches[0]

        if farmer.user_id is not None:
            return (
                farmer
                if farmer.user_id == user.pk
                else None
            )

        # Do not claim a record if another
        # account has the same email.
        if User.objects.filter(
            email__iexact=email
        ).exclude(pk=user.pk).exists():
            return None

        farmer.user = user
        farmer.save(update_fields=["user"])

        return farmer


def build_profile(user):
    farmer = get_farmer_for_user(user)

    contact = (
        farmer.contact_no or ""
        if farmer is not None
        else ""
    )

    return {
        "id": user.pk,
        "user_id": user.pk,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "contact": contact,
        "contact_number": contact,
        "date_joined": user.date_joined.isoformat(),
    }


# ============================================================
# REGISTER
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def register_user(request):
    username = str(
        request.data.get("username") or ""
    ).strip()

    email = str(
        request.data.get("email") or ""
    ).strip().lower()

    contact = str(
        request.data.get("contact") or ""
    ).strip()

    password = request.data.get("password") or ""
    confirm_password = (
        request.data.get("confirm_password") or ""
    )

    if not all([
        username,
        email,
        contact,
        password,
        confirm_password,
    ]):
        return error_response(
            "Please complete all fields."
        )

    if len(username) > 150:
        return error_response(
            "Username is too long."
        )

    if len(email) > 50:
        return error_response(
            "Email must be 50 characters or fewer."
        )

    if len(contact) > 15:
        return error_response(
            "Contact number must be 15 characters or fewer."
        )

    try:
        validate_email(email)
    except ValidationError:
        return error_response(
            "Please enter a valid email address."
        )

    if password != confirm_password:
        return error_response(
            "Passwords do not match."
        )

    if User.objects.filter(
        username__iexact=username
    ).exists():
        return error_response(
            "Username is already taken."
        )

    if (
        User.objects.filter(
            email__iexact=email
        ).exists()
        or FishFarmer.objects.filter(
            email__iexact=email
        ).exists()
    ):
        return error_response(
            "Email is already registered."
        )

    try:
        validate_password(
            password,
            user=User(
                username=username,
                email=email,
            ),
        )
    except ValidationError as exc:
        return error_response(exc.messages)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )

            FishFarmer.objects.create(
                user=user,
                name=username,
                email=email,
                contact_no=contact,
            )

    except IntegrityError:
        return error_response(
            "Account details are already registered."
        )

    return Response(
        {
            "message": (
                "Account created successfully. "
                "Please log in."
            ),
            "username": user.username,
        },
        status=status.HTTP_201_CREATED,
    )


# ============================================================
# LOGIN
# ============================================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    username = str(
        request.data.get("username") or ""
    ).strip()

    password = request.data.get("password") or ""

    if not username or not password:
        return error_response(
            "Username and password are required."
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None or not user.is_active:
        return error_response(
            "Invalid username or password.",
            status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(
        user=user
    )

    return Response(
        {
            "message": "Login successful.",
            "token": token.key,
            "user": {
                "id": user.pk,
                "username": user.username,
                "email": user.email,
            },
        }
    )


# ============================================================
# GET CURRENT PROFILE
# ============================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(
        build_profile(request.user)
    )


# ============================================================
# EDIT PROFILE
# ============================================================

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user

    username = str(
        request.data.get(
            "username",
            user.username,
        ) or ""
    ).strip()

    email = str(
        request.data.get(
            "email",
            user.email,
        ) or ""
    ).strip().lower()

    if not username or not email:
        return error_response(
            "Username and email are required."
        )

    if len(username) > 150:
        return error_response(
            "Username is too long."
        )

    if len(email) > 50:
        return error_response(
            "Email must be 50 characters or fewer."
        )

    try:
        validate_email(email)
    except ValidationError:
        return error_response(
            "Please enter a valid email address."
        )

    if User.objects.filter(
        username__iexact=username
    ).exclude(pk=user.pk).exists():
        return error_response(
            "Username is already taken."
        )

    if User.objects.filter(
        email__iexact=email
    ).exclude(pk=user.pk).exists():
        return error_response(
            "Email is already registered."
        )

    # Resolve existing account relationship
    # BEFORE modifying the email.
    farmer = get_farmer_for_user(user)

    if farmer is None:
        return error_response(
            "Your farmer record could not be linked "
            "safely. Contact the administrator.",
            status.HTTP_409_CONFLICT,
        )

    contact = str(
        request.data.get(
            "contact",
            farmer.contact_no or "",
        ) or ""
    ).strip()

    if len(contact) > 15:
        return error_response(
            "Contact number must be 15 characters or fewer."
        )

    if FishFarmer.objects.filter(
        email__iexact=email
    ).exclude(pk=farmer.pk).exists():
        return error_response(
            "Email is already used by another farmer."
        )

    try:
        with transaction.atomic():
            user.username = username
            user.email = email
            user.save(
                update_fields=["username", "email"]
            )

            farmer.name = username
            farmer.email = email
            farmer.contact_no = contact
            farmer.save(
                update_fields=[
                    "name",
                    "email",
                    "contact_no",
                ]
            )

    except IntegrityError:
        return error_response(
            "Unable to save. Username or email "
            "may already be in use."
        )

    return Response(
        {
            "message": "Profile updated successfully.",
            "user": build_profile(user),
        }
    )


# ============================================================
# CHANGE PASSWORD
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user

    current_password = (
        request.data.get("current_password") or ""
    )
    new_password = (
        request.data.get("new_password") or ""
    )
    confirm_password = (
        request.data.get("confirm_password") or ""
    )

    if not all([
        current_password,
        new_password,
        confirm_password,
    ]):
        return error_response(
            "Please complete all password fields."
        )

    if not user.check_password(current_password):
        return error_response(
            "Current password is incorrect."
        )

    if new_password != confirm_password:
        return error_response(
            "New passwords do not match."
        )

    if current_password == new_password:
        return error_response(
            "New password must be different "
            "from your current password."
        )

    try:
        validate_password(
            new_password,
            user=user,
        )
    except ValidationError as exc:
        return error_response(exc.messages)

    with transaction.atomic():
        user.set_password(new_password)
        user.save(update_fields=["password"])

        # Revoke the old token after changing
        # the password.
        Token.objects.filter(user=user).delete()

        new_token = Token.objects.create(user=user)

    return Response(
        {
            "message": "Password changed successfully.",
            "token": new_token.key,
        }
    )


# ============================================================
# LOGOUT
# ============================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    Token.objects.filter(
        user=request.user
    ).delete()

    return Response(
        {
            "message": "Logged out successfully."
        }
    )
