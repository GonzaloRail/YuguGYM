from django.urls import path
from . import views

urlpatterns = [
    path('registrar/', views.registrar_pago, name='pagos-registrar'),
    path('historial/', views.historial_pagos, name='pagos-historial'),
    path('dia/', views.pagos_dia, name='pagos-dia'),
    path('comprobante/<int:pago_id>/', views.generar_comprobante, name='pagos-comprobante'),
]
