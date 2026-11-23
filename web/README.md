# Black Cat Nails Web

Sistema web para el salón de manicura y estética **Black Cat Nails by Vante**, desarrollado como proyecto de cátedra para la asignatura **DPS941 (Diseño y Programación de Software Multiplataforma)** en la **Universidad Don Bosco**.

---

## Integrantes

- **Enrique Alejandro García Villeda**

---

## Enlace del Despliegue

- **URL de Producción**: [https://black-cat-nails.vercel.app](https://black-cat-nails.vercel.app)
- **Repositorio**: esta carpeta `web/` del monorepo [Kikeagv/black-cat-nails-mobile](https://github.com/Kikeagv/black-cat-nails-mobile). El historial de la Etapa 2 se conservó al incorporarla.

## Credenciales de prueba

Son las mismas cuentas de la app móvil; se crean con `npm run seed` desde la raíz del repositorio:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| **Administradora** | `vante@blackcatnails.sv` | `Password123` |
| **Clienta** | `camila@mail.com` | `Password123` |

---

## Funcionalidades

- **Autenticación**: Firebase Authentication con correo/contraseña y Google, recuperación de contraseña, sesión en cookie httpOnly y autorización por roles (`clienta` y `admin`). El registro público siempre asigna el rol `clienta`.
- **Portal de la clienta**:
  - Catálogo filtrable por categoría y próxima cita destacada (`/app`).
  - Agendamiento en tres pasos. La disponibilidad se consulta en vivo y se vuelve a validar en el servidor al crear la cita (`/app/agendar`).
  - Próximas citas e historial. La cita queda confirmada al crearse; la clienta puede cancelarla con al menos 12 horas de anticipación (`/app/citas`).
- **Dashboard administrativo**: Indicadores, ingresos semanales, agenda del día y alertas operativas (`/admin`).
- **Agenda**: Vista semanal, detalle y cambio de estado de las citas, además de creación manual por parte de la administradora (`/admin/agenda`).
- **Servicios**: Crear y editar servicios, gestionar su disponibilidad, precio, duración, ciclo de retorno y consumo de insumos (`/admin/servicios`).
- **Inventario**: Existencias comparadas con el mínimo requerido, nivel de criticidad, rendimiento estimado por insumo y registro de compras (`/admin/inventario`).
- **Clientas**: Búsqueda y filtros por actividad e inasistencias, ficha con historial y métricas, alerta a partir de dos inasistencias y notas privadas editables (`/admin/clientas`).
- **Estados de interfaz y UX**: Indicadores de carga, estados vacíos, mensajes de error y acciones para reintentar en las pantallas que consultan datos. El cliente HTTP informa cuando detecta falta de conexión. La interfaz es adaptable a móvil, tableta y escritorio.

## Arquitectura y autenticación (entrega final)

La web comparte el proyecto de Firebase con la app móvil de la raíz del repositorio.

- `src/app` contiene las páginas de clientas, administración y acceso público.
- `src/app/api` contiene los Route Handlers del API.
- `src/server/db.ts` es el repositorio de datos sobre **Cloud Firestore** (firebase-admin), con las mismas colecciones que usa la app móvil: `usuarias`, `servicios`, `insumos`, `citas` y `agendaDias`.
- `src/server/session.ts` verifica los ID tokens de **Firebase Authentication** y maneja la cookie de sesión; `src/server/token.ts` firma y lee el JWT de la cookie.
- `src/lib/firebase.ts` inicializa Firebase Authentication en el navegador.
- `src/services` centraliza las llamadas HTTP desde el cliente; `src/context` comparte el estado de autenticación, agenda, catálogo e inventario.
- `src/domain` contiene reglas de negocio y cálculos; `src/schemas` define validaciones Zod.

### Flujo de inicio de sesión

1. El navegador inicia sesión con el SDK de Firebase: correo y contraseña, o **Google** con ventana emergente.
2. Envía el ID token a `POST /api/auth/login`. El servidor lo verifica con `firebase-admin`, busca el perfil en `usuarias/{uid}` y crea la cookie httpOnly `bcn_session` (JWT de 8 horas, `SameSite=Lax`).
3. Si es el primer ingreso con Google, la API responde `perfil_incompleto` y la web pide el teléfono en un diálogo; `POST /api/auth/registro` crea el perfil con rol `clienta`, igual que la pantalla "Completá tu perfil" de la app móvil.
4. El registro con correo crea la cuenta en Firebase Authentication y luego el perfil con el mismo endpoint. Si el perfil falla, la cuenta se borra para no dejarla a medias.
5. "¿Olvidaste tu contraseña?" envía el correo de recuperación de Firebase.

### Persistencia compartida con la app móvil

- Crear una cita es una **transacción** de Firestore que revisa y reserva el bloque en `agendaDias/{fecha}`. La app móvil usa el mismo documento, así que una clienta en el teléfono y otra en la web no pueden tomar el mismo horario (la segunda recibe `409 horario_ocupado`).
- Cancelar o marcar inasistencia libera el bloque del día. Completar una cita descuenta insumos y calcula el retoque.
- Los cambios de estado se registran en `usuarias/{uid}/actividad`, que la clienta ve en **Mi actividad** de la app móvil.
- La administradora ve en la agenda web las citas que las clientas agendan desde el teléfono, y viceversa.

### Autorización

- `src/proxy.ts` protege `/app/*` (clienta) y `/admin/*` (administradora) a partir de la cookie.
- Cada Route Handler vuelve a validar sesión y rol con `requireSession` y `requireRol`.
- El registro público siempre crea rol `clienta`; la cuenta de administradora solo se crea con `npm run seed` desde la raíz.

## API principal

| Área | Rutas principales | Uso |
| --- | --- | --- |
| Autenticación | `POST /api/auth/registro`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Crear cuenta, iniciar, consultar y cerrar sesión |
| Citas | `GET/POST /api/citas`, `PATCH /api/citas/[id]/estado` | Consultar, crear y cambiar el estado de las citas |
| Disponibilidad | `GET /api/disponibilidad` | Calcular horarios disponibles para una fecha y servicios |
| Catálogo | `/api/servicios` y `/api/servicios/[id]` | Consultar y gestionar servicios |
| Operación | `/api/insumos`, `/api/clientas`, `/api/dashboard` | Inventario, directorio de clientas e indicadores administrativos |

---

## Cómo Ejecutar el Proyecto

### Prerrequisitos

- **Node.js** v20.9.0 o superior y **npm** v10 o superior.
- El proyecto de Firebase de la app móvil ya configurado (ver [`../docs/configuracion-firebase.md`](../docs/configuracion-firebase.md)), con los datos cargados con `npm run seed` desde la raíz.

### Instalación y Ejecución

```bash
cd web
npm install
cp .env.example .env.local
```

En `.env.local`:

1. `SESSION_SECRET`: una cadena aleatoria (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. `NEXT_PUBLIC_FIREBASE_*`: los mismos valores de `EXPO_PUBLIC_FIREBASE_*` del `.env` de la app móvil.
3. `FIREBASE_SERVICE_ACCOUNT`: el contenido de `scripts/serviceAccount.json` en una sola línea (`node -e "console.log(JSON.stringify(require('../scripts/serviceAccount.json')))"`). Es secreto: no se sube a GitHub.
4. En Firebase → Authentication → Configuración → **Dominios autorizados**, agregar el dominio de Vercel para que funcione Google.

```bash
npm run dev     # http://localhost:3000
```

Sin conexión a la nube: con `npm run emuladores` y `npm run seed:emuladores` corriendo en la raíz, descomentar el bloque de emuladores de `.env.example` en `.env.local`.

### Despliegue en Vercel

1. Importar el repositorio en Vercel con **Root Directory = `web`**.
2. Agregar las variables de `.env.example` (`SESSION_SECRET`, `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_SERVICE_ACCOUNT`) en Settings → Environment Variables.
3. Desplegar y agregar el dominio `*.vercel.app` a los dominios autorizados de Firebase Authentication.

### Scripts Útiles

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Construcción para producción
npm run lint       # Linter de código (ESLint)
npx tsc --noEmit   # Verificación estricta de tipos de TypeScript
```

---

## Stack Tecnológico

- **Framework**: Next.js 16.3.5 (App Router, Route Handlers, Proxy, Turbopack)
- **UI**: React 19, Tailwind CSS v4, Base UI y componentes reutilizables con patrones de shadcn/ui
- **Lenguaje**: TypeScript (Strict Mode)
- **Formularios y validación**: React Hook Form y Zod
- **Backend**: Firebase Authentication (correo y Google) y Cloud Firestore con `firebase` 13 en el navegador y `firebase-admin` 14 en el servidor
- **Sesión**: `jose` para el JWT de la cookie httpOnly
- **Gráficas y utilidades**: Recharts, date-fns, lucide-react y Sonner
