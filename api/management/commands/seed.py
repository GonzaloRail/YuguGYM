from django.core.management.base import BaseCommand
from api.models import (
    TiposMembresia, EstadosMembresia, MetodosPago,
    Administrador, Gimnasio
)


class Command(BaseCommand):
    help = 'Carga datos iniciales del sistema'

    def handle(self, *args, **options):
        # ── Tipos de Membresía ──
        tipos = [
            ('Mensual', 30, 79.90, 'Acceso completo por 30 días'),
            ('Trimestral', 90, 199.90, 'Acceso completo por 90 días (ahorro 16%)'),
            ('Semestral', 180, 349.90, 'Acceso completo por 180 días (ahorro 27%)'),
        ]
        for nombre, dias, precio, desc in tipos:
            TiposMembresia.objects.get_or_create(
                nombre=nombre,
                defaults={'duracion_dias': dias, 'precio': precio, 'descripcion': desc}
            )
        self.stdout.write(self.style.SUCCESS('✓ Tipos de membresía creados'))

        # ── Estados de Membresía ──
        for estado in ['Activa', 'Vencida', 'Suspendida']:
            EstadosMembresia.objects.get_or_create(nombre=estado)
        self.stdout.write(self.style.SUCCESS('✓ Estados de membresía creados'))

        # ── Métodos de Pago ──
        for metodo in ['Efectivo', 'Yape', 'Transferencia']:
            MetodosPago.objects.get_or_create(nombre=metodo)
        self.stdout.write(self.style.SUCCESS('✓ Métodos de pago creados'))

        # ── Gimnasio ──
        Gimnasio.objects.get_or_create(
            nombre='YuguGYM',
            defaults={
                'ruc': '12345678901',
                'direccion': 'Av. Principal 123',
                'telefono': '987654321',
                'correo': 'contacto@yugugym.com',
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Gimnasio creado'))

        # ── Super Admin ──
        if not Administrador.objects.filter(correo='admin@yugugym.com').exists():
            Administrador.objects.create_superuser(
                correo='admin@yugugym.com',
                usuario='admin',
                nombres='Administrador',
                apellidos='Principal',
                password='admin123',
            )
            self.stdout.write(self.style.SUCCESS('✓ Super admin creado (admin@yugugym.com / admin123)'))
        else:
            self.stdout.write(self.style.WARNING('⚠ Super admin ya existe'))
