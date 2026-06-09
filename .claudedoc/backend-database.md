# Base de datos — olimpo_reserva

> **Fuente de verdad:** Este archivo debe mantenerse idéntico a la BD real.
> Usar como referencia principal para implementar, validar y comprender funcionalidades.
> **DB:** `DB_OLIMPO` · **Motor:** MariaDB · **Charset:** `utf8mb4`

---

## Tablas maestras

### `MAE_CLIENTE`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_CLIENTE` | INT PK AUTO | Identificador del cliente / usuario |
| `NOMBRE` | VARCHAR(100) | Nombre(s) |
| `APELLIDO_PATERNO` | VARCHAR(50) | |
| `APELLIDO_MATERNO` | VARCHAR(50) | |
| `NUM_DOCUMENTO` | VARCHAR(15) | DNI u otro |
| `ID_TIPO_DOCUMENTO` | INT FK | FK a tabla de tipos de documento |
| `CELULAR` | VARCHAR(9) | Celular (9 dígitos, sin prefijo) |
| `EMAIL` | VARCHAR(100) | Correo electrónico (login) |
| `CONTRASENA` | VARCHAR(255) | Hash bcrypt |
| `DIRECCION` | VARCHAR(200) | Dirección opcional |
| `FECHA_NACIMIENTO` | DATE | Fecha de nacimiento |
| `ID_SUCURSAL` | INT FK | Sucursal asignada |
| `ID_EMPRESA` | INT FK | Empresa |
| `IMAGEN` | VARCHAR(100) | Nombre del archivo de imagen |
| `ESTADO` | INT | 1=Activo, 0=Inactivo |
| `VIP` | INT | 1=VIP, 0=Normal |
| `COMENTARIO` | VARCHAR(255) | Notas internas |
| `FECHA_REGISTRO` | DATETIME | Fecha de creación |

---

### `MAE_EMPLEADO`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_EMPLEADO` | INT PK AUTO | Identificador del barbero/empleado |
| `NOMBRE` | VARCHAR(100) | Nombre(s) |
| `APELLIDO_PATERNO` | VARCHAR(50) | |
| `APELLIDO_MATERNO` | VARCHAR(50) | |
| `NUM_DOCUMENTO` | VARCHAR(15) | |
| `ID_TIPO_DOCUMENTO` | INT FK | |
| `ID_TIPO_EMPLEADO` | INT FK | Tipo de empleado (barbero, admin, etc.) |
| `CELULAR` | VARCHAR(9) | Para notificaciones WhatsApp |
| `EMAIL` | VARCHAR(100) | |
| `DIRECCION` | VARCHAR(200) | |
| `FECHA_NACIMIENTO` | DATE | |
| `FECHA_INGRESO` | DATE | |
| `COLOR` | VARCHAR(10) | Color hex de identificación visual |
| `IMAGEN` | VARCHAR(100) | |
| `ID_SUCURSAL` | INT FK | Sucursal del empleado |
| `ESTADO` | INT | 1=Activo, 0=Inactivo |

---

### `MAE_SUCURSAL`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_SUCURSAL` | INT PK AUTO | |
| `ID_EMPRESA` | INT FK | |
| `NOMBRE` | VARCHAR(200) | Nombre de la sucursal |
| `DIRECCION` | VARCHAR(200) | |
| `FIJO` | VARCHAR(7) | Teléfono fijo |
| `CELULAR` | VARCHAR(9) | |
| `NRO_WHATSAPP` | VARCHAR(15) | Número sender WhatsApp (sin prefijo 51) |
| `RUC` | VARCHAR(11) | |
| `IMAGEN` | VARCHAR(100) | |
| `ESTADO` | INT | |

---

### `MAE_EMPRESA`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_EMPRESA` | INT PK AUTO | |
| `NOMBRE` | VARCHAR(200) | Nombre comercial |
| `RAZON` | VARCHAR(200) | Razón social |
| `RUC` | VARCHAR(11) | |
| `DIRECCION` | VARCHAR(200) | |
| `ESTADO` | INT | |

---

### `MAE_SERVICIO_SUCURSAL`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_SERVICIO_SUCURSAL` | INT PK AUTO | |
| `ID_SERVICIO` | INT FK | FK a catálogo de servicios |
| `ID_SUCURSAL` | INT FK | Sucursal que ofrece el servicio |
| `PRECIO` | DECIMAL | Precio del servicio |
| `NOMBRE_SERVICIO` | VARCHAR(100) | (calculado o join) |
| `DESCRIPCION_SERVICIO` | VARCHAR(200) | (calculado o join) |
| `ESTADO` | INT | |

---

## Tablas de transacción

### `TRS_RESERVA`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_RESERVA` | INT PK AUTO | |
| `ID_SUCURSAL` | INT FK | Sucursal de la reserva |
| `ID_CLIENTE` | INT FK | Cliente |
| `ID_EMPLEADO` | INT FK | Barbero |
| `ID_SERVICIO_SUCURSAL` | INT FK | Servicio contratado |
| `FECHA_RESERVA` | DATETIME | Fecha y hora de la cita |
| `COMENTARIO` | VARCHAR(250) | Nota del cliente |
| `TIPO_CLIENTE` | INT FK | FK a TIPO_PARAMETRO_DETALLE (Adulto/Menor) |
| `ESTADO` | INT | 1=PENDIENTE, 2=CONFIRMADO, 3=CANCELADO, 4=COMPLETADO |
| `FECHA_REGISTRO` | DATETIME | |

**Restricción de unicidad:**
```sql
UNIQUE KEY TRS_RESERVA_UNIQUE_1 (ID_SUCURSAL, ID_EMPLEADO, FECHA_RESERVA)
```
Un barbero solo puede tener una reserva por fecha+hora. La BD rechaza overbooking.

---

## Tablas de parámetros

### `TIPO_PARAMETRO`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_PARAMETRO` | INT PK AUTO | |
| `DESCRIPCION` | VARCHAR(100) | Nombre del parámetro |
| `ABREVIATURA` | VARCHAR(10) | |
| `ESTADO` | INT | |

### `TIPO_PARAMETRO_DETALLE`
| Campo | Tipo | Descripción |
|---|---|---|
| `ID_PARAMETRO_DETALLE` | INT PK AUTO | Valor usado en `TIPO_CLIENTE` de `TRS_RESERVA` |
| `ID_PARAMETRO` | INT FK | FK a TIPO_PARAMETRO |
| `DESCRIPCIONDETALLE` | VARCHAR(200) | Texto visible (ej: "Adulto", "09:00") |
| `ABREVIATURADETALLE` | CHAR(4) | Código corto |
| `VALORDETALLE` | VARCHAR(500) | Valor numérico/texto adicional |
| `ESTADO` | INT | |

**Parámetros clave del sistema:**
| ID_PARAMETRO | Uso |
|---|---|
| 62 | Slots de horario disponibles (DESCRIPCIONDETALLE = "HH:mm") |
| 64 | Tipos de cliente para reserva (ej: Adulto, Menor de edad) |

---

## Tablas de auditoría / sesiones

### Sesiones Express (gestionada por express-mysql-session)
- Tabla creada automáticamente por el módulo
- Almacena `session_id`, `expires`, `data`

### Registro de accesos (en `USP_UPD_INS_REGISTRO_CLIENTE`)
El SP registra cada acción de auth con `ip` y `server` (hostname).

---

## Stored Procedures — catálogo completo

### Genéricos (reutilizados por todos los módulos)

```sql
-- Lista registros de una vista/tabla por ID y sesión
CALL USP_SEL_VERLISTA(id INT, tabla VARCHAR, sesId INT)

-- Busca un registro por ID
CALL USP_SEL_VERLISTAID(id INT, tabla VARCHAR, sesId INT)

-- Borrado lógico (soft-delete)
CALL USP_DEL_ELIMINA(id INT, tabla VARCHAR)

-- Cambia estado activo/inactivo
CALL USP_UPD_ESTADO(id INT, tabla VARCHAR)

-- Lista detalle/horarios (para verificaHora_reserva)
CALL USP_UPD_INS_DETALLE(id INT, param2 INT, fecha DATE, tabla VARCHAR, sesId INT)
```

### Módulo Reservas

```sql
-- Crear / editar reserva (upsert por parámetro accion)
CALL USP_UPD_INS_RESERVA_CLIENTE(
    id            INT,          -- 0 = nueva, >0 = editar
    cliente       INT,          -- ID_CLIENTE
    empleado      INT,          -- ID_EMPLEADO
    servicio      INT,          -- ID_SERVICIO_SUCURSAL
    fechaHora     DATETIME,     -- 'YYYY-MM-DD HH:mm'
    comentario    VARCHAR,      -- NULL si vacío
    tipoCliente   INT,          -- ID_PARAMETRO_DETALLE (0 si no aplica)
    sucursal      INT,          -- ID_SUCURSAL (0 en edición normal)
    accion        VARCHAR,      -- 'crea' | 'edita' | 'editaDD'
    sesId         INT           -- ID_CLIENTE de la sesión
)
-- Retorna: datos de la reserva + CEL_CLIENTE + CELULAR_EMPLEADO + NRO_WHATSAPP
--          (para enviar notificaciones WhatsApp)
```

**Vistas/tablas usadas en USP_SEL_VERLISTA para reservas:**
| tabla | Uso |
|---|---|
| `'reserva_cliente'` | Lista reservas del día del cliente (con DESC_TIPO_CLIENTE) |
| `'reserva'` | Busca una reserva por ID (para edición) |
| `'verificaHora_reserva'` | Horarios ocupados de un barbero en una fecha |

### Módulo Acceso / Auth

```sql
-- SP multi-acción para autenticación y gestión de sesión
CALL USP_UPD_INS_REGISTRO_CLIENTE(
    id         INT,     -- 0 = sin ID, >0 = cliente específico
    email      VARCHAR, -- correo del usuario
    contrasena VARCHAR, -- hash bcrypt (o 0 si no aplica)
    accion     INT,     -- ver tabla de acciones en domain-logic.md
    ip         VARCHAR, -- req.ip
    server     VARCHAR  -- req.hostname
)
-- Retorna según acción: datos del cliente, token, conteo de intentos, etc.
```

### Módulo Clientes

```sql
-- Editar datos del cliente
CALL USP_UPD_INS_CLIENTE(
    id              INT,
    nombre          VARCHAR,
    apPaterno       VARCHAR,
    apMaterno       VARCHAR,
    tipoDocumento   INT,
    vip             INT,
    documento       VARCHAR,
    direccion       VARCHAR,
    fechaNacimiento DATE,      -- 'YYYY-MM-DD'
    celular         VARCHAR,
    email           VARCHAR,
    comentario      VARCHAR,
    imagen          VARCHAR,
    idSucursal      INT,
    accion          VARCHAR,   -- 'edita' | 'cambia'
    idEmpresa       INT,
    sesId           INT
)
```

---

## Vistas / tablas lógicas en stored procedures

El sistema usa nombres de "tabla" como parámetro string para enrutar la lógica dentro de los SPs genéricos:

| Nombre tabla | Módulo | Descripción |
|---|---|---|
| `'cliente'` | Clientes | Buscar cliente por ID |
| `'reserva'` | Reservas | Buscar reserva por ID (para edición) |
| `'reserva_cliente'` | Reservas | Listar reservas del cliente (con joins) |
| `'verificaHora_reserva'` | Reservas | Horarios ocupados de un barbero |
| `'empleado'` | Empleados | Listar/buscar empleados por sucursal |
| `'empleado_reserva'` | Empleados | Lista empleados disponibles para el wizard |
| `'serviciosucursal'` | Servicios | Lista servicios por sucursal |
| `'sucursal'` | Sucursales | Lista sucursales |

---

## Relaciones principales

```
MAE_EMPRESA
  └── MAE_SUCURSAL (ID_EMPRESA)
        ├── MAE_CLIENTE (ID_SUCURSAL)
        ├── MAE_EMPLEADO (ID_SUCURSAL)
        ├── MAE_SERVICIO_SUCURSAL (ID_SUCURSAL)
        └── TRS_RESERVA (ID_SUCURSAL)
              ├── → MAE_CLIENTE (ID_CLIENTE)
              ├── → MAE_EMPLEADO (ID_EMPLEADO)
              ├── → MAE_SERVICIO_SUCURSAL (ID_SERVICIO_SUCURSAL)
              └── → TIPO_PARAMETRO_DETALLE (TIPO_CLIENTE)

TIPO_PARAMETRO
  └── TIPO_PARAMETRO_DETALLE (ID_PARAMETRO)
        └── → TRS_RESERVA.TIPO_CLIENTE
```

---

## Convenciones de naming en BD

| Prefijo | Tipo de objeto |
|---|---|
| `MAE_` | Tablas maestras (catálogos) |
| `TRS_` | Tablas de transacción |
| `TIPO_` | Tablas de tipos/parámetros |
| `USP_SEL_` | Stored Procedures de lectura |
| `USP_INS_` | Stored Procedures de inserción |
| `USP_UPD_` | Stored Procedures de actualización |
| `USP_DEL_` | Stored Procedures de eliminación |
| `USP_UPD_INS_` | Stored Procedures de upsert |

Todos los nombres de campos en **MAYÚSCULAS**.
Todos los nombres de tablas/SPs con prefijo de tipo.
