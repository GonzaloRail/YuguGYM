import re
from datetime import date
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator, MinLengthValidator

# ─── Custom User Manager ───────────────────────────────────────────────

class AdministradorManager(BaseUserManager):
    def create_user(self, correo, usuario, nombres, apellidos, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo electrónico es obligatorio')
        if not usuario:
            raise ValueError('El nombre de usuario es obligatorio')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, usuario=usuario, nombres=nombres, apellidos=apellidos, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, usuario, nombres, apellidos, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('activo', True)
        return self.create_user(correo, usuario, nombres, apellidos, password, **extra_fields)

# ─── 1.6.1 Administrador ───────────────────────────────────────────────

class Administrador(AbstractBaseUser, PermissionsMixin):
    usuario = models.CharField(max_length=20, unique=True, db_index=True,
        validators=[RegexValidator(r'^[a-zA-Z0-9_]+$', 'Solo se permiten letras, números y guion bajo.')])
    nombres = models.CharField(max_length=80,
        validators=[RegexValidator(r'^[A-Za-zÀ-ÿ\s]+$', 'Solo se permiten letras y espacios.')])
    apellidos = models.CharField(max_length=80,
        validators=[RegexValidator(r'^[A-Za-zÀ-ÿ\s]+$', 'Solo se permiten letras y espacios.')])
    correo = models.EmailField(max_length=100, unique=True, db_index=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    is_staff = models.BooleanField(default=False)

    objects = AdministradorManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['usuario', 'nombres', 'apellidos']

    class Meta:
        db_table = 'administradores'
        verbose_name = 'Administrador'
        verbose_name_plural = 'Administradores'

    def __str__(self):
        return f'{self.nombres} {self.apellidos} ({self.correo})'

# ─── 1.1.1 Gimnasio ────────────────────────────────────────────────────

class Gimnasio(models.Model):
    nombre = models.CharField(max_length=100)
    ruc = models.CharField(max_length=11, blank=True, null=True)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    correo = models.EmailField(max_length=100, blank=True, null=True)
    logo = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'gimnasio'
        verbose_name = 'Gimnasio'
        verbose_name_plural = 'Gimnasio'

    def __str__(self):
        return self.nombre

# ─── 1.2.1 Socio ───────────────────────────────────────────────────────

def validar_dni(value):
    if not re.fullmatch(r'[0-9]{8}', str(value)):
        raise ValidationError('El DNI debe tener exactamente 8 dígitos.')

def validar_telefono(value):
    if not re.fullmatch(r'[0-9]{9}', str(value)):
        raise ValidationError('El teléfono debe tener exactamente 9 dígitos.')

def validar_nombres(value):
    if not re.fullmatch(r'^[A-Za-zÀ-ÿ\s]+$', str(value)):
        raise ValidationError('Solo se permiten letras y espacios.')

def validar_fecha_nacimiento(value):
    hoy = date.today()
    if value and value > hoy:
        raise ValidationError('La fecha de nacimiento no puede ser en el futuro.')
    if value and value < date(1900, 1, 1):
        raise ValidationError('La fecha de nacimiento no puede ser anterior a 1900.')

class Socio(models.Model):
    SEXO_CHOICES = [
        ('Masculino', 'Masculino'),
        ('Femenino', 'Femenino'),
        ('Otro', 'Otro'),
    ]
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    dni = models.CharField(max_length=8, unique=True, db_index=True, validators=[validar_dni])
    nombres = models.CharField(max_length=80, db_index=True, validators=[validar_nombres])
    apellidos = models.CharField(max_length=80, db_index=True, validators=[validar_nombres])
    fecha_nacimiento = models.DateField(null=True, blank=True, validators=[validar_fecha_nacimiento])
    sexo = models.CharField(max_length=15, choices=SEXO_CHOICES, blank=True, null=True)
    telefono = models.CharField(max_length=9, validators=[validar_telefono], blank=True, null=True)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    correo = models.EmailField(max_length=100, blank=True, null=True)
    fecha_inscripcion = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Activo', db_index=True)

    class Meta:
        db_table = 'socios'
        verbose_name = 'Socio'
        verbose_name_plural = 'Socios'
        ordering = ['apellidos', 'nombres']

    def __str__(self):
        return f'{self.dni} - {self.nombres} {self.apellidos}'

    def membresia_activa(self):
        return self.membresias.filter(
            estado__nombre='Activa',
            fecha_vencimiento__gte=date.today()
        ).first()

    def ultimo_pago(self):
        return self.pagos.order_by('-fecha_pago').first()

# ─── 1.1.2 TiposMembresia ──────────────────────────────────────────────

class TiposMembresia(models.Model):
    nombre = models.CharField(max_length=30)
    duracion_dias = models.IntegerField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        db_table = 'tipos_membresia'
        verbose_name = 'Tipo de Membresía'
        verbose_name_plural = 'Tipos de Membresía'

    def __str__(self):
        return f'{self.nombre} - S/{self.precio}'

# ─── 1.1.3 EstadosMembresia ─────────────────────────────────────────────

class EstadosMembresia(models.Model):
    nombre = models.CharField(max_length=30, unique=True)

    class Meta:
        db_table = 'estados_membresia'
        verbose_name = 'Estado de Membresía'
        verbose_name_plural = 'Estados de Membresía'

    def __str__(self):
        return self.nombre

# ─── 1.3.1 Membresia ───────────────────────────────────────────────────

class Membresia(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='membresias')
    tipo_membresia = models.ForeignKey(TiposMembresia, on_delete=models.PROTECT, related_name='membresias')
    estado = models.ForeignKey(EstadosMembresia, on_delete=models.PROTECT, related_name='membresias')
    fecha_inicio = models.DateField()
    fecha_vencimiento = models.DateField(db_index=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'membresias'
        verbose_name = 'Membresía'
        verbose_name_plural = 'Membresías'
        ordering = ['-fecha_vencimiento']

    def __str__(self):
        return f'{self.socio.dni} - {self.tipo_membresia.nombre} (hasta {self.fecha_vencimiento})'

# ─── 1.3.2 HistorialMembresias ─────────────────────────────────────────

class HistorialMembresias(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='historial_membresias')
    tipo_membresia = models.ForeignKey(TiposMembresia, on_delete=models.PROTECT)
    fecha_inicio = models.DateField()
    fecha_vencimiento = models.DateField()
    monto = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    administrador = models.ForeignKey(Administrador, on_delete=models.SET_NULL, null=True, blank=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'historial_membresias'
        verbose_name = 'Historial de Membresía'
        verbose_name_plural = 'Historial de Membresías'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f'{self.socio.dni} - {self.tipo_membresia.nombre} ({self.fecha_inicio} a {self.fecha_vencimiento})'

# ─── 1.1.4 MetodosPago ─────────────────────────────────────────────────

class MetodosPago(models.Model):
    nombre = models.CharField(max_length=30, unique=True)

    class Meta:
        db_table = 'metodos_pago'
        verbose_name = 'Método de Pago'
        verbose_name_plural = 'Métodos de Pago'

    def __str__(self):
        return self.nombre

# ─── 1.4.1 Pago ────────────────────────────────────────────────────────

class Pago(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='pagos')
    membresia = models.ForeignKey(Membresia, on_delete=models.CASCADE, related_name='pagos', null=True, blank=True)
    metodo_pago = models.ForeignKey(MetodosPago, on_delete=models.PROTECT, related_name='pagos')
    administrador = models.ForeignKey(Administrador, on_delete=models.SET_NULL, null=True, blank=True)
    numero_comprobante = models.CharField(max_length=30, unique=True, null=True, blank=True)
    fecha_pago = models.DateTimeField(auto_now_add=True, db_index=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pagos'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-fecha_pago']

    def __str__(self):
        return f'Pago {self.id} - {self.socio.dni} - S/{self.monto}'

# ─── 1.5.1 Asistencia ──────────────────────────────────────────────────

class Asistencia(models.Model):
    socio = models.ForeignKey(Socio, on_delete=models.CASCADE, related_name='asistencias')
    administrador = models.ForeignKey(Administrador, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateField(auto_now_add=True, db_index=True)
    hora = models.TimeField(auto_now_add=True)

    class Meta:
        db_table = 'asistencias'
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        ordering = ['-fecha', '-hora']

    def __str__(self):
        return f'{self.socio.dni} - {self.fecha} {self.hora}'

# ─── 1.6.2 RecuperacionPassword ───────────────────────────────────────

class RecuperacionPassword(models.Model):
    administrador = models.ForeignKey(Administrador, on_delete=models.CASCADE, related_name='tokens_recuperacion')
    token = models.CharField(max_length=255)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField()
    utilizado = models.BooleanField(default=False)

    class Meta:
        db_table = 'recuperacion_password'
        verbose_name = 'Recuperación de Contraseña'
        verbose_name_plural = 'Recuperaciones de Contraseña'

    def __str__(self):
        return f'Token {self.administrador.correo} - {"Usado" if self.utilizado else "Pendiente"}'
