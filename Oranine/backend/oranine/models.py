
from django.conf import settings
from django.db import models


# ============================================================
# FISH FARMER
# ============================================================

class FishFarmer(models.Model):
    farmer_id = models.AutoField(primary_key=True)

    # Connect each farmer to a Django login account.
    # Nullable so existing farmer records remain valid.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='fish_farmer',
        blank=True,
        null=True
    )

    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=50, unique=True)
    contact_no = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.name


# ============================================================
# POND
# ============================================================

class Pond(models.Model):
    pond_id = models.AutoField(primary_key=True)

    farmer = models.ForeignKey(
        FishFarmer,
        on_delete=models.CASCADE,
        related_name='ponds'
    )

    pond_name = models.CharField(max_length=50)
    location = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    size_sqm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.pond_name


# ============================================================
# DEVICE
# ============================================================

class Device(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('offline', 'Offline'),
    ]

    device_id = models.AutoField(primary_key=True)

    pond = models.ForeignKey(
        Pond,
        on_delete=models.CASCADE,
        related_name='devices'
    )

    arduino_id = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    wifi_module = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='offline'
    )

    def __str__(self):
        return (
            f"Device {self.device_id} - "
            f"{self.pond.pond_name}"
        )


# ============================================================
# SENSOR
# ============================================================

class Sensor(models.Model):

    SENSOR_TYPES = [
        ('DO', 'Dissolved Oxygen'),
        ('pH', 'pH'),
        ('temperature', 'Water Temperature'),
        ('turbidity', 'Turbidity'),
    ]

    sensor_id = models.AutoField(primary_key=True)

    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='sensors'
    )

    type = models.CharField(
        max_length=20,
        choices=SENSOR_TYPES
    )

    min_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    max_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    unit = models.CharField(max_length=10)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['device', 'type'],
                name='unique_sensor_type_per_device'
            )
        ]

    def __str__(self):
        return (
            f"{self.get_type_display()} - "
            f"Device {self.device.device_id}"
        )


# ============================================================
# READING
# ============================================================

class Reading(models.Model):

    STATUS_CHOICES = [
        ('safe', 'Safe'),
        ('unsafe', 'Unsafe'),
        ('uncalibrated', 'Uncalibrated'),
    ]

    reading_id = models.AutoField(primary_key=True)

    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name='readings'
    )

    # Calibrated measurement, if available.
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    # Original analog reading from Arduino UNO.
    raw_adc = models.PositiveSmallIntegerField(
        blank=True,
        null=True
    )

    # Voltage reported by Arduino UNO.
    raw_voltage = models.DecimalField(
        max_digits=7,
        decimal_places=4,
        blank=True,
        null=True
    )

    recorded_at = models.DateTimeField(
        auto_now_add=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='uncalibrated'
    )

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        if self.value is not None:
            return (
                f"{self.sensor.get_type_display()}: "
                f"{self.value} {self.sensor.unit}"
            )

        return (
            f"{self.sensor.get_type_display()}: "
            f"Raw ADC={self.raw_adc}, "
            f"Voltage={self.raw_voltage} V"
        )


# ============================================================
# ALERT
# ============================================================

class Alert(models.Model):

    alert_id = models.AutoField(primary_key=True)

    reading = models.ForeignKey(
        Reading,
        on_delete=models.CASCADE,
        related_name='alerts'
    )

    message = models.CharField(max_length=100)

    triggered_at = models.DateTimeField(
        auto_now_add=True
    )

    resolved = models.BooleanField(
        default=False
    )

    def __str__(self):
        return (
            f"Alert {self.alert_id}: "
            f"{self.message}"
        )
