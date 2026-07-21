# 🏋️ YuguGYM — Sistema de Gestión de Gimnasio

## Requisitos

- **Python 3.12+**
- **Node.js 20+** (con npm)
- Navegador Chrome/Edge actualizado

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/GonzaloRail/YuguGYM.git
cd YuguGYM
```

### 2. Backend (Django)

```bash
python -m venv venv
source venv/bin/activate         # Linux/Mac
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
cp .env.example .env             # variables de entorno por defecto 
#borras el .example, solo debe quedarte el ".env", asi tal cual 

(SQLite local)
python manage.py migrate
python manage.py seed            # carga datos iniciales (membresías, métodos pago, admin)
python manage.py runserver 8099  # el backend corre en el puerto 8099
```

Credenciales del admin por defecto:
- Correo: `admin@yugugym.com`
- Contraseña: `admin123`

### 3. Frontend (React + Vite)

Abrir otra terminal:

```bash
cd frontend
npm install
npm run dev                      # corre en http://localhost:5173
```

Abrir `http://localhost:5173` en el navegador.

## Estructura del proyecto

```
YuguGYM/
├── api/                  # Backend Django REST Framework
│   ├── auth/             # Autenticación JWT
│   ├── socios/           # CRUD de socios
│   ├── membresias/       # Registro y renovación
│   ├── pagos/            # Pagos y comprobantes
│   ├── asistencias/      # Control de ingresos
│   └── reportes/         # Reportes y estadísticas
├── config/               # Configuración de Django
├── frontend/             # Frontend React + Vite + Tailwind
│   └── src/
│       ├── pages/        # Páginas por módulo
│       ├── components/   # Componentes reutilizables
│       └── lib/          # API client, auth, utils
├── templates/            # Plantillas (PDFs, emails)
├── requirements.txt      # Dependencias Python
├── .env.example          # Plantilla de variables de entorno
└── manage.py             # CLI de Django
```

## Módulos

| Módulo | Funcionalidad |
|---|---|
| **Socios** | Registrar, editar, eliminar, ver ficha con membresía/pagos/asistencias |
| **Membresías** | Registrar nueva, renovar, alertas de vencidas y próximas a vencer |
| **Pagos** | Registrar pago, historial, pagos del día, comprobante PDF |
| **Asistencia** | Registrar ingreso con verificación de membresía, historial |
| **Reportes** | Socios activos, ingresos por período, asistencia (con gráficos y PDF) |

## Notas

- La base de datos por defecto es **SQLite3**, no requiere PostgreSQL.
- Los correos salen por consola en desarrollo (ver terminal de Django).
- Para producción, configurar PostgreSQL y SMTP en `.env`.
