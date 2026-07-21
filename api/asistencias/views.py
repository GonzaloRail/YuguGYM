from datetime import date
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Asistencia, Socio
from api.permissions import IsAdminUser
from .serializers import RegistrarIngresoSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def registrar_ingreso(request):
    serializer = RegistrarIngresoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    socio = serializer.socio
    asistencia = Asistencia.objects.create(
        socio=socio,
        administrador=request.user,
    )

    return Response({
        'mensaje': f'Ingreso registrado correctamente el {asistencia.fecha} a las {asistencia.hora}.',
        'asistencia': {
            'id': asistencia.id,
            'socio_dni': socio.dni,
            'socio_nombres': socio.nombres,
            'socio_apellidos': socio.apellidos,
            'fecha': asistencia.fecha,
            'hora': asistencia.hora,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def historial_asistencia(request):
    dni = request.query_params.get('dni')
    nombre = request.query_params.get('nombre')
    apellido = request.query_params.get('apellido')
    fecha_inicio = request.query_params.get('fecha_inicio')
    fecha_fin = request.query_params.get('fecha_fin')

    asistencias = Asistencia.objects.select_related('socio').order_by('-fecha', '-hora')

    socios = Socio.objects.all()
    if dni:
        socios = socios.filter(dni=dni)
    if nombre:
        socios = socios.filter(nombres__icontains=nombre)
    if apellido:
        socios = socios.filter(apellidos__icontains=apellido)
    if dni or nombre or apellido:
        asistencias = asistencias.filter(socio__in=socios)

    if fecha_inicio:
        asistencias = asistencias.filter(fecha__gte=fecha_inicio)
    if fecha_fin:
        asistencias = asistencias.filter(fecha__lte=fecha_fin)

    data = []
    for a in asistencias:
        data.append({
            'id': a.id,
            'socio_dni': a.socio.dni,
            'socio_nombres': a.socio.nombres,
            'socio_apellidos': a.socio.apellidos,
            'fecha': a.fecha,
            'hora': a.hora,
        })

    return Response({
        'historial': data,
        'total_asistencias': len(data),
    })
