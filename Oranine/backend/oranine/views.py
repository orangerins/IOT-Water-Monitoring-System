
import hmac
import os
from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    FishFarmer,
    Pond,
    Device,
    Sensor,
    Reading,
    Alert,
)

from .serializers import (
    FishFarmerSerializer,
    PondSerializer,
    DeviceSerializer,
    SensorSerializer,
    ReadingSerializer,
    AlertSerializer,
)


# ============================================================
# EXISTING API VIEWSETS
# ============================================================

# Only authenticated Django users can manage these records.
# This prevents anonymous visitors on the local network
# from creating, editing, or deleting database records.

class FishFarmerViewSet(viewsets.ModelViewSet):
    queryset = FishFarmer.objects.all()
    serializer_class = FishFarmerSerializer
    permission_classes = [IsAuthenticated]


class PondViewSet(viewsets.ModelViewSet):
    queryset = Pond.objects.all()
    serializer_class = PondSerializer
    permission_classes = [IsAuthenticated]


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    permission_classes = [IsAuthenticated]


class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]


class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    permission_classes = [IsAuthenticated]


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]


# ============================================================
# ESP32 SENSOR DATA RECEIVER
# ============================================================

def parse_sensor_data(data, sensor_type):
    """
    Validate incoming measurements before saving.

    Uncalibrated sensors accept raw ADC and voltage.
    Temperature accepts a Celsius value.
    """

    if not isinstance(data, dict):
        raise ValueError(
            f"{sensor_type} must contain a JSON object."
        )

    if sensor_type == "temperature":
        try:
            value = Decimal(str(data["value"]))
        except (KeyError, InvalidOperation, TypeError, ValueError):
            raise ValueError(
                "Temperature must contain a valid numeric value."
            )

        if not value.is_finite() or not (-55 <= value <= 125):
            raise ValueError(
                "Temperature is outside the sensor's valid range."
            )

        return {
            "value": value,
            "raw_adc": None,
            "raw_voltage": None,
        }

    try:
        raw_adc = int(data["raw_adc"])
        raw_voltage = Decimal(str(data["raw_voltage"]))
    except (KeyError, InvalidOperation, TypeError, ValueError):
        raise ValueError(
            f"{sensor_type} requires raw_adc and raw_voltage."
        )

    if isinstance(data["raw_adc"], bool):
        raise ValueError("raw_adc must be an integer.")

    if str(raw_adc) != str(data["raw_adc"]):
        raise ValueError("raw_adc must be an integer.")

    if not (0 <= raw_adc <= 1023):
        raise ValueError("raw_adc must be between 0 and 1023.")

    if not raw_voltage.is_finite() or not (
        Decimal("0") <= raw_voltage <= Decimal("5")
    ):
        raise ValueError(
            "raw_voltage must be between 0 and 5 volts."
        )

    return {
        "value": None,
        "raw_adc": raw_adc,
        "raw_voltage": raw_voltage,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def receive_device_readings(request):
    """
    Receives one complete batch from the ESP32.

    Expected JSON:
    {
        "device_id": 1,
        "temperature": {"value": 22.06},
        "turbidity": {"raw_adc": 633, "raw_voltage": 3.09},
        "pH": {"raw_adc": 444, "raw_voltage": 2.17},
        "DO": {"raw_adc": 251, "raw_voltage": 1.23}
    }
    """

    expected_token = os.getenv("ESP32_DEVICE_TOKEN", "")
    received_token = request.headers.get(
        "X-Device-Token", ""
    )

    if (
        not expected_token
        or not received_token
        or not hmac.compare_digest(
            expected_token,
            received_token
        )
    ):
        return Response(
            {"error": "Invalid device token."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    data = request.data

    if not isinstance(data, dict):
        return Response(
            {"error": "Expected a JSON object."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        device_id = int(data.get("device_id"))
    except (TypeError, ValueError):
        return Response(
            {"error": "A valid device_id is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        device = Device.objects.get(device_id=device_id)
    except Device.DoesNotExist:
        return Response(
            {"error": "Device not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    sensor_types = [
        "temperature",
        "turbidity",
        "pH",
        "DO",
    ]

    sensors = {
        sensor.type: sensor
        for sensor in Sensor.objects.filter(device=device)
    }

    missing_sensors = [
        sensor_type
        for sensor_type in sensor_types
        if sensor_type not in sensors
    ]

    if missing_sensors:
        return Response(
            {
                "error": "Missing sensor records.",
                "sensors": missing_sensors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    parsed_data = {}

    try:
        for sensor_type in sensor_types:
            parsed_data[sensor_type] = parse_sensor_data(
                data.get(sensor_type),
                sensor_type
            )
    except ValueError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST
        )

    saved_readings = []

    with transaction.atomic():
        for sensor_type in sensor_types:
            sensor = sensors[sensor_type]
            measurement = parsed_data[sensor_type]

            reading_status = "uncalibrated"
            value = measurement["value"]

            if sensor_type == "temperature":
                if (
                    sensor.min_threshold is not None
                    and sensor.max_threshold is not None
                ):
                    reading_status = "safe"

                    if (
                        value < sensor.min_threshold
                        or value > sensor.max_threshold
                    ):
                        reading_status = "unsafe"

            reading = Reading.objects.create(
                sensor=sensor,
                status=reading_status,
                **measurement
            )

            if reading_status == "unsafe":
                Alert.objects.create(
                    reading=reading,
                    message=(
                        f"Unsafe {sensor.get_type_display()} "
                        f"reading: {value} {sensor.unit}"
                    )
                )

            saved_readings.append({
                "reading_id": reading.reading_id,
                "sensor_type": sensor_type,
                "status": reading_status,
            })

    return Response(
        {
            "message": "Sensor readings saved successfully.",
            "device_id": device.device_id,
            "readings": saved_readings,
        },
        status=status.HTTP_201_CREATED
    )
