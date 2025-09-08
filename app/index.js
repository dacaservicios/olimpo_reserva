const {app} = require('./config/server');


const inicio = require('./routes/inicioRouter');

//GENERAL

app.use('/',inicio);


/******************APIS**************************/
const inicioApi = require('./apis/inicioApi');
const usuarioApi= require('./apis/usuarioApi');
const reservaApi= require('./apis/reservaApi');
const clienteApi= require('./apis/clienteApi');
const empleadoApi= require('./apis/empleadoApi');

//--------------------------------------------------
app.use('/',inicioApi);
app.use('/',usuarioApi);
app.use('/',reservaApi);
app.use('/',clienteApi);
app.use('/',empleadoApi);
