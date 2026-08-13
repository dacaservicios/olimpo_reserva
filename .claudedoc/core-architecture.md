# Core Architecture — olimpo_reserva

---

## Entry Point

```
app/index.js
  ├── require('./config/server')   → inicializa Express, sesión, Passport, Socket.IO, cron
  ├── routes/inicioRouter          → rutas de vistas EJS (login, sistema, instalar)
  └── apis/*.js                   → 8 routers API montados en '/'
```

Orden de montaje de APIs en `index.js`:
1. `inicioApi` — login, logout, recupera password
2. `reservaApi`
3. `clienteApi`
4. `empleadoApi`
5. `accesoApi` — cambio contraseña, verificación, logout JWT
6. `parametroApi`
7. `serviciosucursalApi`
8. `sucursalApi`

---

## Configuración del entorno (`config/config.js`)

```js
const NODE_ENV = 'development'; // cambiar a 'production' manualmente
require('dotenv').config({ path: `.env.${NODE_ENV}` });
```

Variables de entorno expuestas:
```
HOST, PORT                          → servidor Express
HOST_BD, USER_BD, PASSWORD, DATABASE, PORT_BD  → MariaDB
SEED, EXPIRATION                    → JWT (secret + expiración)
SECRETO                             → secret de sesión Express
HOST_EMAIL, PORT_EMAIL, USER_EMAIL, PASSWORD_EMAIL  → SMTP Zoho
URL_WHATSAPP, URL_WHATSAPP2, URL_WHATSAPP3          → endpoints WhatsApp
API_KEY_WHATSAPP                                    → header x-api-key
URL_FACTURACION, TOKEN_FACTURACION                  → apisperu facturación
URL_DOCUMENTO, TOKEN_DOCUMENTO                      → apisperu DNI/RUC
TAMANO_ADJUNTO, MAX_ANCHO, MAX_ALTO                 → validación de archivos
```

---

## Autenticación — Doble mecanismo

### 1. Sesión Passport (vistas EJS)
- Estrategia: `passport-local` (`'local.login'`)
- Campos: `txtCorreo` (usernameField), `txtContrasena` (passwordField)
- Serialización: serializa el objeto `user` completo
- Deserialización: llama `buscarCliente(user.id, 'cliente', user.id)`
- Sesión almacenada en MariaDB via `express-mysql-session`
- Middleware de protección: `isLogin` → redirige a `/` si no autenticado
- Middleware de protección inversa: `notLogin` → redirige a `/sistema` si ya autenticado

### 2. JWT (APIs REST)
- Generado en `inicioModels.js → login()` al login exitoso
- Payload: `{ data: { id, idSucursal, idEmpresa } }`
- Secret: `config.SEED`, expiración: `config.EXPIRATION`
- Almacenado en el frontend: `localStorage['token']`
- Header esperado: `Authorization: Bearer <token>`
- Middleware: `verificarToken` inyecta `req.usuario = jwtData`

### Flujo de login completo
```
1. POST /inicio/login (inicioApi)
2. middleware verificarLogin (auth.js) → valida password con bcrypt + audita IP
3. Si ok: Passport done(null, user) + JWT generado
4. Frontend guarda JWT en localStorage
5. Requests API: siempre incluir header Authorization: Bearer <token>
```

---

## Sesión y datos de usuario en frontend

```html
<!-- Hidden inputs en sistema.ejs (disponibles en todo el sistema) -->
<input type="hidden" id="userSesion"   value="<%= user.id%>">
<input type="hidden" id="userSucursal" value="<%= user.idSucursal%>">
<input type="hidden" id="userNivel"    value="">
<input type="hidden" id="userEmpresa"  value="<%= user.idEmpresa%>">
```

Acceso en JavaScript (`general.js`):
```js
verSesion()   → $('#userSesion').val()      // ID_CLIENTE
verToken()    → localStorage.getItem('token')
```

---

## Sesión Express + Store MySQL

```js
session({
    secret: config.SECRETO,
    resave: true,
    saveUninitialized: true,
    store: new mysqlStore({ host, user, password, database })
})
```

La tabla de sesiones es gestionada automáticamente por `express-mysql-session`.

---

## Socket.IO (`config/webSocket.js`)

- Inicializado en `server.js`: `SocketIO(server)`
- Uso: notificaciones en tiempo real (reservas, dashboard)
- Cliente: `socket.io.js` cargado en `footer.ejs`
- Archivo cliente: `app/public/java/webSocket.js`

---

## PWA

Rutas servidas desde la raíz del dominio:
```js
GET /manifest.json → app/public/pwa/manifest.json
GET /sw.js         → app/public/pwa/sw.js
```

Service worker configurado con `Service-Worker-Allowed: /`.

---

## node-cron (`config/cron.js`)

- Inicializado en `server.js`: `cronNode()`
- Uso: tareas programadas (limpieza de sesiones, reportes diarios, etc.)
- Integrado con el módulo Dashboard

---

## Carga dinámica de scripts de módulo

Los JS específicos de cada vista se inyectan en `#jsPropio`:
```js
// En vistaMenuSubMenu() de general.js:
$('#jsPropio').html('<script src="/java/[modulo].js"></script>')
```

Scripts cargados dinámicamente:
- `/java/reserva.js` → vista y wizard de reservas
- `/java/cambiaPassword.js` → formulario cambiar contraseña (LEGACY, reemplazado por offcanvasPassword)

---

## Archivos de configuración de email

```
config/email.js     → Nodemailer + Zoho SMTP (envío directo)
config/mailjet.js   → node-mailjet (API alternativa)
html/inicioMensaje.js → plantillas HTML de email (cambio pass, recuperación)
```

Función activa: `requestEmail(destinatario, asunto, htmlBody)` de `mailjet.js`

---

## Helpers (`libs/helpers.js`)

```js
encryptPassword(plainText)  → bcrypt hash (sync)
matchPassword(plain, hash)  → bcrypt compare (sync)
randomPassword(length)      → genera password aleatoria
```

---

## Archivos estáticos servidos

```
/assets    → app/public/assets    (iconfonts, imágenes del sistema)
/imagenes  → app/public/imagenes  (fotos de perfil, logo)
/fuentes   → app/public/fuentes   (Quicksand, Galada)
/java      → app/public/java      (JS propios del sistema)
/estilos   → app/public/estilos   (android.css)
/librerias → app/public/librerias (Bootstrap, jQuery, Moment, SweetAlert2, etc.)
/pdf       → app/public/pdf       (documentos generados)
```

---

## Express — configuración

```js
app.use(express.urlencoded({ limit: '200mb', extended: true, parameterLimit: 200000 }))
app.use(express.json({ limit: '200mb' }))
app.use(fileUpload())           // express-fileupload (sin multer)
app.set('view engine', 'ejs')
app.set('views', '../views/')
```

Morgan activado solo en `development` (modo `'tiny'`).

---

## Variables de sesión inyectadas en vistas EJS

```js
app.use((req, res, next) => { app.locals.users = req.user; next(); })
app.use((req, res, next) => { res.locals.moment = moment; next(); })
```

En vistas EJS: `<%= user.id %>`, `<%= moment().format('...') %>`.

---

## Protección de rutas de vistas

```
GET /         → notLogin → login.ejs
POST /inicio/login → verificarLogin (middleware) → Passport
GET /sistema  → isLogin  → sistema.ejs (carga general.js, reserva.js, etc.)
GET /instalar → instalar.ejs (PWA install prompt)
```
