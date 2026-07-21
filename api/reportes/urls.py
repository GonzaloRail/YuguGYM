from django.urls import path
from . import views

urlpatterns = [
    path('socios-activos/', views.reporte_socios_activos, name='reportes-socios-activos'),
    path('ingresos/', views.reporte_ingresos, name='reportes-ingresos'),
    path('asistencia/', views.reporte_asistencia, name='reportes-asistencia'),
]
