import re
from datetime import date
from rest_framework import serializers
from api.models import Socio, Membresia, Pago, Asistencia


class SocioListSerializer(serializers.ModelSerializer):
    estado_membresia = serializers.SerializerMethodField()

    class Meta:
        model = Socio
        fields = ('id', 'dni', 'nombres', 'apellidos', 'telefono', 'estado', 'estado_membresia')

    def get_estado_membresia(self, obj):
        membresia = obj.membresia_activa()
        if membresia:
            return f"Activa - {membresia.tipo_membresia.nombre} (hasta {membresia.fecha_vencimiento})"
        return "Sin membresía activa"


class SocioDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Socio
        fields = '__all__'
        read_only_fields = ('fecha_inscripcion',)


class SocioCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Socio
        fields = ('dni', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo',
                  'telefono', 'direccion', 'correo', 'estado')
        read_only_fields = ('fecha_inscripcion',)

    def validate_dni(self, value):
        if not re.fullmatch(r'[0-9]{8}', value):
            raise serializers.ValidationError('El DNI debe tener exactamente 8 dígitos.')
        if Socio.objects.filter(dni=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError('El DNI ya se encuentra registrado.')
        return value

    def validate_nombres(self, value):
        if not re.fullmatch(r'^[A-Za-zÀ-ÿ\s]+$', value):
            raise serializers.ValidationError('Solo se permiten letras y espacios.')
        return value

    def validate_apellidos(self, value):
        if not re.fullmatch(r'^[A-Za-zÀ-ÿ\s]+$', value):
            raise serializers.ValidationError('Solo se permiten letras y espacios.')
        return value

    def validate_telefono(self, value):
        if value and not re.fullmatch(r'[0-9]{9}', value):
            raise serializers.ValidationError('El teléfono debe tener exactamente 9 dígitos.')
        return value

    def validate_fecha_nacimiento(self, value):
        hoy = date.today()
        if value and value > hoy:
            raise serializers.ValidationError('La fecha de nacimiento no puede ser en el futuro.')
        if value and value < date(1900, 1, 1):
            raise serializers.ValidationError('La fecha de nacimiento no puede ser anterior a 1900.')
        return value

    def validate_correo(self, value):
        if value and Socio.objects.filter(correo=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError('El correo ya está registrado.')
        return value


class FichaSocioSerializer(serializers.ModelSerializer):
    membresia_actual = serializers.SerializerMethodField()
    ultimo_pago = serializers.SerializerMethodField()
    historial_asistencia = serializers.SerializerMethodField()

    class Meta:
        model = Socio
        fields = ('id', 'dni', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo',
                  'telefono', 'direccion', 'correo', 'fecha_inscripcion', 'estado',
                  'membresia_actual', 'ultimo_pago', 'historial_asistencia')

    def get_membresia_actual(self, obj):
        membresia = obj.membresia_activa()
        if not membresia:
            return None
        from datetime import date
        dias_restantes = (membresia.fecha_vencimiento - date.today()).days if membresia.fecha_vencimiento >= date.today() else 0
        return {
            'tipo': membresia.tipo_membresia.nombre,
            'fecha_inicio': membresia.fecha_inicio,
            'fecha_vencimiento': membresia.fecha_vencimiento,
            'dias_restantes': max(0, dias_restantes),
            'estado': membresia.estado.nombre,
        }

    def get_ultimo_pago(self, obj):
        pago = obj.ultimo_pago()
        if not pago:
            return None
        return {
            'id': pago.id,
            'fecha': pago.fecha_pago,
            'monto': float(pago.monto),
            'metodo': pago.metodo_pago.nombre,
            'comprobante': pago.numero_comprobante,
        }

    def get_historial_asistencia(self, obj):
        asistencias = obj.asistencias.all()[:20]
        return [{'fecha': a.fecha, 'hora': a.hora} for a in asistencias]
