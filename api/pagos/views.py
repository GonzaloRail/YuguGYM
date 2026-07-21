from datetime import date
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Q

from api.models import Pago, Socio
from api.permissions import IsAdminUser
from .serializers import RegistrarPagoSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def registrar_pago(request):
    serializer = RegistrarPagoSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    pago = serializer.save()
    return Response({
        'mensaje': 'Pago registrado correctamente.',
        'pago': {
            'id': pago.id,
            'socio_dni': pago.socio.dni,
            'monto': float(pago.monto),
            'metodo': pago.metodo_pago.nombre,
            'fecha': pago.fecha_pago,
            'comprobante': pago.numero_comprobante,
            'tipo_membresia': pago.membresia.tipo_membresia.nombre if pago.membresia else None,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def historial_pagos(request):
    dni = request.query_params.get('dni')
    nombre = request.query_params.get('nombre')
    apellido = request.query_params.get('apellido')
    fecha_inicio = request.query_params.get('fecha_inicio')
    fecha_fin = request.query_params.get('fecha_fin')

    limit_raw = request.query_params.get('limit', 200)
    try:
        limit = int(limit_raw)
        limit = max(1, min(limit, 1000))
    except (ValueError, TypeError):
        limit = 200
    pagos = Pago.objects.select_related('socio', 'metodo_pago', 'membresia__tipo_membresia').order_by('-fecha_pago')

    socios = Socio.objects.all()
    if dni:
        socios = socios.filter(dni=dni)
    if nombre:
        socios = socios.filter(nombres__icontains=nombre)
    if apellido:
        socios = socios.filter(apellidos__icontains=apellido)
    if dni or nombre or apellido:
        pagos = pagos.filter(socio__in=socios)

    if fecha_inicio:
        pagos = pagos.filter(fecha_pago__date__gte=fecha_inicio)
    if fecha_fin:
        pagos = pagos.filter(fecha_pago__date__lte=fecha_fin)

    pagos = pagos[:limit]

    data = []
    for p in pagos:
        data.append({
            'id': p.id,
            'socio_dni': p.socio.dni,
            'socio_nombres': p.socio.nombres,
            'socio_apellidos': p.socio.apellidos,
            'fecha': p.fecha_pago,
            'monto': float(p.monto),
            'tipo_membresia': p.membresia.tipo_membresia.nombre if p.membresia else '-',
            'metodo': p.metodo_pago.nombre,
            'comprobante': p.numero_comprobante,
        })

    total = sum(p.monto for p in pagos)
    return Response({
        'historial': data,
        'total_pagos': len(data),
        'monto_total': float(total),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pagos_dia(request):
    hoy = date.today()
    pagos = Pago.objects.filter(fecha_pago__date=hoy).select_related('socio', 'metodo_pago', 'membresia__tipo_membresia')

    data = []
    totales = {'Efectivo': Decimal('0'), 'Yape': Decimal('0'), 'Transferencia': Decimal('0')}
    for p in pagos:
        data.append({
            'id': p.id,
            'socio_dni': p.socio.dni,
            'socio_nombres': p.socio.nombres,
            'socio_apellidos': p.socio.apellidos,
            'fecha': p.fecha_pago,
            'monto': float(p.monto),
            'tipo_membresia': p.membresia.tipo_membresia.nombre if p.membresia else '-',
            'metodo': p.metodo_pago.nombre,
            'comprobante': p.numero_comprobante,
        })
        metodo_nombre = p.metodo_pago.nombre
        if metodo_nombre in totales:
            totales[metodo_nombre] += p.monto

    return Response({
        'pagos': data,
        'cantidad': len(data),
        'total_general': float(sum(totales.values())),
        'desglose': {k: float(v) for k, v in totales.items()},
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def generar_comprobante(request, pago_id):
    try:
        pago = Pago.objects.select_related('socio', 'metodo_pago', 'membresia__tipo_membresia').get(pk=pago_id)
    except Pago.DoesNotExist:
        return Response({'error': 'El pago no se encuentra registrado.'}, status=status.HTTP_404_NOT_FOUND)

    from datetime import date
    data = {
        'numero_comprobante': pago.numero_comprobante,
        'fecha_emision': date.today(),
        'socio_dni': pago.socio.dni,
        'socio_nombres': pago.socio.nombres,
        'socio_apellidos': pago.socio.apellidos,
        'fecha_pago': pago.fecha_pago,
        'monto': float(pago.monto),
        'tipo_membresia': pago.membresia.tipo_membresia.nombre if pago.membresia else '-',
        'metodo_pago': pago.metodo_pago.nombre,
        'vigencia': pago.membresia.fecha_vencimiento if pago.membresia else None,
        'estado': 'Pagado',
    }
    return Response(data)
