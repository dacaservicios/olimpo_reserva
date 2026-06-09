# UI/UX Rules — olimpo_reserva

> Tema: **Material Design Android — Dark + Gold**
> Archivo CSS único: `app/public/estilos/android.css`

---

## Paleta de colores (variables CSS)

```css
--md-bg:       #0d0d0d   /* fondo de página */
--md-surface:  #1a1a1a   /* cards, offcanvas, panels */
--md-primary:  #c9a227   /* dorado — acento principal */
--md-on-surf:  #e0e0e0   /* texto sobre superficie */
--md-divider:  #2a2a2a   /* bordes y separadores */
--md-max-w:    430px     /* ancho del frame de teléfono */
--md-frame-l:  max(0px, calc(50% - 215px))  /* left/right para elementos fixed */
```

Colores de estado (reservas):
```
PENDIENTE  → naranja  (#f59e0b / badge-warning)
CONFIRMADO → verde    (#22c55e / badge-success)
CANCELADO  → rojo     (#ef4444 / badge-danger)
COMPLETADO → azul     (#3b82f6 / badge-info)
```

---

## Frame de teléfono

La app se renderiza centrada simulando un teléfono Android (max 430 px) sobre fondo `#030303`.
**Todos los elementos `position:fixed`** (top bar, bottom nav, botón nueva reserva, offcanvas, WhatsApp float) usan:
```css
left: var(--md-frame-l);
right: var(--md-frame-l);
```

---

## Layout principal (`views/inicio/sistema.ejs`)

| Zona | ID/Clase | Descripción |
|---|---|---|
| Top bar | `.android-top-bar` | Fija. Solo logo + texto "Olimpo". Sin íconos de módulos. |
| Contenido | `#cuerpoPrincipal` `.android-content` | Padding top/bottom reservado para barras fijas. |
| Bottom nav | `.android-bottom-nav` | Fija. 3 ítems: Reservas · Mis Citas · Perfil. |
| Loader global | `#global-loader` | Oculta contenido durante carga. |
| Script loader | `#jsPropio` | Los JS de módulo se inyectan dinámicamente aquí. |

**Bottom nav — 3 ítems fijos:**
```
Reservas  → onclick="irReservas()"      id="navReservas"
Mis Citas → onclick="abrirMisCitas()"   id="navMisCitas"
Perfil    → data-bs-toggle="offcanvas" data-bs-target="#offcanvasProfile"  id="navPerfil"
```

**Navegación de módulos:**
```js
vistaMenuSubMenu({ ruta: 'reserva', idSubMenu: 88 })
// NUNCA cambiar la firma de esta función
```

---

## Jerarquía de Offcanvas

| ID | z-index | Uso |
|---|---|---|
| `#offcanvasProfile` | 1050 | Perfil: nombre, cambiar contraseña, cerrar sesión |
| `#offcanvasMisCitas` | 1050 | Listado de reservas del cliente agrupadas |
| `#offcanvasPassword` | 1055 | Formulario cambiar contraseña |
| `#general1` | 1060 | Formularios principales, detalle y wizard de reserva |
| `#general2` | 1070 | Formularios secundarios |
| `#general3` | 1080 | Formularios terciarios |

### API de offcanvas (`modal.js`)
```js
// Abrir con contenido HTML
mostrar_general1({ titulo: 'Título', msg: '<html>' })
mostrar_general2({ titulo: 'Título', msg: '<html>' })
mostrar_general3({ titulo: 'Título', msg: '<html>' })

// Cerrar
cerrar_general1()
cerrar_general2()
cerrar_general3()

// Actualizar sin cerrar/reabrir
$('#tituloGeneral1').text('Nuevo título')
$('#contenidoGeneral1').html('<html nuevo>')
```

### Scroll en offcanvas
Todos los `.offcanvas-body` ocultan scrollbar nativo (táctil/rueda sigue funcionando):
```css
scrollbar-width: none;
&::-webkit-scrollbar { display: none; }
```

---

## Wizard de Nueva Reserva (`.wiz-*`)

**Clase `wiz-active` en `#general1`:**
- Se añade al abrir el wizard: `$('#general1').addClass('wiz-active')`
- Se remueve al abrir detalle o edición: `$('#general1').removeClass('wiz-active')`

**Cuando `wiz-active` está activo**, el layout del offcanvas cambia:
```
#general1.wiz-active .offcanvas-body → overflow:hidden; display:flex; flex-direction:column
.wiz-container                       → flex:1; min-height:0; overflow:hidden
.wiz-content (scroll real)           → flex:1; overflow-y:auto; scrollbar-width:none
.wiz-nav (botones fijos fondo)       → flex-shrink:0
```

---

## Cambiar Contraseña (`#offcanvasPassword`)

Clases CSS propias:
```
.md-pass-wrap          contenedor input + botón toggle
.md-pass-toggle        botón ojo (toggle visibilidad)
.md-pass-msg           mensaje de error/éxito debajo del input
.md-pass-reqs          chips de requisitos de contraseña
.req-item              chip inactivo (gris)
.req-item.met          chip activo (verde)
.md-pass-btn-save      botón guardar
```

Requisitos de contraseña: 6–16 chars · número · mayúscula · minúscula · especial.

---

## Login (`views/inicio/login.ejs`)

```
.android-login-screen
  └─ .login-hero        (logo + nombre del sistema)
  └─ .login-card        (formulario de acceso)
        └─ button.submit       ← clase "submit" OBLIGATORIA (la usa login.js)
        └─ span#verPass        ← toggle de contraseña (la usa login.js)
```

---

## Carga de CSS y JS

**`head.ejs` (app protegida):**
`icons.css` · Bootstrap 5 · Spectrum · `android.css`

**`headInicio.ejs` (login/registro):**
`icons.css` · Bootstrap 5 · `android.css`

**`footer.ejs` (app protegida):**
jQuery · Bootstrap 5 (popper+bootstrap) · `modal.js` · Moment · blockUI · SweetAlert2 · Axios · `validacion.js` · `general.js` · Socket.IO · `webSocket.js` · Spectrum

**`footerInicio.ejs` (login/registro):**
jQuery · Bootstrap 5 · Moment · blockUI · SweetAlert2 · `login.js` · `validacion.js`

El loader del login se oculta con `$(window).on('load', fn)` en `footerInicio.ejs`.

---

## Helpers globales (`general.js`)

```js
bloquea()                     // muestra blockUI
desbloquea()                  // oculta blockUI
verSesion()                   // lee #userSesion → ID_CLIENTE
verToken()                    // lee localStorage 'token'
mensajeError(err)             // parsea error Axios y muestra Swal
limpia(selector)              // vacía campos del formulario
confirm(msg, cancelFn, okFn) // SweetAlert2 confirm
success(msg, titulo)          // SweetAlert2 success toast
```

**Sesión activa detectada vía:** `#userSesion` (hidden input en sistema.ejs).
**Token almacenado en:** `localStorage['token']`.
**Auto-logout:** inactividad de 30 min (setInterval en `init()`).

---

## Componentes de UI — convenciones

| Componente | Clase / ID | Notas |
|---|---|---|
| Botón primario | `.md-btn-primary` o `btn btn-warning` | Color `--md-primary` |
| Badge de estado | `.badge .bg-warning/success/danger/info` | Ver colores de estado arriba |
| Card de reserva | `.md-res-card` | Borde izquierdo con color del barbero |
| Encabezado de hoy | `.md-today-header` | Día semana + número + mes/año |
| Botón nueva reserva | `.md-nueva-reserva-btn` | Fixed, fondo de pantalla |
| WhatsApp float | `.md-wa-float` | Fixed, encima del botón nueva reserva |
| Empty state | `.md-cal-empty` | Ícono + texto centrado |

---

## Lo que NO hacer

- **NO** usar `position:fixed` sin `left/right: var(--md-frame-l)` — queda desalineado del frame.
- **NO** agregar scrollbar nativo a `.offcanvas-body` — siempre ocultarlo con CSS.
- **NO** cargar librerías eliminadas: select2, DataTables, jquery-ui, inputmask, bootstrap-datepicker, AdminLTE, VALEX.
- **NO** usar modales Bootstrap clásicos (`$('#modal').modal('show')`) — el sistema usa offcanvas.
- **NO** cambiar la firma de `vistaMenuSubMenu({ruta, idSubMenu})`.
- **NO** añadir ícono de perfil ni módulos a la top bar — solo logo + "Olimpo".
- **NO** olvidar remover `wiz-active` de `#general1` al salir del wizard (detalle/edición).
- **NO** duplicar el listener de `#cambiaPassword` — está desactivado en `general.js` (`$('#cambiaPassword').off('click')`).
- **NO** renderizar contenido en `#cuerpoPrincipal` sin considerar el padding de top/bottom bar.
- **NO** crear un FAB global — el botón "Nueva Reserva" es exclusivo del módulo reservas.
