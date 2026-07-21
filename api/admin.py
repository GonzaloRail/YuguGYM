from django.contrib import admin
from .models import (
    Administrador, Gimnasio, Socio, TiposMembresia, EstadosMembresia,
    Membresia, HistorialMembresias, MetodosPago, Pago, Asistencia, RecuperacionPassword
)

@admin.register(Administrador)
class AdministradorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'nombres', 'apellidos', 'correo', 'activo', 'ultimo_acceso')
    search_fields = ('usuario', 'nombres', 'apellidos', 'correo')

@admin.register(Gimnasio)
class GimnasioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ruc', 'telefono', 'correo')

@admin.register(Socio)
class SocioAdmin(admin.ModelAdmin):
    list_display = ('dni', 'nombres', 'apellidos', 'estado', 'fecha_inscripcion')
    search_fields = ('dni', 'nombres', 'apellidos')
    list_filter = ('estado', 'sexo')

@admin.register(TiposMembresia)
class TiposMembresiaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'duracion_dias', 'precio')

@admin.register(EstadosMembresia)
class EstadosMembresiaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)

@admin.register(Membresia)
class MembresiaAdmin(admin.ModelAdmin):
    list_display = ('socio', 'tipo_membresia', 'estado', 'fecha_inicio', 'fecha_vencimiento')
    list_filter = ('estado', 'tipo_membresia')

@admin.register(HistorialMembresias)
class HistorialMembresiasAdmin(admin.ModelAdmin):
    list_display = ('socio', 'tipo_membresia', 'fecha_inicio', 'fecha_vencimiento', 'monto')

@admin.register(MetodosPago)
class MetodosPagoAdmin(admin.ModelAdmin):
    list_display = ('nombre',)

@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ('id', 'socio', 'monto', 'metodo_pago', 'fecha_pago', 'numero_comprobante')
    list_filter = ('metodo_pago',)

@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('socio', 'fecha', 'hora')
    list_filter = ('fecha',)

@admin.register(RecuperacionPassword)
class RecuperacionPasswordAdmin(admin.ModelAdmin):
    list_display = ('administrador', 'fecha_generacion', 'fecha_expiracion', 'utilizado')
