from datetime import date, timedelta
from decimal import Decimal
from collections import defaultdict
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.conf import settings
from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Pago, Membresia, Asistencia, Gimnasio
from api.permissions import IsAdminUser


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def descargar_comprobante(request, pago_id):
    try:
        pago = Pago.objects.select_related('socio', 'metodo_pago', 'membresia__tipo_membresia').get(pk=pago_id)
    except Pago.DoesNotExist:
        return Response({'error': 'Pago no encontrado.'}, status=404)

    gimnasio = Gimnasio.objects.first()

    context = {
        'gimnasio': gimnasio or {'nombre': 'YuguGYM', 'ruc': '', 'direccion': '', 'telefono': '', 'correo': ''},
        'comprobante': {
            'numero': pago.numero_comprobante or f'CP-{pago.id:05d}',
            'fecha_emision': pago.fecha_pago.strftime('%d/%m/%Y'),
        },
        'socio': {
            'dni': pago.socio.dni,
            'nombres': pago.socio.nombres,
            'apellidos': pago.socio.apellidos,
        },
        'pago': {
            'fecha': pago.fecha_pago.strftime('%d/%m/%Y %H:%M'),
            'monto': f'{pago.monto:.2f}',
            'tipo_membresia': pago.membresia.tipo_membresia.nombre if pago.membresia else '-',
            'metodo': pago.metodo_pago.nombre,
            'vigencia': pago.membresia.fecha_vencimiento.strftime('%d/%m/%Y') if pago.membresia else '-',
        },
    }

    html = render_to_string('pdf/comprobante.html', context)

    try:
        from weasyprint import HTML
        pdf = HTML(string=html).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="comprobante-{pago.socio.dni}.pdf"'
        return response
    except Exception:
        return Response({'comprobante': context}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def descargar_reporte_activos(request):
    hoy = date.today()
    membresias = Membresia.objects.filter(
        fecha_vencimiento__gte=hoy,
        estado__nombre='Activa'
    ).select_related('socio', 'tipo_membresia').order_by('socio__apellidos', 'socio__nombres')

    socios = []
    for m in membresias:
        socios.append({
            'dni': m.socio.dni,
            'nombres': m.socio.nombres,
            'apellidos': m.socio.apellidos,
            'telefono': m.socio.telefono,
            'tipo_membresia': m.tipo_membresia.nombre,
            'fecha_vencimiento': m.fecha_vencimiento.strftime('%d/%m/%Y'),
            'dias_restantes': (m.fecha_vencimiento - hoy).days,
        })

    gimnasio = Gimnasio.objects.first()
    context = {
        'gimnasio': gimnasio or {'nombre': 'YuguGYM', 'ruc': '', 'direccion': '', 'telefono': '', 'correo': ''},
        'total': len(socios),
        'fecha': hoy.strftime('%d/%m/%Y'),
        'socios': socios,
    }

    html = render_to_string('pdf/reporte_activos.html', context)
    try:
        from weasyprint import HTML
        pdf = HTML(string=html).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte-socios-activos.pdf"'
        return response
    except Exception:
        return Response({'error': 'No se pudo generar el PDF.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def descargar_reporte_ingresos(request):
    periodo = request.query_params.get('periodo', 'diario')
    fecha_str = request.query_params.get('fecha', str(date.today()))

    try:
        fecha_base = date.fromisoformat(fecha_str)
    except ValueError:
        return Response({'error': 'Formato de fecha inválido.'}, status=400)

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
        return Response({'error': 'Período inválido.'}, status=400)

    pagos_qs = Pago.objects.filter(
        fecha_pago__date__gte=fecha_inicio,
        fecha_pago__date__lte=fecha_fin
    ).select_related('socio', 'metodo_pago')

    total = Decimal('0')
    pagos = []
    desglose = defaultdict(Decimal)
    for p in pagos_qs:
        total += p.monto
        metodo = p.metodo_pago.nombre
        desglose[metodo] += p.monto
        pagos.append({
            'fecha': p.fecha_pago.strftime('%d/%m/%Y %H:%M'),
            'dni': p.socio.dni,
            'nombres': p.socio.nombres,
            'apellidos': p.socio.apellidos,
            'monto': f'{p.monto:.2f}',
            'metodo': metodo,
        })

    gimnasio = Gimnasio.objects.first()
    periodos = {'diario': 'Diario', 'semanal': 'Semanal', 'mensual': 'Mensual'}
    context = {
        'gimnasio': gimnasio or {'nombre': 'YuguGYM', 'ruc': '', 'direccion': '', 'telefono': '', 'correo': ''},
        'periodo': periodos.get(periodo, periodo),
        'fecha_inicio': fecha_inicio.strftime('%d/%m/%Y'),
        'fecha_fin': fecha_fin.strftime('%d/%m/%Y'),
        'total': f'{total:.2f}',
        'cantidad': len(pagos),
        'desglose': {k: f'{v:.2f}' for k, v in sorted(desglose.items())},
        'pagos': pagos,
        'fecha': date.today().strftime('%d/%m/%Y'),
    }

    html = render_to_string('pdf/reporte_ingresos.html', context)
    try:
        from weasyprint import HTML
        pdf = HTML(string=html).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte-ingresos.pdf"'
        return response
    except Exception:
        return Response({'error': 'No se pudo generar el PDF.'}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def descargar_reporte_asistencia(request):
    fecha_str = request.query_params.get('fecha', str(date.today()))
    top_n_raw = request.query_params.get('top_n', 10)
    try:
        top_n = max(1, min(int(top_n_raw), 100))
    except (ValueError, TypeError):
        top_n = 10

    try:
        fecha = date.fromisoformat(fecha_str)
    except ValueError:
        return Response({'error': 'Formato de fecha inválido.'}, status=400)

    ingresos_diarios = Asistencia.objects.filter(fecha=fecha).count()
    fi = fecha - timedelta(days=30)
    ff = fecha

    top_socios_qs = (
        Asistencia.objects.filter(fecha__gte=fi, fecha__lte=ff)
        .values('socio__dni', 'socio__nombres', 'socio__apellidos')
        .annotate(total=Count('id'))
        .order_by('-total')[:top_n]
    )

    top_socios = []
    for s in top_socios_qs:
        top_socios.append({
            'dni': s['socio__dni'],
            'nombres': s['socio__nombres'],
            'apellidos': s['socio__apellidos'],
            'total': s['total'],
        })

    gimnasio = Gimnasio.objects.first()
    context = {
        'gimnasio': gimnasio or {'nombre': 'YuguGYM', 'ruc': '', 'direccion': '', 'telefono': '', 'correo': ''},
        'ingresos_diarios': ingresos_diarios,
        'fecha': fecha.strftime('%d/%m/%Y'),
        'top_n': top_n,
        'rango_inicio': fi.strftime('%d/%m/%Y'),
        'rango_fin': ff.strftime('%d/%m/%Y'),
        'top_socios': top_socios,
    }

    html = render_to_string('pdf/reporte_asistencia.html', context)
    try:
        from weasyprint import HTML
        pdf = HTML(string=html).write_pdf()
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte-asistencia.pdf"'
        return response
    except Exception:
        return Response({'error': 'No se pudo generar el PDF.'}, status=500)
