# Domain Logic — olimpo_reserva

---

## Diccionario de campos — Entidades principales

### TRS_RESERVA (Reserva)
| Campo BD | Tipo | Frontend JS | Descripción |
|---|---|---|---|
| `ID_RESERVA` | INT PK | `evt.ID_RESERVA` | Identificador único |
| `ID_SUCURSAL` | INT FK | `_wiz.sucursalId` | Sucursal de la reserva |
| `ID_CLIENTE` | INT FK | `_wiz.clienteId` | Cliente que reserva |
| `ID_EMPLEADO` | INT FK | `_wiz.barberoId` | Barbero asignado |
| `ID_SERVICIO_SUCURSAL` | INT FK | `_wiz.servicioId` | Servicio de la sucursal |
| `FECHA_RESERVA` | DATETIME | `_wiz.fecha + _wiz.hora` | Fecha y hora (guardada en UTC local) |
| `COMENTARIO` | VARCHAR(250) | `_wiz.comentario` | Nota del cliente |
| `TIPO_CLIENTE` | INT FK | `_wiz.tipoClienteId` | ID_PARAMETRO_DETALLE (tipo: Adulto/Menor) |
| `ESTADO` | INT | `evt.ESTADO` | Estado de la reserva |

**Campos adicionales devueltos por el SP `USP_SEL_VERLISTA` ('reserva_cliente'):**
| Campo SP | Descripción |
|---|---|
| `CLIENTE` | Nombre completo del cliente |
| `EMPLEADO` | Nombre completo del barbero |
| `NOMBRE_SERVICIO` | Nombre del servicio |
| `DESCRIPCION_SERVICIO` | Descripción adicional del servicio |
| `DESC_TIPO_CLIENTE` | Descripción del tipo (ej: "Adulto") — alias del JOIN para evitar DUPLICATE FIELD |
| `CEL_CLIENTE` | Celular del cliente (para WhatsApp, con prefijo 51) |
| `CELULAR_EMPLEADO` | Celular del barbero (para WhatsApp) |
| `NRO_WHATSAPP` | Número de la sucursal (sender de WhatsApp, con prefijo 51) |
| `COLOR` | Color del barbero (para borde de tarjeta) |

> **Crítico:** El alias del JOIN de TIPO_PARAMETRO_DETALLE debe llamarse `DESC_TIPO_CLIENTE` (NO `TIPO_CLIENTE`) para evitar `DUPLICATE FIELD NAME` — la columna `TIPO_CLIENTE` ya existe en `TR.*`.

---

### MAE_CLIENTE (Cliente)
| Campo BD | Frontend JS | Descripción |
|---|---|---|
| `ID_CLIENTE` | `verSesion()` / `user.id` | PK — también usado como sesId |
| `NOMBRE` | `body.nombre` | Nombre(s) |
| `APELLIDO_PATERNO` | `body.apellidoPaterno` | |
| `APELLIDO_MATERNO` | `body.apellidoMaterno` | |
| `NUM_DOCUMENTO` | `body.documento` | DNI u otro documento |
| `ID_TIPO_DOCUMENTO` | `body.tipoDocumento` | FK tipo documento |
| `CELULAR` | `body.celular` | Celular (9 dígitos) |
| `EMAIL` | `body.email` | Correo electrónico |
| `CONTRASENA` | — | Hash bcrypt (nunca exponer) |
| `ID_SUCURSAL` | `user.idSucursal` | Sucursal asociada al cliente |
| `ID_EMPRESA` | `user.idEmpresa` | Empresa del cliente |

---

### MAE_EMPLEADO (Barbero)
| Campo BD | Frontend JS | Descripción |
|---|---|---|
| `ID_EMPLEADO` | `_wiz.barberoId` | PK |
| `NOMBRE` | `_wiz.barberoNombre` | Nombre completo |
| `COLOR` | `evt.COLOR` | Color de identificación (hex) |
| `CELULAR` | — | Para notificaciones WhatsApp |
| `ID_SUCURSAL` | — | Sucursal del empleado |

---

### MAE_SUCURSAL (Sucursal)
| Campo BD | Frontend JS | Descripción |
|---|---|---|
| `ID_SUCURSAL` | `$('#userSucursal').val()` | PK |
| `NOMBRE` | — | Nombre de la sucursal |
| `NRO_WHATSAPP` | `row[0][0].NRO_WHATSAPP` | Número sender WhatsApp (sin prefijo 51) |

---

### MAE_SERVICIO_SUCURSAL (Servicio de sucursal)
| Campo BD | Frontend JS | Descripción |
|---|---|---|
| `ID_SERVICIO_SUCURSAL` | `_wiz.servicioId` | PK |
| `NOMBRE_SERVICIO` | `_wiz.servicioNombre` | Nombre visible |
| `PRECIO` | — | Precio del servicio |

---

### TIPO_PARAMETRO / TIPO_PARAMETRO_DETALLE (Parámetros del sistema)
| ID Parámetro | Uso |
|---|---|
| `62` | Slots de horario (DESCRIPCIONDETALLE = hora "HH:mm") |
| `64` | Tipos de cliente (Adulto / Menor de edad, etc.) |

Campos del detalle:
| Campo BD | Descripción |
|---|---|
| `ID_PARAMETRO_DETALLE` | PK — es el valor que se guarda en `TIPO_CLIENTE` |
| `DESCRIPCIONDETALLE` | Texto visible (ej: "09:00", "Adulto") |
| `ABREVIATURADETALLE` | Código corto (4 chars) |
| `VALORDETALLE` | Valor numérico/texto adicional |

---

## Estados de entidades

### Reserva — estados del badge
| ESTADO int | Etiqueta | Color | Badge Bootstrap |
|---|---|---|---|
| 1 | PENDIENTE | Naranja | `bg-warning text-dark` |
| 2 | CONFIRMADO | Verde | `bg-success` |
| 3 | CANCELADO | Rojo | `bg-danger` |
| 4 | COMPLETADO | Azul | `bg-info text-dark` |

### Restricción de unicidad en TRS_RESERVA
```sql
UNIQUE KEY TRS_RESERVA_UNIQUE_1 (ID_SUCURSAL, ID_EMPLEADO, FECHA_RESERVA)
```
Un slot de barbero solo puede tener **un** dueño. La BD rechaza overbooking.
> Nota: antes incluía `ID_CLIENTE` — esto fue un bug que permitía doble reserva.

---

## Wizard — estado global JS (`reserva.js`)

```js
// Estado del wizard
let _wiz = {
    tipoClienteId: null,  // ID_PARAMETRO_DETALLE del tipo de cliente
    tipo: '',             // Descripción: "Adulto", "Menor de edad"
    servicioId: null,     // ID_SERVICIO_SUCURSAL
    servicioNombre: '',
    barberoId: null,      // ID_EMPLEADO
    barberoNombre: '',
    fecha: '',            // 'DD-MM-YYYY'
    hora: '',             // 'HH:mm'
    clienteId: null,      // ID_CLIENTE
    clienteNombre: '',
    comentario: '',       // Texto libre
    sucursalId: null      // ID_SUCURSAL
};
let _wizData = {};        // datos precargados en paralelo
let _wizCalDate;          // moment() para navegación de mes en paso 4

// Estado del calendario/vista principal
let _calDate, _calSelected, _calEvents, _calTabla;

// Estado del detalle/edición
let _resDetalle;          // reserva seleccionada
```

---

## Flujo del Wizard — 5 pasos

| Paso | Pregunta | BD consultada | Estado guardado |
|---|---|---|---|
| 1 | ¿Para quién? | `parametro/detalle/listar/64` | `_wiz.tipoClienteId`, `_wiz.tipo` |
| 2 | ¿Qué servicio? | `serviciosucursal/listar` | `_wiz.servicioId`, `_wiz.servicioNombre` |
| 3 | ¿Qué barbero? | `empleado/listar` (filtrado por sucursal) | `_wiz.barberoId`, `_wiz.barberoNombre` |
| 4 | ¿Cuándo? | `reserva/listar/hora` + `parametro/detalle/listar/62` | `_wiz.fecha`, `_wiz.hora` |
| 5 | Confirmar datos | `cliente/listar` | `_wiz.clienteId`, `_wiz.comentario` |

**Envío:** `POST /api/reserva/crear` con body:
```json
{
    "cliente": ID_CLIENTE,
    "empleado": ID_EMPLEADO,
    "servicio": ID_SERVICIO_SUCURSAL,
    "fechaReserva": "DD-MM-YYYY",
    "horaReserva": "HH:mm",
    "comentario": "texto o vacío",
    "tipoCliente": ID_PARAMETRO_DETALLE,
    "sucursal": ID_SUCURSAL,
    "sesId": ID_CLIENTE
}
```

---

## Lógica de bloqueo de slots (Wizard paso 4)

```
_wizLoadTimes(empleadoId, fecha):
  1. GET /api/reserva/listar/hora/{empleadoId}/{fecha_DD-MM-YYYY}/{sesId}
     → SP verificaHora_reserva → horarios ocupados del barbero
  2. Cruzar con _calEvents (reservas propias del cliente en esa fecha+barbero)
     → bloquear también slots ya reservados por el mismo cliente
  3. En edición: la hora ORIGINAL del turno NO aparece como ocupada
```

---

## Lógica de permisos por roles

El sistema actualmente tiene un único rol de usuario: **cliente** (`ID_NIVEL` en la sesión).

| Ruta | Acceso | Middleware |
|---|---|---|
| `GET /` | Público (no logueado) | `notLogin` |
| `GET /sistema` | Solo logueados | `isLogin` |
| `POST /inicio/login` | Público | — |
| `PUT /api/acceso/password` | Logueado + JWT | `isLogin + verificarToken` |
| Todas las APIs `/api/*` | Solo con JWT válido | `verificarToken` |

Bloqueo por intentos fallidos: 3 intentos consecutivos bloquean la cuenta. El SP devuelve `tipo: 3` en la respuesta de login.

---

## Notificaciones WhatsApp — lógica

Servicio: `https://whatsapp.aynisystem.com` con header `x-api-key: config.API_KEY_WHATSAPP`

| Operación | Receptor(es) | Tolerancia a fallo |
|---|---|---|
| `crearReserva` | Cliente + Barbero | Si falla: `resultado: true` con aviso en mensaje |
| `editarReserva` | Cliente + Barbero | `catch` silencioso |
| `editarReservaDD` | Cliente + Barbero | `catch` silencioso |
| `eliminarReserva` | Cliente + Barbero | `catch` silencioso |

```js
// Estructura del body
{
    phone: '51' + celular,          // prefijo Perú 51
    message: `template con datos`,
    sender: row[0][0].NRO_WHATSAPP  // número de la sucursal con prefijo 51
}
```

La pantalla de éxito del wizard detecta el aviso de fallo buscando `"WhatsApp"` en `resp.mensaje` y muestra `.wiz-success-warn`.

---

## Filtros de datos por sucursal

Los endpoints que alimentan el wizard filtran por la sucursal del cliente logueado:
- Barberos: `GET /api/empleado/listar/:id/:sesId` — el SP filtra por `ID_SUCURSAL` de la sesión
- Servicios: `GET /api/serviciosucursal/listar/:id/:sesId` — ídem
- Reservas del día: `GET /api/reserva/listar/0/:sesId` — filtra por `ID_SUCURSAL`

El `sesId` es el `ID_CLIENTE` de la sesión; el SP recupera `ID_SUCURSAL` internamente.

---

## Edición de reserva — campos inmutables

`PUT /api/reserva/editar/:id` (guardarCambiosReserva):
- **Solo puede cambiar:** `FECHA_RESERVA`, `COMENTARIO`
- **No cambia:** `ID_CLIENTE`, `ID_EMPLEADO`, `ID_SERVICIO_SUCURSAL`, `TIPO_CLIENTE`
- El `tipoCliente` se guarda en `data-tipocliente` del form de edición (tomado de la reserva original)

---

## Módulos y estado

| Módulo | Estado | API | Vista |
|---|---|---|---|
| Reservas | Listo | `reservaApi` | `reserva.js` |
| Clientes | Listo | `clienteApi` | — |
| Acceso (auth) | Listo | `accesoApi` + `inicioApi` | `login.ejs` |
| Dashboard | Listo | `inicioApi` | cron integrado |
| Empleados | Parcial | `empleadoApi` (solo listar/buscar) | — |
| Parámetros | Parcial | `parametroApi` (solo listar detalle) | — |
| Servicios Sucursal | Parcial | `serviciosucursalApi` (solo listar) | — |
| Sucursales | Parcial | `sucursalApi` (solo listar) | — |
| Facturación | En progreso | — (código comentado) | — |
