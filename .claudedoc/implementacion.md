# Implementación — Tareas activas y flujos en construcción

> Este archivo es el espacio de trabajo activo del sprint. Actualizar al iniciar y terminar cada tarea.
> Los ítems marcados `[x]` pasan a `.claudedoc/historico.md` cuando el módulo queda consolidado.

---

## TAREA ACTUAL / PENDIENTES

### [x] API de cliente reducida a `buscar` (2026-09-25, solo local — falta desplegar)
- Se quitaron tres rutas; la UI no usaba ninguna:
  - `GET /api/cliente/listar`: la rama `'cliente'` de olimpo filtra por la empresa del `SEG_USUARIO` cuyo ID coincide con el ID del cliente. Si un cliente tenía el mismo ID que un usuario, recibía **todos los clientes** de esa empresa.
  - `GET /api/cliente/listar_wp`: la rama `'cliente_wp'` marcaba como leída y devolvía la mensajería/WhatsApp de cualquier sucursal pasada por la URL.
  - `PUT /api/cliente/editar`: el modelo `editarCliente` estaba roto. El perfil se edita con `PUT /api/acceso/datos/:sesId`.
- Se reescribieron `clienteApi.js`, `clienteControllers.js` y `clienteModels.js`, que quedan solo con `buscar` (`'cliente_reserva'`).
- En `reserva.js` (`nuevaReservaFecha`), el paso de cliente usa directamente `/api/cliente/buscar/{sesId}/{sesId}`, sin el fallback anterior.
- [ ] Probar en el navegador "Nueva Reserva": el paso de cliente debe mostrar al cliente logueado.

> El ajuste por el multitenant de olimpo está en producción desde 2026-09-25: ver `historico.md`.

### [x] Revisado: correlativo `NUMERO_BAJA` por empresa en olimpo (2026-09-25, solo local)
- olimpo parcheó `USP_UPD_INS_DETALLE 'venta'` (script `multitenant_numero_baja.sql`).
- **Sin impacto aquí:** esta app llama a `USP_UPD_INS_DETALLE` solo con `'mensajeReserva'` y con la tabla de `listarReservaDetalle`, nunca con `'venta'`. No hace falta desplegarla junto con olimpo.

### [x] Login por número de documento + primer ingreso + recuperación (2026-09-09)
- Login: usuario = `NUMERO_DOCUMENTO`. Primera vez, contraseña = documento (`CONTRASENA` NULL en BD).
- Tras el primer login: pantalla **bloqueante** que obliga a crear contraseña fuerte.
- En cada login posterior: aviso **posponible** para completar `documento / celular / correo`
  (formulario del cliente sin VIP / comentario / imagen) → `PUT /api/acceso/datos/:sesId`.
- "¿Olvidaste tu contraseña?": acepta correo **o** celular. Correo → email; celular → WhatsApp
  (sender = `NRO_WHATSAPP` de la sucursal del cliente).
- BD: `USP_UPD_INS_REGISTRO_CLIENTE` reescrito (op 1/2/4 por `NUMERO_DOCUMENTO`; op 10 corregida;
  op 12/13 nuevas). Fuente en `app/sql/`, backup en `app/sql/backup/`.
- Pendiente de validar en el server de producción tras `NODE_ENV=production` + reinicio.

**Efecto secundario durante pruebas:** al probar la recuperación por celular se envió un WhatsApp
real al cliente ID 479 (`Lenin Alarcon`, 967754474). Su `CONTRASENA` se restauró a NULL. Avisar si
ese número corresponde a un cliente real en uso.

*(sin otros pendientes abiertos)*

> **Nota de arquitectura:** `olimpo_reserva` es la app **cliente** (consumo: reservar, ver Mis Citas, perfil propio). Empleados, Parámetros, Servicios por Sucursal y Sucursales son intencionalmente **solo lectura** aquí — el CRUD completo de esas entidades se hace desde una **app administrativa separada**, no desde este repo. No listar "completar CRUD de X" como pendiente de este proyecto salvo que el usuario indique explícitamente que se agregará gestión administrativa aquí.

---

## Notas de implementación activa

### Cómo agregar un nuevo módulo
1. Crear `app/apis/[modulo]Api.js` — rutas + pipeline de middlewares
2. Crear `app/controllers/[modulo]Controllers.js` — funciones async con `.then/.catch`
3. Crear `app/models/[modulo]Models.js` — CALL USP_… únicamente
4. Agregar en `app/index.js`: `app.use('/', require('./apis/[modulo]Api'))`
5. Agregar el schema Joi en `app/middlewares/schema.js`
6. Crear el SP en MariaDB siguiendo la nomenclatura `USP_[ACCION]_[RECURSO]`
7. Crear el JS frontend en `app/public/java/[modulo].js`
8. La vista se inyecta dinámicamente en `#cuerpoPrincipal` vía `vistaMenuSubMenu()`

### Cómo agregar un nuevo endpoint de solo lectura
```js
// apis/[modulo]Api.js
router.get('/api/[modulo]/listar/:id/:sesId', verificarToken, listar);

// controllers/[modulo]Controllers.js
const listar = (req, res) => {
    listar[Modulo](req.params.id, 'tabla_o_vista', req.params.sesId)
    .then(valor => res.json({ valor }))
    .catch(error => res.status(400).json({ error: { message: error.message, errno: error.errno, code: error.code } }));
};
```

### Cómo mostrar un nuevo offcanvas con formulario
```js
mostrar_general1({
    titulo: 'Título del panel',
    msg: `<div>...HTML del formulario...</div>`
});
// Para actualizar sin cerrar:
$('#contenidoGeneral1').html('...nuevo HTML...');
$('#tituloGeneral1').text('Nuevo título');
```

---

## Decisiones técnicas pendientes de validar

*(sin ítems abiertos actualmente)*
