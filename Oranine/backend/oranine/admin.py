from django.contrib import admin
from .models import FishFarmer, Pond, Device, Sensor, Reading, Alert


@admin.register(FishFarmer)
class FishFarmerAdmin(admin.ModelAdmin):
    list_display = ('farmer_id', 'name', 'email', 'contact_no')
    search_fields = ('name', 'email', 'contact_no')


@admin.register(Pond)
class PondAdmin(admin.ModelAdmin):
    list_display = (
        'pond_id',
        'pond_name',
        'farmer',
        'location',
        'size_sqm',
    )
    search_fields = ('pond_name', 'location')
    list_filter = ('farmer',)


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        'device_id',
        'pond',
        'arduino_id',
        'wifi_module',
        'status',
    )
    list_filter = ('status',)
    search_fields = ('arduino_id', 'wifi_module')


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = (
        'sensor_id',
        'device',
        'type',
        'min_threshold',
        'max_threshold',
        'unit',
    )
    list_filter = ('type',)


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = (
        'reading_id',
        'sensor',
        'value',
        'status',
        'recorded_at',
    )
    list_filter = ('status', 'sensor__type')
    search_fields = ('sensor__type',)
    ordering = ('-recorded_at',)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = (
        'alert_id',
        'reading',
        'message',
        'triggered_at',
        'resolved',
    )
    list_filter = ('resolved',)
    search_fields = ('message',)
    ordering = ('-triggered_at',)