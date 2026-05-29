const {app} = require('./config/server');


const inicio = require('./routes/inicioRouter');

//GENERAL

app.use('/',inicio);


/******************APIS**************************/
const inicioApi = require('./apis/inicioApi');
const reservaApi= require('./apis/reservaApi');
const clienteApi= require('./apis/clienteApi');
const empleadoApi= require('./apis/empleadoApi');
const accesoApi= require('./apis/accesoApi');
const parametroApi= require('./apis/parametroApi');
const serviciosucursalApi= require('./apis/serviciosucursalApi');
const sucursalApi= require('./apis/sucursalApi');

//--------------------------------------------------
app.use('/',inicioApi);
app.use('/',reservaApi);
app.use('/',clienteApi);
app.use('/',empleadoApi);
app.use('/',accesoApi);
app.use('/',parametroApi);
app.use('/',serviciosucursalApi);
app.use('/',sucursalApi);