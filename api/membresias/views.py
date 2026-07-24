from datetime import date, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import F, Q, OuterRef, Subquery

from api.models import Membresia, Socio
from api.permissions import IsAdminUser
from .serializers import RegistrarMembresiaSerializer, RenovarMembresiaSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def registrar_membresia(request):
    serializer = RegistrarMembresiaSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    membresia = serializer.save()
    return Response({
        'mensaje': 'Membresía registrada correctamente.',
        'membresia': {
            'id': membresia.id,
            'socio_dni': membresia.socio.dni,
            'tipo': membresia.tipo_membresia.nombre,
            'fecha_inicio': membresia.fecha_inicio,
            'fecha_vencimiento': membresia.fecha_vencimiento,
            'monto': float(membresia.tipo_membresia.precio),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def renovar_membresia(request):
    serializer = RenovarMembresiaSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    membresia = serializer.save()
    return Response({
        'mensaje': 'Membresía renovada correctamente.',
        'membresia': {
            'id': membresia.id,
            'socio_dni': membresia.socio.dni,
            'tipo': membresia.tipo_membresia.nombre,
            'fecha_inicio': membresia.fecha_inicio,
            'fecha_vencimiento': membresia.fecha_vencimiento,
            'monto': float(membresia.tipo_membresia.precio),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def membresias_vencidas(request):
    membresias = Membresia.objects.filter(
        estado__nombre='Vencida'
    ).select_related('socio', 'tipo_membresia').order_by('fecha_vencimiento')

    data = []
    for m in membresias:
        dias_retraso = (date.today() - m.fecha_vencimiento).days
        data.append({
            'socio_dni': m.socio.dni,
            'nombres': m.socio.nombres,
            'apellidos': m.socio.apellidos,
            'telefono': m.socio.telefono,
            'tipo': m.tipo_membresia.nombre,
            'fecha_vencimiento': m.fecha_vencimiento,
            'dias_retraso': dias_retraso,
        })

    return Response({'total': len(data), 'membresias': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def membresias_proximas(request):
    hoy = date.today()
    limite = hoy + timedelta(days=7)
    membresias = Membresia.objects.filter(
        fecha_vencimiento__gte=hoy,
        fecha_vencimiento__lte=limite,
        estado__nombre='Activa'
    ).select_related('socio', 'tipo_membresia').order_by('fecha_vencimiento')

    data = []
    for m in membresias:
        dias_restantes = (m.fecha_vencimiento - hoy).days
        data.append({
            'socio_dni': m.socio.dni,
            'nombres': m.socio.nombres,
            'apellidos': m.socio.apellidos,
            'telefono': m.socio.telefono,
            'tipo': m.tipo_membresia.nombre,
            'fecha_vencimiento': m.fecha_vencimiento,
            'dias_restantes': dias_restantes,
        })

    return Response({'total': len(data), 'membresias': data})
