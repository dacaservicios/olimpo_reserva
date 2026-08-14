# Histórico de módulos completados — olimpo_reserva

> **Regla estricta:** Este archivo representa decisiones y código ya consolidado en producción.
> NO reescribir ni revertir lo documentado aquí a menos que el usuario lo solicite **de forma explícita**.
> El código referenciado es fuente de verdad — no modificar sus patrones sin autorización.

> **Rotación por tamaño:** Si este archivo se acerca al límite de caracteres permitido para un archivo de contexto, crear `historico2.md` (y sucesivamente `historico3.md`, etc.) en `.claudedoc/` y continuar agregando ahí las épicas nuevas. Los archivos rotados deben añadirse a la tabla de mapa de documentación en `CLAUDE.md`. No mover contenido ya escrito entre archivos, solo continuar hacia adelante.

---

## Épicas completadas

### [x] Migración de tema UI: VALEX → Material Design Android (2025-05)
- Eliminada plantilla VALEX completa (`assets/plugins/`, `librerias/adminlte`).
- Eliminadas librerías: select2, DataTables, jquery-ui, inputmask, bootstrap-datepicker.
- Nuevo CSS único: `app/public/estilos/android.css` (dark + gold, frame 430px).
- Todos los modales Bootstrap reemplazados por offcanvas deslizables (`modal.js`).
- Top bar: solo logo + "Olimpo". Bottom nav: 3 ítems (Reservas · Mis Citas · Perfil).

### [x] Sistema de autenticación de clientes
- Login vía Passport (local strategy) + JWT para APIs.
- Sesión almacenada en MariaDB (`express-mysql-session`).
- Bloqueo por 3 intentos fallidos consecutivos.
- Auditoría de IP y hostname en cada acción de auth.
- Recuperación de contraseña por email (Nodemailer/Zoho SMTP).
- Cambio de contraseña con verificación de actual + requisitos en tiempo real.
- Cambio de contraseña: movido al `#offcanvasPassword` (z-index 1055), reemplazando el formulario que se cargaba en `#cuerpoPrincipal`.

### [x] Módulo de Reservas completo
- Vista principal: solo el día actual, tarjetas de reservas, sin navegación de meses.
- Wizard 5 pasos en `#general1` (offcanvas): tipo cliente → servicio → barbero → fecha/hora → confirmación.
- Detalle de reserva: hero con hora + fecha, filas de datos, badge de estado.
- Mis Citas (`#offcanvasMisCitas`): lista todas las reservas separadas en Próximas / Anteriores.
- Unique key corregida: `(ID_SUCURSAL, ID_EMPLEADO, FECHA_RESERVA)` — sin `ID_CLIENTE` (evita overbooking).
- Protección contra doble envío: botón se deshabilita al enviar; se restaura solo si falla.
- Campo `DESC_TIPO_CLIENTE` (alias en SP) — no usar `TIPO_CLIENTE` para evitar DUPLICATE FIELD NAME.

### [x] Notificaciones WhatsApp en reservas
- Integración con `https://whatsapp.aynisystem.com` via API REST.
- Header `x-api-key` en todas las llamadas.
- Envío a cliente Y barbero en: crear, editar, editarDD, eliminar.
- Tolerancia a fallos: `try/catch` en cada llamada; la operación principal de BD no se aborta si WhatsApp falla.
- En `crearReserva`: si WhatsApp falla, `resultado: true` pero mensaje de aviso visible en pantalla de éxito.
- El sender es `MAE_SUCURSAL.NRO_WHATSAPP` con prefijo `51`.

### [x] Limpieza de dependencias NPM (2025-05)
Eliminadas: `body-parser`, `express-validator`, `https`, `mailjet`, `multer`, `nodemailer-smtp-transport`, `npm-check-updates`, `request`.

### [x] PWA (Progressive Web App) — instalación Android + iOS (2025-06)
- `manifest.json` y `sw.js` servidos desde la raíz del dominio.
- Service worker configurado con `Service-Worker-Allowed: /`.
- Vista de instalación en `/instalar` (`instalar.ejs`).
- **Android Chrome:** usa `BeforeInstallPromptEvent` → botón "Instalar" con diálogo nativo.
- **iOS Safari:** instrucciones paso a paso en 3 pasos visuales (Compartir → Agregar a pantalla de inicio → Agregar) con flecha animada apuntando al botón Compartir.
- **iOS WebView (WhatsApp, Instagram, TikTok, etc.):** detectado por UA; muestra pantalla "Abre esto en Safari" con botón copiar enlace. Sin este paso iOS guarda un shortcut normal (con barra de direcciones).
- **Standalone ya activo:** redirect inmediato a `/` (login). Evita mostrar la página de instalación cuando la app ya está en el home screen.
- **Íconos `manifest.json`:** separados en entradas `"purpose": "any"` y `"purpose": "maskable"` (la notación combinada `"any maskable"` es rechazada por algunos validadores).
- **Limitación documentada:** iOS nunca dispara el diálogo de instalación automático (es decisión de Apple). El modo standalone requiere HTTPS en el servidor; con HTTP la barra de direcciones aparece igual aunque los meta tags sean correctos.

### [x] Offcanvas de cambiar contraseña (`#offcanvasPassword`)
- Flujo: verifica contraseña actual → cambia contraseña.
- Validación en tiempo real de 5 requisitos (longitud, número, mayúscula, minúscula, especial).
- Listeners: desactivado el listener jQuery del `#cambiaPassword` en `general.js` para evitar cargar el formulario antiguo en `#cuerpoPrincipal`.
- Apertura: desde `#offcanvasProfile` con `data-bs-dismiss="offcanvas"` + `setTimeout(abrirCambiaPasswordPanel, 350)`.

### [x] Scroll en offcanvas — barra nativa oculta
Todos los `.offcanvas-body` ocultan scrollbar nativo. El scroll táctil/rueda sigue funcionando.
Implementado con `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`.

### [x] Auto-logout por inactividad
`init()` en `general.js`: setInterval de 30 minutos (1,800,000 ms). Si no hay movimiento del mouse, llama `cerrarSesion()`.

### [x] Corrección bug barberos por sucursal
- El endpoint `empleado/listar` filtraba por sesión del cliente.
- El SP ahora obtiene `ID_SUCURSAL` del cliente internamente a partir de `sesId`.
- El wizard paso 3 filtra barberos por sucursal correctamente.

### [x] Verificación y corrección del SP de reservas en MariaDB — sede correcta (2026-08-13)
- **Verificado en BD real** (`SHOW CREATE PROCEDURE`, no hay `.sql` en el repo, se consultó directo en MariaDB): la rama `'crea'` de `USP_UPD_INS_RESERVA_CLIENTE` **ya guardaba correctamente** `_ID_SUCURSAL` (parámetro 8) en `TRS_RESERVA.ID_SUCURSAL`. No hizo falta cambiar nada ahí.
- **Bug real encontrado y corregido** en `USP_SEL_VERLISTA`, rama `'reserva_cliente'` (usada por `GET /api/reserva/listar/:id/:sesId`, la que alimenta la pantalla principal y "Mis Citas"):
  - Antes filtraba `AND TR.ID_SUCURSAL=@SUCURSAL`, donde `@SUCURSAL` era la sede del **perfil** del cliente (`MAE_CLIENTE.ID_SUCURSAL`) — no la sede real de cada reserva. Si un cliente reservaba en una sede distinta a la de su perfil (posible desde que el wizard permite elegir sede en el Paso 1), esa reserva **no aparecía en su propia lista** ("Mis Citas" / calendario).
  - Además esa rama no tenía ningún `JOIN` a `MAE_SUCURSAL`, así que el nombre de la sede nunca viajaba al frontend — imposible mostrarlo en el detalle.
  - **Fix aplicado directamente en MariaDB** (`DB_OLIMPO`, única BD — dev y prod apuntan al mismo `localhost:3306` según `.env.development`/`.env.production`): se quitó el filtro `ID_SUCURSAL=@SUCURSAL` (queda solo `ID_CLIENTE=_idSesion`) y se agregó `INNER JOIN MAE_SUCURSAL SU ON TR.ID_SUCURSAL=SU.ID_SUCURSAL` + `SU.NOMB_SUCURSAL AS NOMBRE_SUCURSAL` al `SELECT`. Probado con `CALL USP_SEL_VERLISTA(0,'reserva_cliente',844)` — devuelve las 8 reservas del cliente con `NOMBRE_SUCURSAL` correcto.
  - **Precaución para el futuro:** `USP_SEL_VERLISTA` es un procedimiento único y gigante (500+ líneas) compartido por muchos módulos de un sistema más grande (se ven tablas `SEG_USUARIO`, `TRS_VENTA`, `TRS_CAJA`, etc.). Cualquier cambio futuro debe tocar **solo** la rama `ELSEIF` correspondiente y no asumir que es exclusivo de `olimpo_reserva`.
- **Segundo bug real encontrado y corregido** en `USP_UPD_INS_DETALLE`, rama `'verificaHora_reserva'` (calcula las horas ocupadas de un barbero en una fecha — Paso 4 del wizard, usada por `GET /api/reserva/listar/hora/:empleadoId/:fecha/:sesId`):
  - Mismo patrón de bug: filtraba `AND TR.ID_SUCURSAL=@SUCURSAL` con `@SUCURSAL` = sede del **perfil** del cliente que consulta, no la sede real del barbero/reserva. **Esto permitía doble-reserva real**: un Cliente A (perfil Sede Centro) reservaba con un barbero de Sede Norte; un Cliente B (también perfil Sede Centro) consultando el mismo barbero/fecha no veía esa hora como ocupada (porque el SP buscaba reservas "en Sede Centro", no en la sede real del barbero) y podía reservar la misma hora con el mismo barbero.
  - Tampoco filtraba `ES_ELIMINADO=0`, así que una reserva borrada lógicamente seguía bloqueando el horario para siempre.
  - **Fix**: se quitó el filtro de sucursal por completo (basta `ID_EMPLEADO + fecha`, porque cada barbero pertenece a una sola sede real) y se agregó `TR.ES_ELIMINADO=0`. **Aplicado manualmente por el usuario** en MariaDB (el comando automático fue bloqueado por el clasificador de seguridad al detectar `DROP PROCEDURE`; se le entregó el script SQL ya armado y verificado con `diff` contra el original).
  - Query final:
    ```sql
    ELSEIF _tipo='verificaHora_reserva' THEN
        SELECT TIME_FORMAT(TR.FECHA_RESERVA, '%H:%i') AS HORA
        FROM TRS_RESERVA TR
        WHERE TR.ES_ELIMINADO=0
        AND DATE(TR.FECHA_RESERVA)=_dato
        AND TR.ID_EMPLEADO =_id;
    ```
- **Validación end-to-end del flujo de sede** (código + SPs revisados juntos, 2026-08-13): confirmado que el circuito completo respeta la sede elegida en el Paso 1 —
  - Paso 2 (`_wizStep2`) filtra `_wizData.servicios` por `ID_SUCURSAL`; el SP `'servicioSucursal_reserva'` trae todos los servicios de todas las sedes sin filtrar, cada uno con su `ID_SUCURSAL` real.
  - Paso 3 (`_wizStep3`) filtra `_wizData.barberos` por `ID_SUCURSAL`; el SP `'empleado_reserva'` trae todos los empleados de todas las sedes sin filtrar, cada uno con su `ID_SUCURSAL` real.
  - Paso 4: horarios ocupados ya corregidos (ver arriba).
  - Creación y listado: ya corregidos (ver arriba).
- **Frontend:** `reserva.js → verDetalleReserva()` ahora muestra una fila "Sede" con `evt.NOMBRE_SUCURSAL`.

### [x] Cliente ya no puede editar ni cancelar reservas desde la app (2026-08-13)
- **Regla de negocio:** permitir que el cliente edite u cancele su cita libremente generaba caos operativo. Si el cliente necesita mover o cancelar una cita, debe comunicarse con el admin de la sucursal por WhatsApp (el número ya se muestra/usa en las notificaciones, `NRO_WHATSAPP`).
- **Cambio aplicado:** en `reserva.js → verDetalleReserva()` se eliminó por completo el bloque que renderizaba los botones "Editar" y "Cancelar Cita" del detalle de reserva. Ya no aparecen en ningún caso (antes dependían del flag `soloLectura`).
- **Nota — código huérfano intencional:** las funciones `abrirEdicionReserva`, `_editLoadReserva`, `_editLoadTimes`, `guardarCambiosReserva`, `_resCancelarActual` (frontend) y las rutas `PUT /api/reserva/editar/:id`, `reservaElimina` (backend) **siguen existiendo en el código** pero ya no son alcanzables desde la UI del cliente. No se eliminaron a propósito (fuera de alcance de este cambio, y podrían reutilizarse desde la app administrativa). No las vuelvas a activar en la UI de cliente sin que el usuario lo pida explícitamente.

### [x] Wizard — selección de sede y filtrado dinámico por sucursal (2026-05-30)
- **Paso 1 ahora incluye selección explícita de sede**, además del tipo de cliente (`reserva.js → _wizStep1()`). Ya no se limita a precargar `_wiz.sucursalId` desde `#userSucursal` al abrir el wizard — el cliente elige la sede entre las sucursales de su empresa (`_wizData.sucursales`, cargadas vía `GET /api/sucursal/listar/:idEmpresa/:sesId`).
- Al cambiar de sede se resetea el servicio seleccionado (`_wiz.servicioId`, `servicioNombre`, `servicioDur`) para evitar arrastrar un servicio de otra sucursal.
- **Paso 2** (`_wizStep2`) filtra `_wizData.servicios` por `s.ID_SUCURSAL == _wiz.sucursalId`.
- **Paso 3** (`_wizStep3`) filtra `_wizData.barberos` por `b.ID_SUCURSAL == _wiz.sucursalId`.
- **Causa raíz del bug original:** la vista/SP `empleado_reserva` filtraba empleados por la sucursal de la sesión del cliente en vez de exponer el `ID_SUCURSAL` real de cada barbero. Corregido directamente en la vista de MariaDB — ahora devuelve todos los empleados de la empresa con su `ID_SUCURSAL` real, y el filtro de frontend por sede seleccionada funciona correctamente.
- `ES_VIGENTE == 1` se filtra una sola vez en el preload del wizard (`nuevaReservaFecha`), no se repite en cada paso.
- **Nota:** `domain-logic.md` (tabla "Flujo del Wizard — 5 pasos") y la descripción del estado `_wiz.sucursalId` fueron actualizados para reflejar este comportamiento.

### [x] Precio de servicio (Paso 2 del wizard) y foto de referencia + precio en resumen/detalle (2026-08-13)
- **Precio en Paso 2:** cada tarjeta de servicio (`_wizStep2`) muestra `S/ {PRECIO}` bajo el nombre; el valor se captura en `_wiz.servicioPrecio` al seleccionar (dato ya presente en la respuesta de `servicioSucursal_reserva`, no requirió cambios de BD).
- **Foto de referencia (Paso 5):** se agregó UI de adjuntar imagen con dos botones — "Tomar foto" (`<input type=file accept="image/*" capture="environment">`) y "Galería" (`<input type=file accept="image/*">`, sin `capture`) — con vista previa (`FileReader` + dataURL) y botón para quitarla. Estado en `_wiz.imagenFile` (objeto `File`) y `_wiz.imagenPreview` (dataURL).
- **Envío:** `_wizEnviar()` agrega el archivo al `FormData` bajo el campo `imagen` solo si existe.
- **Backend:**
  - Ruta `POST /api/reserva/crear` ahora incluye el middleware `verificaAdjunto` (mismo usado por `clienteApi`) antes de `verificarToken`, para validar tamaño/formato y setear `req.archivo`.
  - `reservaControllers.js → crear()`: genera un nombre de archivo seguro `RES_{sesId}_{timestamp}.{extensión ya validada}` (**no** se usa el nombre original del archivo para evitar path traversal) y hace `mv()` a `app/public/imagenes/reserva/` (carpeta nueva, mismo patrón que `imagenes/cliente/`) después de crear la reserva.
  - `reservaModels.js → crearReserva(body, nombreImagen)`: pasa el nombre de archivo como 11º parámetro del SP.
- **Base de datos (verificado y aplicado directamente en MariaDB, `DB_OLIMPO`):**
  - `ALTER TABLE TRS_RESERVA ADD COLUMN IMAGEN VARCHAR(150) NULL AFTER COMENTARIO;`
  - `USP_UPD_INS_RESERVA_CLIENTE`: nuevo parámetro `IN _IMAGEN VARCHAR(150)` (11º, al final). La rama `'crea'` lo guarda en el INSERT y lo devuelve en el SELECT junto con `@PRECIO_SERVICIO` (nuevo `SET` global, `TRS_SERVICIO_SUCURSAL.PRECIO`). Las ramas `'edita'`/`'editaDD'` aceptan el parámetro pero no lo usan (no forman parte del alcance — el cliente no puede editar reservas, ver épica más abajo). Los tres `CALL` desde `reservaModels.js` (`crearReserva`, `editarReserva`, `editarReservaDD`) se actualizaron para pasar el 11º argumento (`null` en los dos últimos), ya que MariaDB exige los 11 posicionales sin importar la rama.
  - `USP_SEL_VERLISTA` (procedimiento compartido por 20 esquemas/tenants — **se modificó únicamente la copia de `DB_OLIMPO`**): ramas `'reserva'` y `'reserva_cliente'` ahora agregan `SS.PRECIO AS PRECIO_SERVICIO` al `SELECT`. `IMAGEN` viaja automáticamente vía `TR.*` una vez agregada la columna, sin tocar el SP en este punto.
- **Frontend — resumen y detalle:**
  - `_wizShowSuccess()`: fila "Precio" (desde `_wiz.servicioPrecio`, sin esperar al SP) + imagen de vista previa (`_wiz.imagenPreview`, local, sin round-trip).
  - `verDetalleReserva()`: fila "Precio" (`evt.PRECIO_SERVICIO`) y bloque de imagen (`evt.IMAGEN` → `/imagenes/reserva/{IMAGEN}`, servida por el static route `/imagenes` ya existente).
- **Verificado end-to-end** contra el servidor de desarrollo ya corriendo (`npm start`, nodemon recargó los cambios de backend automáticamente): `POST /api/reserva/crear` con imagen adjunta vía `multipart/form-data` → archivo guardado en disco, accesible en `/imagenes/reserva/...`, y reflejado con `IMAGEN`+`PRECIO_SERVICIO` correctos al releer con `GET /api/reserva/listar/0/:sesId`. También verificado el caso sin imagen (comportamiento sin cambios). Reservas y archivo de prueba eliminados tras la verificación.

### [x] Orden descendente en "Próximas" — Mis Citas (2026-08-13)
- `abrirMisCitas()`: la sección "Próximas" ahora ordena descendente (la fecha futura más lejana primero, bajando hasta la más próxima a hoy). La sección "Anteriores" no cambió (ya era descendente, la más reciente del pasado primero).

### [x] Corrección WhatsApp — envío de mensajes
- Corregido header `x-api-key` faltante en los calls.
- Corregido campo `sender` con `NRO_WHATSAPP` de la sucursal.
- Commits de referencia: `2b0599c` (corrección envío mensajes WhatsApp).
