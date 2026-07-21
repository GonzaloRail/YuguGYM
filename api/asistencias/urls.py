from django.urls import path
from . import views

urlpatterns = [
    path('registrar/', views.registrar_ingreso, name='asistencias-registrar'),
    path('historial/', views.historial_asistencia, name='asistencias-historial'),
]
