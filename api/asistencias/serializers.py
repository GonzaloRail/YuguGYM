import re
from rest_framework import serializers
from api.models import Asistencia, Socio


class RegistrarIngresoSerializer(serializers.Serializer):
    socio_dni = serializers.CharField(max_length=8, required=False, allow_blank=True)
    socio_codigo = serializers.CharField(max_length=10, required=False, allow_blank=True)

    def validate(self, data):
        dni = data.get('socio_dni', '')
        codigo = data.get('socio_codigo', '')
        if not dni and not codigo:
            raise serializers.ValidationError('Debe ingresar DNI o código del socio.')

        if dni:
            if not re.fullmatch(r'[0-9]{8}', dni):
                raise serializers.ValidationError({'socio_dni': 'El DNI debe tener exactamente 8 dígitos.'})
            try:
                self.socio = Socio.objects.get(dni=dni)
            except Socio.DoesNotExist:
                raise serializers.ValidationError({'socio_dni': 'El socio no se encuentra registrado.'})
        else:
            raise serializers.ValidationError('Código de socio no implementado. Use DNI.')

        membresia = self.socio.membresia_activa()
        if not membresia:
            raise serializers.ValidationError('La membresía del socio se encuentra vencida.')

        return data
