import re
from datetime import date, timedelta
from rest_framework import serializers
from api.models import (
    Membresia, HistorialMembresias, Socio,
    TiposMembresia, EstadosMembresia, Administrador
)


class RegistrarMembresiaSerializer(serializers.Serializer):
    socio_dni = serializers.CharField(max_length=8)
    tipo_membresia_id = serializers.IntegerField()

    def validate_socio_dni(self, value):
        if not re.fullmatch(r'[0-9]{8}', value):
            raise serializers.ValidationError('El DNI debe tener exactamente 8 dígitos.')
        try:
            self.socio = Socio.objects.get(dni=value)
        except Socio.DoesNotExist:
            raise serializers.ValidationError('El socio no se encuentra registrado.')
        membresia_activa = self.socio.membresia_activa()
        if membresia_activa:
            raise serializers.ValidationError('El socio ya posee una membresía activa vigente.')
        return value

    def validate_tipo_membresia_id(self, value):
        try:
            self.tipo = TiposMembresia.objects.get(pk=value)
        except TiposMembresia.DoesNotExist:
            raise serializers.ValidationError('Seleccione un tipo de membresía válido.')
        return value

    def create(self, validated_data):
        socio = self.socio
        tipo = self.tipo
        estado_activa = EstadosMembresia.objects.get(nombre='Activa')
        fecha_inicio = date.today()
        fecha_vencimiento = fecha_inicio + timedelta(days=tipo.duracion_dias)

        membresia = Membresia.objects.create(
            socio=socio,
            tipo_membresia=tipo,
            estado=estado_activa,
            fecha_inicio=fecha_inicio,
            fecha_vencimiento=fecha_vencimiento
        )

        HistorialMembresias.objects.create(
            socio=socio,
            tipo_membresia=tipo,
            fecha_inicio=fecha_inicio,
            fecha_vencimiento=fecha_vencimiento,
            monto=tipo.precio,
            administrador_id=self.context['request'].user.id,
        )

        socio.estado = 'Activo'
        socio.save(update_fields=['estado'])

        return membresia


class RenovarMembresiaSerializer(serializers.Serializer):
    socio_dni = serializers.CharField(max_length=8)
    tipo_membresia_id = serializers.IntegerField()

    def validate_socio_dni(self, value):
        if not re.fullmatch(r'[0-9]{8}', value):
            raise serializers.ValidationError('El DNI debe tener exactamente 8 dígitos.')
        try:
            self.socio = Socio.objects.get(dni=value)
        except Socio.DoesNotExist:
            raise serializers.ValidationError('El socio no se encuentra registrado.')
        membresias = self.socio.membresias.all()
        if not membresias.exists():
            raise serializers.ValidationError('El socio no posee una membresía registrada para renovar.')
        self.membresia_actual = self.socio.membresia_activa()
        return value

    def validate_tipo_membresia_id(self, value):
        try:
            self.tipo = TiposMembresia.objects.get(pk=value)
        except TiposMembresia.DoesNotExist:
            raise serializers.ValidationError('Seleccione un tipo de membresía válido.')
        return value

    def create(self, validated_data):
        socio = self.socio
        tipo = self.tipo
        estado_activa = EstadosMembresia.objects.get(nombre='Activa')

        if self.membresia_actual:
            fecha_inicio = self.membresia_actual.fecha_vencimiento
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

        HistorialMembresias.objects.create(
            socio=socio,
            tipo_membresia=tipo,
            fecha_inicio=fecha_inicio,
            fecha_vencimiento=fecha_vencimiento,
            monto=tipo.precio,
            administrador_id=self.context['request'].user.id,
        )

        socio.estado = 'Activo'
        socio.save(update_fields=['estado'])

        return membresia
