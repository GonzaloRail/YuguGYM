import re
import secrets
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import serializers
from api.models import Administrador, RecuperacionPassword


def validate_password_complexity(value):
    if len(value) < 8:
        raise serializers.ValidationError('La contraseña debe tener al menos 8 caracteres.')
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError('La contraseña debe contener al menos una letra mayúscula.')
    if not re.search(r'[a-z]', value):
        raise serializers.ValidationError('La contraseña debe contener al menos una letra minúscula.')
    if not re.search(r'[0-9]', value):
        raise serializers.ValidationError('La contraseña debe contener al menos un número.')
    return value


class RegisterAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password_complexity])
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Administrador
        fields = ('usuario', 'nombres', 'apellidos', 'correo', 'password', 'password_confirm')

    def validate_usuario(self, value):
        if len(value) < 3:
            raise serializers.ValidationError('El usuario debe tener al menos 3 caracteres.')
        if Administrador.objects.filter(usuario=value).exists():
            raise serializers.ValidationError('El nombre de usuario ya se encuentra registrado.')
        return value

    def validate_nombres(self, value):
        if not re.fullmatch(r'^[A-Za-zÀ-ÿ\s]+$', value):
            raise serializers.ValidationError('Solo se permiten letras y espacios.')
        return value

    def validate_apellidos(self, value):
        if not re.fullmatch(r'^[A-Za-zÀ-ÿ\s]+$', value):
            raise serializers.ValidationError('Solo se permiten letras y espacios.')
        return value

    def validate_correo(self, value):
        if Administrador.objects.filter(correo=value).exists():
            raise serializers.ValidationError('El correo electrónico ya se encuentra registrado.')
        return value

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class LoginSerializer(serializers.Serializer):
    correo = serializers.EmailField()
    password = serializers.CharField()


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8, validators=[validate_password_complexity])
    new_password_confirm = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not check_password(value, user.password):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Las contraseñas no coinciden.'})
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({'new_password': 'La nueva contraseña no puede ser igual a la actual.'})
        return data


class ForgotPasswordSerializer(serializers.Serializer):
    correo = serializers.EmailField()

    def validate_correo(self, value):
        if not Administrador.objects.filter(correo=value).exists():
            raise serializers.ValidationError('El correo no se encuentra registrado.')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, validators=[validate_password_complexity])
    new_password_confirm = serializers.CharField(min_length=8)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Las contraseñas no coinciden.'})
        return data
