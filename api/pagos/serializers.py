import re
from datetime import date, timedelta
from rest_framework import serializers
from django.db import transaction
from api.models import Pago, Socio, Membresia, TiposMembresia, MetodosPago, EstadosMembresia, HistorialMembresias


class RegistrarPagoSerializer(serializers.Serializer):
    socio_dni = serializers.CharField(max_length=8)
    tipo_membresia_id = serializers.IntegerField()
    metodo_pago_id = serializers.IntegerField()

    def validate_socio_dni(self, value):
        if not re.fullmatch(r'[0-9]{8}', value):
            raise serializers.ValidationError('El DNI debe tener exactamente 8 dígitos.')
        try:
            self.socio = Socio.objects.get(dni=value)
        except Socio.DoesNotExist:
            raise serializers.ValidationError('El socio no se encuentra registrado.')
        return value

    def validate_tipo_membresia_id(self, value):
        try:
            self.tipo = TiposMembresia.objects.get(pk=value)
        except TiposMembresia.DoesNotExist:
            raise serializers.ValidationError('Seleccione un tipo de membresía válido.')
        return value

    def validate_metodo_pago_id(self, value):
        try:
            self.metodo = MetodosPago.objects.get(pk=value)
        except MetodosPago.DoesNotExist:
            raise serializers.ValidationError('Seleccione un método de pago válido.')
        return value

    def create(self, validated_data):
        with transaction.atomic():
            socio = self.socio
            tipo = self.tipo
            metodo = self.metodo
            admin = self.context['request'].user
            estado_activa = EstadosMembresia.objects.get(nombre='Activa')

            membresia_activa = socio.membresia_activa()
            if membresia_activa:
                fecha_inicio = membresia_activa.fecha_vencimiento
            else:
                fecha_inicio = date.today()

            fecha_vencimiento = fecha_inicio + timedelta(days=tipo.duracion_dias)

            membresia = Membresia.objects.create(
                socio=socio,
                tipo_membresia=tipo,
                estado=estado_activa,
                fecha_inicio=fecha_inicio,
                fecha_vencimiento=fecha_vencimiento
            )

            pago = Pago.objects.create(
                socio=socio,
                membresia=membresia,
                metodo_pago=metodo,
                administrador=admin,
                monto=tipo.precio,
            )

            comprobante = f"CP-{socio.dni}-{date.today().strftime('%Y%m%d')}-{pago.pk}"
            pago.numero_comprobante = comprobante
            pago.save(update_fields=['numero_comprobante'])

            HistorialMembresias.objects.create(
                socio=socio,
                tipo_membresia=tipo,
                fecha_inicio=fecha_inicio,
                fecha_vencimiento=fecha_vencimiento,
                monto=tipo.precio,
                administrador=admin,
            )

            socio.estado = 'Activo'
            socio.save(update_fields=['estado'])

            return pago
