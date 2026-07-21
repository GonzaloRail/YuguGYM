from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate

from api.models import Socio, Membresia, Pago, Asistencia
from api.permissions import IsAdminUser


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reporte_socios_activos(request):
    hoy = date.today()
    membresias = Membresia.objects.filter(
        fecha_vencimiento__gte=hoy,
        estado__nombre='Activa'
    ).select_related('socio', 'tipo_membresia').order_by('socio__apellidos', 'socio__nombres')

    data = []
    for m in membresias:
        dias_restantes = (m.fecha_vencimiento - hoy).days
        data.append({
            'dni': m.socio.dni,
            'nombres': m.socio.nombres,
            'apellidos': m.socio.apellidos,
            'telefono': m.socio.telefono,
            'tipo_membresia': m.tipo_membresia.nombre,
            'fecha_vencimiento': m.fecha_vencimiento,
            'dias_restantes': dias_restantes,
        })

    return Response({
        'total_socios_activos': len(data),
        'fecha_generacion': hoy,
        'socios': data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reporte_ingresos(request):
    periodo = request.query_params.get('periodo', 'diario')  # diario, semanal, mensual
    fecha_str = request.query_params.get('fecha', str(date.today()))

    try:
        fecha_base = date.fromisoformat(fecha_str)
    except ValueError:
        return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    if periodo == 'diario':
        fecha_inicio = fecha_base
        fecha_fin = fecha_base
    elif periodo == 'semanal':
        fecha_inicio = fecha_base - timedelta(days=fecha_base.weekday())
        fecha_fin = fecha_inicio + timedelta(days=6)
    elif periodo == 'mensual':
        fecha_inicio = fecha_base.replace(day=1)
        if fecha_base.month == 12:
            fecha_fin = fecha_base.replace(year=fecha_base.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            fecha_fin = fecha_base.replace(month=fecha_base.month + 1, day=1) - timedelta(days=1)
    else:
        return Response({'error': 'Período inválido. Use: diario, semanal, mensual.'}, status=status.HTTP_400_BAD_REQUEST)

    pagos = Pago.objects.filter(
        fecha_pago__date__gte=fecha_inicio,
        fecha_pago__date__lte=fecha_fin
    ).select_related('socio', 'metodo_pago')

    total = Decimal('0')
    detalles = []
    desglose = {}
    por_dia = defaultdict(Decimal)
    for p in pagos:
        total += p.monto
        metodo = p.metodo_pago.nombre
        desglose[metodo] = desglose.get(metodo, Decimal('0')) + p.monto
        por_dia[p.fecha_pago.date()] += p.monto
        detalles.append({
            'id': p.id,
            'socio_dni': p.socio.dni,
            'socio_nombres': p.socio.nombres,
            'socio_apellidos': p.socio.apellidos,
            'fecha': p.fecha_pago,
            'monto': float(p.monto),
            'metodo': metodo,
        })

    detalle_por_dia = sorted(
        [{'fecha': str(k), 'monto': float(v)} for k, v in por_dia.items()],
        key=lambda x: x['fecha']
    )

    return Response({
        'periodo': periodo,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'total_ingresos': float(total),
        'cantidad_pagos': len(detalles),
        'desglose': {k: float(v) for k, v in desglose.items()},
        'detalle_por_dia': detalle_por_dia,
        'pagos': detalles,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def reporte_asistencia(request):
    fecha_str = request.query_params.get('fecha', str(date.today()))
    fecha_inicio_str = request.query_params.get('fecha_inicio')
    fecha_fin_str = request.query_params.get('fecha_fin')
    top_n_raw = request.query_params.get('top_n', 10)
    try:
        top_n = max(1, min(int(top_n_raw), 100))
    except (ValueError, TypeError):
        top_n = 10

    try:
        fecha = date.fromisoformat(fecha_str)
    except ValueError:
        return Response({'error': 'Formato de fecha inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    ingresos_diarios = Asistencia.objects.filter(fecha=fecha).count()

    if fecha_inicio_str and fecha_fin_str:
        try:
            fi = date.fromisoformat(fecha_inicio_str)
            ff = date.fromisoformat(fecha_fin_str)
        except ValueError:
            return Response({'error': 'Formato de fecha inválido.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        fi = fecha - timedelta(days=30)
        ff = fecha

    top_socios = (
        Asistencia.objects.filter(fecha__gte=fi, fecha__lte=ff)
        .values('socio__dni', 'socio__nombres', 'socio__apellidos')
        .annotate(total=Count('id'))
        .order_by('-total')[:top_n]
    )

    return Response({
        'fecha_consulta': fecha,
        'ingresos_diarios': ingresos_diarios,
        'top_socios': list(top_socios),
        'rango_fechas': {'inicio': fi, 'fin': ff},
    })
