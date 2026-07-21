from django.urls import path, include
from . import pdf_views

urlpatterns = [
    path('auth/', include('api.auth.urls')),
    path('socios/', include('api.socios.urls')),
    path('membresias/', include('api.membresias.urls')),
    path('pagos/', include('api.pagos.urls')),
    path('asistencias/', include('api.asistencias.urls')),
    path('reportes/', include('api.reportes.urls')),
    path('pdf/comprobante/<int:pago_id>/', pdf_views.descargar_comprobante, name='pdf-comprobante'),
    path('pdf/reporte/activos/', pdf_views.descargar_reporte_activos, name='pdf-reporte-activos'),
    path('pdf/reporte/ingresos/', pdf_views.descargar_reporte_ingresos, name='pdf-reporte-ingresos'),
    path('pdf/reporte/asistencia/', pdf_views.descargar_reporte_asistencia, name='pdf-reporte-asistencia'),
]
