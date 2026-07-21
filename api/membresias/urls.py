from django.urls import path
from . import views

urlpatterns = [
    path('registrar/', views.registrar_membresia, name='membresias-registrar'),
    path('renovar/', views.renovar_membresia, name='membresias-renovar'),
    path('vencidas/', views.membresias_vencidas, name='membresias-vencidas'),
    path('proximas/', views.membresias_proximas, name='membresias-proximas'),
]
