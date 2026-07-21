import secrets
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.models import Administrador, RecuperacionPassword
from .serializers import (
    RegisterAdminSerializer, LoginSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    correo = serializer.validated_data['correo']
    password = serializer.validated_data['password']
    cache_key = f'login_attempts_{correo}'
    attempts = cache.get(cache_key, 0)

    if attempts >= 5:
        return Response(
            {'error': 'Demasiados intentos fallidos. Acceso bloqueado temporalmente. Intente nuevamente en 30 minutos.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    try:
        user = Administrador.objects.get(correo=correo, activo=True)
    except Administrador.DoesNotExist:
        cache.set(cache_key, attempts + 1, 1800)
        return Response({'error': 'Correo electrónico o contraseña incorrectos.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not check_password(password, user.password):
        attempts += 1
        cache.set(cache_key, attempts, 1800)
        if attempts >= 3:
            if attempts >= 5:
                return Response(
                    {'error': 'Demasiados intentos fallidos. Acceso bloqueado temporalmente. Intente nuevamente en 30 minutos.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            return Response(
                {'error': f'Ha realizado {attempts} intentos fallidos. Verifique sus credenciales.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response({'error': 'Correo electrónico o contraseña incorrectos.'}, status=status.HTTP_401_UNAUTHORIZED)

    cache.delete(cache_key)
    user.ultimo_acceso = timezone.now()
    user.save(update_fields=['ultimo_acceso'])

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'usuario': user.usuario,
            'nombres': user.nombres,
            'apellidos': user.apellidos,
            'correo': user.correo,
        }
    })


@api_view(['GET'])
def me_view(request):
    return Response({
        'user': {
            'id': request.user.id,
            'usuario': request.user.usuario,
            'nombres': request.user.nombres,
            'apellidos': request.user.apellidos,
            'correo': request.user.correo,
        }
    })


@api_view(['POST'])
def register_admin_view(request):
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    cache_key = f'register_attempts_{ip}'
    if cache.get(cache_key, 0) >= 5:
        return Response(
            {'error': 'Demasiados intentos de registro. Intente nuevamente más tarde.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    cache.set(cache_key, cache.get(cache_key, 0) + 1, 3600)

    serializer = RegisterAdminSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    admin = serializer.save()
    cache.delete(cache_key)
    return Response({
        'mensaje': 'Administrador registrado correctamente.',
        'admin': {'id': admin.id, 'usuario': admin.usuario, 'correo': admin.correo}
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def change_password_view(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    user = request.user
    user.password = make_password(serializer.validated_data['new_password'])
    user.save(update_fields=['password'])
    return Response({'mensaje': 'Contraseña actualizada correctamente. Por favor, inicie sesión nuevamente.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    correo = serializer.validated_data['correo']

    cache_key = f'forgot_pw_{correo}'
    attempts = cache.get(cache_key, 0)
    if attempts >= 3:
        return Response(
            {'error': 'Ha excedido el límite de solicitudes diarias. Intente nuevamente en 24 horas.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
    cache.set(cache_key, attempts + 1, 86400)

    admin = Administrador.objects.get(correo=correo)

    token = secrets.token_urlsafe(32)
    expiracion = timezone.now() + timedelta(minutes=15)

    RecuperacionPassword.objects.create(
        administrador=admin,
        token=token,
        fecha_expiracion=expiracion
    )

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html_content = render_to_string('email/reset_password.html', {
        'reset_link': reset_link,
        'year': timezone.now().year,
    })

    try:
        email = EmailMultiAlternatives(
            subject='Recuperación de Contraseña - YuguGYM',
            body=f'Haz clic en el siguiente enlace para restablecer tu contraseña:\n\n{reset_link}\n\nEste enlace expira en 15 minutos.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[correo],
        )
        email.attach_alternative(html_content, 'text/html')
        email.send(fail_silently=True)
    except Exception:
        pass

    return Response({'mensaje': 'Se ha enviado un enlace de restablecimiento a su correo electrónico.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        recovery = RecuperacionPassword.objects.get(
            token=serializer.validated_data['token'],
            utilizado=False,
            fecha_expiracion__gte=timezone.now()
        )
    except RecuperacionPassword.DoesNotExist:
        return Response({'error': 'El enlace de restablecimiento ha expirado o no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

    recovery.administrador.password = make_password(serializer.validated_data['new_password'])
    recovery.administrador.save(update_fields=['password'])
    recovery.utilizado = True
    recovery.save(update_fields=['utilizado'])

    return Response({'mensaje': 'Contraseña restablecida correctamente. Inicie sesión con su nueva contraseña.'})
