# Implementación — Tareas activas y flujos en construcción

> Este archivo es el espacio de trabajo activo del sprint. Actualizar al iniciar y terminar cada tarea.
> Los ítems marcados `[x]` pasan a `.claudedoc/historico.md` cuando el módulo queda consolidado.

---

## TAREA ACTUAL / PENDIENTES

- [ ] Actualizar `USP_UPD_INS_RESERVA_CLIENTE` para recibir y guardar correctamente `ID_SUCURSAL` del wizard (ver memoria: `project_pendiente_sucursal_sp.md`)
- [ ] Verificar que `_wizStep3` filtra barberos por `ID_SUCURSAL` del cliente logueado (ver memoria: `project_wizard_sucursal_filtro.md`)
- [ ] Completar CRUD de empleados (actualmente solo listar/buscar)
- [ ] Completar gestión de parámetros (actualmente solo listar detalle)
- [ ] Completar gestión de servicios por sucursal
- [ ] Completar gestión de sucursales
- [ ] Desbloquear módulo de facturación (código comentado)
- [ ] Implementar vista de perfil cliente (`#miPerfil` — actualmente el ID no existe en el DOM)

---

## Flujos con comportamiento especial en construcción

### Wizard — filtro de barberos por sucursal
**Contexto:** El paso 3 del wizard carga barberos. La causa raíz del bug era que `empleado/listar` filtraba por la sesión del cliente, no por `ID_SUCURSAL` explícito.

**Estado actual:**
- El endpoint `GET /api/empleado/listar/:id/:sesId` recibe `id` (actualmente 0 para "todos") y `sesId` (ID_CLIENTE).
- El SP interno recupera `ID_SUCURSAL` del cliente a partir de `sesId`.
- Pendiente verificar que el SP filtra correctamente cuando hay varias sucursales.

**Comportamiento esperado:**
- En `_wizStep3`: solo mostrar barberos de la sucursal del cliente logueado.
- Si no hay barberos disponibles: mostrar estado vacío con mensaje.

---

### Sucursal en la creación de reserva
**Contexto:** El wizard envía `sucursal: _wiz.sucursalId` en el body de `POST /api/reserva/crear`.

**Estado actual:**
- `_wiz.sucursalId` se inicializa como `$('#userSucursal').val()` al abrir el wizard.
- El SP `USP_UPD_INS_RESERVA_CLIENTE` recibe el parámetro `sucursal` (posición 8, base-0).
- Pendiente confirmar que el SP lo guarda correctamente en `TRS_RESERVA.ID_SUCURSAL`.

**Comportamiento esperado:**
- Que `TRS_RESERVA.ID_SUCURSAL` = sucursal del cliente = sucursal del barbero.
- La unique key `(ID_SUCURSAL, ID_EMPLEADO, FECHA_RESERVA)` usa este campo.

---

### Módulo de facturación
**Estado:** Código comentado en controllers/models. Depende de API externa `apisperu` (URL_FACTURACION + TOKEN_FACTURACION en `.env`).

**Variables de entorno requeridas:**
```
URL_FACTURACION=...
TOKEN_FACTURACION=...
URL_DOCUMENTO=...      (para consulta DNI/RUC)
TOKEN_DOCUMENTO=...
```

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

- **¿Debe `editarReserva` poder cambiar el barbero?** Actualmente NO — el SP mantiene el barbero original. Si se requiere cambiar barbero, necesita nuevo SP o parámetro adicional.
- **¿Múltiples sucursales por empresa?** La arquitectura lo soporta (`ID_SUCURSAL` en todas las tablas maestras), pero la UI actual solo muestra la sucursal del cliente logueado.
- **`clientePerfil.js`** — El ID `#miPerfil` no existe en el DOM actual de `sistema.ejs`. Si se reactiva el perfil de cliente, agregar el botón en la bottom nav o en el offcanvas de perfil.
