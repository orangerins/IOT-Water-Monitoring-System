
from rest_framework import serializers

from .models import (
    FishFarmer,
    Pond,
    Device,
    Sensor,
    Reading,
    Alert,
)


# ============================================================
# FISH FARMER
# ============================================================

class FishFarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FishFarmer
        fields = '__all__'


# ============================================================
# POND
# ============================================================

class PondSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pond
        fields = '__all__'


# ============================================================
# DEVICE
# ============================================================

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'


# ============================================================
# SENSOR
# ============================================================

class SensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sensor
        fields = '__all__'


# ============================================================
# READING
# ============================================================

class ReadingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Reading
        fields = '__all__'

        read_only_fields = [
            'reading_id',
            'status',
            'recorded_at',
        ]

    def validate(self, attrs):
        sensor = attrs.get(
            'sensor',
            getattr(self.instance, 'sensor', None)
        )

        value = attrs.get(
            'value',
            getattr(self.instance, 'value', None)
        )

        raw_adc = attrs.get(
            'raw_adc',
            getattr(self.instance, 'raw_adc', None)
        )

        raw_voltage = attrs.get(
            'raw_voltage',
            getattr(self.instance, 'raw_voltage', None)
        )

        if value is None and raw_adc is None and raw_voltage is None:
            raise serializers.ValidationError(
                'Provide a calibrated value or a raw sensor reading.'
            )

        if raw_adc is not None and raw_adc > 1023:
            raise serializers.ValidationError({
                'raw_adc': 'Arduino UNO ADC must be between 0 and 1023.'
            })

        if raw_voltage is not None and raw_voltage > 5:
            raise serializers.ValidationError({
                'raw_voltage': 'Voltage cannot exceed 5 V.'
            })

        # During hardware integration, only temperature
        # is accepted as a physical measurement.
        # pH, DO and turbidity must remain uncalibrated.
        if (
            sensor is not None
            and sensor.type in ('pH', 'DO', 'turbidity')
            and value is not None
        ):
            raise serializers.ValidationError({
                'value': (
                    'This sensor is not calibrated yet. '
                    'Send raw_adc and raw_voltage instead.'
                )
            })

        return attrs

    def create(self, validated_data):
        sensor = validated_data['sensor']
        value = validated_data.get('value')

        # Raw readings are never classified as safe or unsafe.
        status = 'uncalibrated'

        # Only temperature values can currently be evaluated.
        if sensor.type == 'temperature' and value is not None:

            # No thresholds means no safe/unsafe decision.
            if (
                sensor.min_threshold is not None
                and sensor.max_threshold is not None
            ):
                status = 'safe'

                if (
                    value < sensor.min_threshold
                    or value > sensor.max_threshold
                ):
                    status = 'unsafe'

        reading = Reading.objects.create(
            status=status,
            **validated_data
        )

        if status == 'unsafe':
            Alert.objects.create(
                reading=reading,
                message=(
                    f"Unsafe {sensor.get_type_display()} reading: "
                    f"{value} {sensor.unit}"
                )
            )

        return reading

    def update(self, instance, validated_data):
        # Preserve historical reading values and classifications.
        # Readings are append-only during hardware integration.
        raise serializers.ValidationError(
            'Existing sensor readings cannot be edited.'
        )


# ============================================================
# ALERT
# ============================================================

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'
