# Histórico de módulos completados — olimpo_reserva

> **Regla estricta:** Este archivo representa decisiones y código ya consolidado en producción.
> NO reescribir ni revertir lo documentado aquí a menos que el usuario lo solicite **de forma explícita**.
> El código referenciado es fuente de verdad — no modificar sus patrones sin autorización.

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
- Detalle de reserva: hero con hora + fecha, filas de datos, badge de estado, botones Editar/Cancelar.
- Edición: reemplaza contenido del mismo `#general1` sin cerrarlo. Solo cambia fecha/hora/comentario.
- Mis Citas (`#offcanvasMisCitas`): lista todas las reservas separadas en Próximas / Anteriores.
- Anteriores: modo solo lectura (sin botones de acción).
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

### [x] Corrección WhatsApp — envío de mensajes
- Corregido header `x-api-key` faltante en los calls.
- Corregido campo `sender` con `NRO_WHATSAPP` de la sucursal.
- Commits de referencia: `2b0599c` (corrección envío mensajes WhatsApp).
