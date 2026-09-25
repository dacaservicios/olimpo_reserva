# Implementación — Tareas activas y flujos en construcción

> Este archivo es el espacio de trabajo activo del sprint. Actualizar al iniciar y terminar cada tarea.
> Los ítems marcados `[x]` pasan a `.claudedoc/historico.md` cuando el módulo queda consolidado.

---

## TAREA ACTUAL / PENDIENTES

### [ ] Cron desactivados (2026-09-25, decisión del usuario) — pendiente de desplegar
- `cronNode()` quedó comentado en `app/config/server.js`. `app/config/cron.js` se conserva sin cambios.
- Los 5 cron eran una copia de los de olimpo: verificar pagos (10:00), flujo de caja diario (08:00) y mensajes masivos de WhatsApp (12:00). Llamaban a la API de olimpo a la misma hora que los originales, lo que producía mensajes duplicados. Los 2 por hora del dashboard llamaban a `/api/inicio/dashboard`, que no existe en olimpo.
- Además, desde la Fase 5 de olimpo esas rutas exigen un token de servicio que esta app no tiene. Los cron viven solo en olimpo.

### [ ] Hash de contraseña fuera de las respuestas (2026-09-25) — probado en local, pendiente de desplegar
- `clienteModels.buscarCliente` (`GET /api/cliente/buscar`, rama `'cliente_reserva'`) devolvía `CONTRASENA` (hash) al navegador. Ahora la borra antes de responder, igual que ya hacía `inicioModels.datosUsuario`.
- La rama `'cliente_reserva'` sigue trayendo `CONTRASENA`, porque `datosUsuario` la necesita en el servidor. En olimpo se quitó `CONTRASENA`/`CLAVE` de las ramas `'usuario'`/`'cliente'` (script `olimpo/.scratch_sp/seguridad_columnas_sensibles.sql`).

### [ ] Fase 4 parte C de olimpo (2026-09-25) — solo BD, probado en local, pendiente de desplegar
- `USP_UPD_INS_RESERVA_CLIENTE` ahora valida, en todos los tipos, que el cliente reserve solo para sí mismo (`body.cliente` = el cliente del token, o 0), con empleado, servicio y sucursal de su empresa. Si no → *"¡Uno de los datos seleccionados no pertenece a su empresa!"*.
- El asistente de reserva ya manda al propio cliente, así que el flujo normal no cambia. Esta app no tiene cambios de código en esta parte. Script: `olimpo/.scratch_sp/multitenant_fase4_referencias.sql`.

### [x] Ajuste por el multitenant del sistema olimpo (2026-09-24) — **desplegado en producción 2026-09-25** junto con olimpo
El sistema interno (repo `olimpo`) aisló por empresa los SPs compartidos. Ahí el `_idSesion` es un usuario de `SEG_USUARIO`, y aquí es el **ID del cliente**. Por eso esta app usa ahora ramas propias, filtradas por la empresa del cliente (script de BD en `olimpo/.scratch_sp/multitenant_reserva_publica.sql`):
- `VERLISTAID 'cliente_reserva'` (antes `'cliente'`): el cliente solo se consulta a sí mismo. Se usa en `clienteControllers.buscar` e `inicioModels.datosUsuario`.
- `VERLISTA 'sucursal_reserva'` (antes `'sucursal'`, en `sucursalControllers.listar`): solo sucursales de la empresa del cliente.
- `VERLISTAID 'empleado_reserva'` (antes `'empleado'`, en `empleadoControllers.buscar`): solo empleados de la empresa del cliente.
- `VERLISTA 'empleado_reserva'` / `'servicioSucursal_reserva'`: mismos nombres, pero ahora filtran por la empresa del cliente (antes devolvían todas las empresas).
- `VERLISTAID 'reserva_cliente'` (antes `'reserva'`, en `reservaControllers.buscar`): solo reservas del propio cliente. La rama interna `'reserva'` calculaba `@NIVEL` desde `SEG_USUARIO` con el ID del cliente y en la práctica no devolvía filas.
- `USP_DEL_ELIMINA` / `USP_UPD_ESTADO` tienen un **3er parámetro** `_idSesion`. `reservaModels.eliminarReserva/estadoReserva` pasan `0`, porque la rama `'reserva'` no lo usa.
- **Socket (sincronizado con olimpo):** se quitaron de `config/webSocket.js` y `public/java/webSocket.js` los eventos del módulo Pedido/mesa, eliminado en olimpo, que nadie emitía (`creaPedido*`, `editaPedido*`, `eliminaPedido`, `actualizaEstadoPedido(Mozo)`, `actualizaFechaPedido`, `actualizaMesas`, `actualizaImpresion`, `actualizaStockCarta(Abastecer)`, `cerrarVenta`, `sunatPedido`, `joinMozo/Cajero/Administrador/CajeroAdministrador`). El respaldo está en `olimpo/.scratch_sp/backups/socket_20260924/olimpo_reserva/`.
- **Lote 3.5 de olimpo (sin impacto aquí):** se filtraron por empresa `VERLISTAID 'pagosMembresia'` y `'miParametroDetalle'` (`olimpo/.scratch_sp/multitenant_lote35.sql`). Esta app no usa esas ramas; `'parametroDetalle'` (la que sí usa) no cambió.
- **Fase 4 de olimpo (escritura):**
  - `verificarToken` reemplaza `sesId` (params y body) por el ID del cliente del JWT, igual que olimpo. Un cliente ya no puede pasar el ID de otro.
  - Eliminar/estado de reserva: `reservaControllers` pasa `('reserva_cliente', req.usuario.data.id)` a `eliminarReserva`/`estadoReserva`. El SP valida que la reserva sea del cliente. Antes pasaba `0` y no validaba nada.
  - Editar perfil (`accesoModels.actualizaDatosCliente`): tipo `'editaCli'` en `USP_UPD_INS_CLIENTE`. El cliente solo se edita a sí mismo.
  - Editar reserva / arrastrar en el calendario (`USP_UPD_INS_RESERVA_CLIENTE`, `edita`/`editaDD`): el SP valida que la reserva sea del cliente (`body.sesId`, ahora del token).
  - Scripts de BD: `olimpo/.scratch_sp/multitenant_fase4_generico.sql` y `multitenant_fase4_edita.sql`. **Desplegar junto con olimpo:** con los SPs nuevos, el código viejo de esta app no puede eliminar ni cambiar el estado de reservas.
- Pendiente (hallazgos, sin tocar):
  - ~~**CRÍTICO:** esta app y olimpo usaban el mismo `SEED` JWT~~ → **corregido en local (2026-09-24):**
    - `SEED` nuevo en `app/config/.env.development` y `.env.production`.
    - El token lleva `tipo: 'cliente'` (`inicioModels`) y `verificarToken` rechaza cualquier otro tipo. olimpo hace lo mismo con `tipo: 'usuario'`.
    - **Producción:** el servidor tiene que usar el `SEED` nuevo, y las dos apps se despliegan juntas. Los clientes tendrán que volver a iniciar sesión.
  - `clienteModels.editarCliente` (`PUT /api/cliente/editar/:id`) está roto: escribe `0` seguido de `(...)`, lo que es una llamada a función y falla al ejecutarse. La UI no lo usa.
  - `VERLISTA 'cliente'` (listar clientes) y `'reserva_cliente'` siguen usando las ramas internas.

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
