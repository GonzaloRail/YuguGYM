from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from api.models import Socio
from api.permissions import IsAdminUser
from .serializers import (
    SocioListSerializer, SocioDetailSerializer,
    SocioCreateSerializer, FichaSocioSerializer
)


class SocioViewSet(viewsets.ModelViewSet):
    queryset = Socio.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'list':
            return SocioListSerializer
        elif self.action == 'create':
            return SocioCreateSerializer
        elif self.action in ('update', 'partial_update'):
            return SocioCreateSerializer
        elif self.action == 'ficha':
            return FichaSocioSerializer
        return SocioDetailSerializer

    def get_queryset(self):
        queryset = Socio.objects.all()
        dni = self.request.query_params.get('dni')
        nombre = self.request.query_params.get('nombre')
        apellido = self.request.query_params.get('apellido')

        if dni:
            queryset = queryset.filter(dni__icontains=dni)
        if nombre:
            queryset = queryset.filter(nombres__icontains=nombre)
        if apellido:
            queryset = queryset.filter(apellidos__icontains=apellido)

        return queryset

    def perform_destroy(self, instance):
        if instance.membresia_activa():
            raise ValidationError({
                'detail': 'El socio posee una membresía activa y no puede ser eliminado.'
            })
        if instance.pagos.exists():
            raise ValidationError({
                'detail': 'El socio posee pagos registrados. '
                          'No se puede eliminar para preservar el historial financiero.'
            })
        instance.delete()

    @action(detail=True, methods=['get'])
    def ficha(self, request, pk=None):
        socio = self.get_object()
        serializer = FichaSocioSerializer(socio)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def verificar_membresia(self, request, pk=None):
        socio = self.get_object()
        membresia = socio.membresia_activa()
        if membresia:
            from datetime import date
            dias_restantes = (membresia.fecha_vencimiento - date.today()).days
            return Response({
                'vigente': True,
                'tipo': membresia.tipo_membresia.nombre,
                'fecha_vencimiento': membresia.fecha_vencimiento,
                'dias_restantes': max(0, dias_restantes),
                'mensaje': 'Membresía vigente. Puede registrar el ingreso.'
            })
        return Response({
            'vigente': False,
            'mensaje': 'La membresía del socio se encuentra vencida. No se puede registrar el ingreso.'
        })
