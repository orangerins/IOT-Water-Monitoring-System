from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),

    # Oranine REST API
    path('api/', include('oranine.urls')),
]