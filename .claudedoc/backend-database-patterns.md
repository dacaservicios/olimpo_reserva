# Backend & Database Patterns — olimpo_reserva

---

## Convención de Stored Procedures

Todos los accesos a datos van **exclusivamente** a través de stored procedures. Nunca SQL inline en modelos.

### Nomenclatura
```
USP_[ACCION]_[RECURSO]

ACCION:
  SEL    → lectura (SELECT)
  INS    → inserción
  UPD    → actualización
  DEL    → eliminación
  UPD_INS → inserción o actualización (upsert por parámetro de acción)
```

### Stored Procedures genéricos (reutilizables)
| SP | Firma | Uso |
|---|---|---|
| `USP_SEL_VERLISTA` | `(id, tabla, sesId)` | Lista registros de cualquier tabla/vista |
| `USP_SEL_VERLISTAID` | `(id, tabla, sesId)` | Busca un registro por ID |
| `USP_DEL_ELIMINA` | `(id, tabla)` | Elimina lógicamente por tabla |
| `USP_UPD_ESTADO` | `(id, tabla)` | Cambia estado activo/inactivo |
| `USP_UPD_INS_DETALLE` | `(id, param2, fecha, tabla, sesId)` | Detalle/horarios |

### Stored Procedures específicos
| SP | Módulo | Parámetros clave |
|---|---|---|
| `USP_UPD_INS_RESERVA_CLIENTE` | Reservas | `(id, cliente, empleado, servicio, fechaHora, comentario, tipoCliente, sucursal, accion, sesId)` |
| `USP_UPD_INS_REGISTRO_CLIENTE` | Auth/Acceso | `(_ID, _CLIENTE, _CONTRASENA, _OPCION, _IP, _SERVER)` — `_CLIENTE` = nº documento / correo / celular según la opción |
| `USP_UPD_INS_CLIENTE` | Clientes | **16 params**: `(_ID, _NOMBRES, _APELLIDO_PATERNO, _APELLIDO_MATERNO, _ID_TIPO_DOCUMENTO, _VIP, _NUMERO_DOCUMENTO, _DIRECCION, _FECHA_NACIMIENTO, _NRO_CELULAR, _EMAIL, _CONTRASENA, _COMENTARIO, _IMAGEN, _TIPO, _USUACREAMODI)` · `_TIPO` ∈ `'crea'|'edita'` (no existe `'cambia'`) · sucursal/empresa se derivan de `_USUACREAMODI` vía `SEG_USUARIO` · en `'edita'` no se tocan `CONTRASENA` ni `IMAGEN` (si es NULL) |

**Acciones del SP `USP_UPD_INS_RESERVA_CLIENTE`:**
- `'crea'` → inserción nueva reserva
- `'edita'` → actualización completa (fecha/hora/comentario + datos del cliente)
- `'editaDD'` → actualización solo de fecha/hora (drag & drop)

**Acciones del SP `USP_UPD_INS_REGISTRO_CLIENTE`:** (firma `(_ID, _CLIENTE, _CONTRASENA, _OPCION, _IP, _SERVER)`)

> El **login es por `NUMERO_DOCUMENTO`** (no por correo). Las opciones 1, 2 y 4 ubican
> al cliente con `WHERE NUMERO_DOCUMENTO = _CLIENTE`. Las opciones 9/10/11 siguen por correo.

| Acción (int) | `_CLIENTE` recibe | Descripción |
|---|---|---|
| 1 | nº documento | Login: valida estado y devuelve `ID_CLIENTE, ID_SUCURSAL, ID_EMPRESA, MENSAJE('0'=ok), TIPO, CORREO` |
| 2 | nº documento | Pre-login: devuelve `ID_CLIENTE, CONTRASENA, SESION, NUMERO_DOCUMENTO, EMAIL, NRO_CELULAR` (si `CONTRASENA` es NULL → primer ingreso: la clave válida es el propio documento) |
| 3 | — | Registra acceso exitoso (`SESION='A'`, `INTENTO=0`) |
| 4 | nº documento | Registra intento fallido (`INTENTO++`) |
| 6 | — | Logout (`SESION='I'`) |
| 7 | — | Obtiene hash de contraseña (`_ID`) |
| 8 | — | Cambia contraseña (`_ID`, hash en `_CONTRASENA`); deja `SESION='I'` |
| 9 | correo | Verifica si el correo existe |
| 10 | correo | Recupera contraseña por correo (hash en `_CONTRASENA`); devuelve `NUMERO_DOCUMENTO, EMAIL` |
| 11 | correo | Verifica duplicado (por correo) |
| 12 | nº celular | Recupera contraseña por celular; devuelve `NUMERO_DOCUMENTO, NRO_CELULAR, EMAIL, NRO_WHATSAPP` (para envío por WhatsApp) |
| 13 | nº celular | Verifica si el celular existe (pre-recuperación) |

---

## Flujo de llamada a la BD (modelo)

```js
const pool = require('../config/connections');

const miFuncion = async (id, body) => {
    const query = `CALL USP_[ACCION]_[RECURSO](?, ?, ?)`;
    const row = await pool.query(query, [id, body.campo, body.sesId]);
    return {
        resultado: true,
        info: row[0][0],   // objeto único
        // info: row[0],   // array de resultados
        mensaje: '¡Éxito!'
    };
};
```

- `row[0]` → primer result set (array de filas)
- `row[0][0]` → primera fila del primer result set
- Siempre envolver en `async/await` — nunca callbacks

---

## Convención de fechas y horas

### Entrada (frontend → backend)
El frontend envía siempre en formato `DD-MM-YYYY` y `HH:mm`:
```js
// En el body JSON:
{ fechaReserva: "15-06-2025", horaReserva: "09:00" }
```

### Conversión en el modelo (Node → MariaDB)
```js
moment(body.fechaReserva + " " + body.horaReserva, 'DD-MM-YYYY HH:mm')
    .format('YYYY-MM-DD HH:mm')
// Resultado: "2025-06-15 09:00" → guardado en DATETIME de MariaDB
```

### Salida (MariaDB → frontend)
La BD devuelve objetos `Date` de JavaScript; Moment.js los formatea en el frontend:
```js
moment(evt.FECHA_RESERVA).format('dddd, DD [de] MMMM [del] YYYY')  // "lunes, 15 de junio del 2025"
moment(evt.FECHA_RESERVA).format('hh:mm A')                         // "09:00 AM"
moment(evt.FECHA_RESERVA).format('DD/MM/YYYY')                      // "15/06/2025"
```

### Regla estricta
- **NUNCA** pasar fechas como string `YYYY-MM-DD` directo desde frontend.
- **NUNCA** usar `new Date()` en el backend para construir fechas; usar siempre `moment()`.
- El campo `FECHA_RESERVA` en BD es `DATETIME`.

---

## Middlewares de validación

### Pipeline estándar de una ruta protegida
```js
router.post('/api/reserva/crear',
    caracter,            // 1. Bloquea caracteres no permitidos (regex)
    validaSchema(schemaReserva),  // 2. Valida estructura con @hapi/joi
    verificarToken,      // 3. Verifica JWT en header Authorization
    crear                // 4. Controller
);
```

### `caracter` (auth.js)
Regex permitida: `^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ!¡#$%&()º_*+\-./:;,=¿?@\[\]\{\|\}\\n\\r ]{1,}$`
Si falla: `{ valor: { resultado: false, mensaje: '¡Existen caracteres que no están permitidos!' } }`

### `validaSchema` (auth.js)
Wrapper de Joi. Si falla: `res.status(400).json({ error: { message, errno, code } })`

### `verificarToken` (jwt.js)
Lee `req.headers.authorization` → `"Bearer <token>"`.
Si falta: `res.status(403)`. Si token inválido: `res.status(403)`.
Inyecta `req.usuario = jwtData`.

### `isLogin` (auth.js)
Verifica sesión Passport activa (`req.isAuthenticated()`). Si falla: redirect a `/`.

### `verificaAdjunto` (auth.js)
Valida archivos subidos con `express-fileupload`:
- Tamaño máximo: `config.TAMANO_ADJUNTO` (env)
- Formatos imagen: `['jpeg','png','jpg','JPG','PNG','JPEG']`
- Formatos documento: `['pdf','PDF']`
- Si ok: `req.archivo = 1`

---

## Convención de respuesta HTTP

### Éxito
```json
{ "valor": { "resultado": true, "info": {}, "mensaje": "¡Registro creado!" } }
```

### Error de validación / negocio
```json
{ "valor": { "resultado": false, "mensaje": "Descripción del error" } }
```

### Error de middleware / servidor
```json
{ "error": { "message": "...", "errno": "...", "code": "..." } }
// HTTP 400 o 403
```

---

## Auditoría y logging

- **Tabla de registro:** `USP_UPD_INS_REGISTRO_CLIENTE` almacena IP + hostname en cada acción de auth.
- **Campos de auditoría:** `ip` (req.ip), `server` (req.hostname)
- **Intentos fallidos:** acción `4` del SP; al alcanzar 3 intentos la cuenta se bloquea.
- **Bloqueo de IP:** lógica en el SP; respuesta incluye `tipo: 3` para el frontend.
- **Log de sesión activa:** acción `3` registra el acceso exitoso con IP/hostname.

---

## Borrado lógico (soft-delete)

El SP `USP_DEL_ELIMINA(id, tabla)` no elimina físicamente — cambia estado activo a inactivo.
Las vistas de BD (`USP_SEL_VERLISTA`) filtran registros activos automáticamente.
Nunca hacer `DELETE FROM tabla` directamente.

---

## Estructura de archivos backend por módulo

```
apis/[modulo]Api.js         → define rutas + middleware pipeline
controllers/[modulo]Controllers.js  → llama al modelo, devuelve JSON
models/[modulo]Models.js    → ejecuta CALL USP_... y retorna objeto resultado
```

Exportación estándar:
```js
module.exports = { crearReserva, editarReserva, ... }
```

---

## Rutas REST — convención

```
GET    /api/{recurso}/listar/:id/:sesId
GET    /api/{recurso}/listar/{subtipo}/:id/:sesId
GET    /api/{recurso}/buscar/:id/:sesId
POST   /api/{recurso}/crear
PUT    /api/{recurso}/editar/:id
PUT    /api/{recurso}/estado/:id
DELETE /api/{recurso}/eliminar/:id
```

`sesId` = ID_CLIENTE de la sesión activa (pasado por el frontend para auditoría en el SP).

---

## Conexión a la BD

```js
// connections.js
const pool = sql.createPool({
    host, user, password, database,
    port, charset: 'utf8mb4',
    connectionLimit: 10,
    connectTimeout: 10000,
    acquireTimeout: 10000
});
pool.query = promisify(pool.query);  // promisificado
```

DB: `DB_OLIMPO`  
Dev: `user=diego / pass=diego`  
Prod: `user=usr_olimpo / pass=olimpo2023@@`
