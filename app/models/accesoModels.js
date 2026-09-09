const pool = require('../config/connections');
const moment = require('moment');
const {encryptPassword, matchPassword} = require('../libs/helpers');
//const {enviaEmail} = require('../config/email');
const {requestEmail} = require('../config/mailjet');
const {mensajeCambiaPassword} = require('../html/inicioMensaje');
const config = require('../config/config');

// Contraseña fuerte: 6-16, con mayúscula, minúscula, número y carácter especial.
// (bloquea, entre otros, usar el propio número de documento como contraseña).
const FORMATO_PASS = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!¡#$%&()*+\-.\/:;=¿?@\[\]{|}]).{6,16}$/;

const cambiaPassword = async (id,body)=>{
    const nueva = (body.contrasenaNueva || '').toString();

    if (!FORMATO_PASS.test(nueva)) {
        return {
            resultado : false,
            mensaje : 'La contraseña debe tener entre 6 y 16 caracteres e incluir mayúscula, minúscula, número y un carácter especial.'
        };
    }

    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        0,
        encryptPassword(nueva),
        8,
        0,
        0
    ]);

    const datos = row[0][0] || {};

    // Primer ingreso (cambio obligatorio): la opción 8 deja SESION='I';
    // se reactiva para no cortar la sesión recién iniciada.
    if (body.inicial) {
        await pool.query(query, [id, 0, 0, 3, 0, 0]);
    }

    if (datos.EMAIL) {
        try {
            await requestEmail(datos.EMAIL, 'Cambio de contraseña',
                mensajeCambiaPassword({ usuario: datos.NUMERO_DOCUMENTO, contrasena: nueva }));
        } catch (e) { console.error('cambiaPassword email:', e.message); }
    }

    return {
        resultado : true,
        info : datos,
        url: config.URL_SISTEMA,
        mensaje : '¡Se cambió la contraseña!'
    };
}

const salirLogin = async (id,ip,server)=>{  
    console.log(id,ip,server)
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        0,
        0,
        6,
        ip,
        server
    ]);
    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Se termino la sesión!'
    };         
}

// Actualiza los datos del propio cliente (pantalla "completa tu información").
// Firma real de USP_UPD_INS_CLIENTE (16 parámetros, _TIPO='edita'):
// (_ID,_NOMBRES,_APELLIDO_PATERNO,_APELLIDO_MATERNO,_ID_TIPO_DOCUMENTO,_VIP,_NUMERO_DOCUMENTO,
//  _DIRECCION,_FECHA_NACIMIENTO,_NRO_CELULAR,_EMAIL,_CONTRASENA,_COMENTARIO,_IMAGEN,_TIPO,_USUACREAMODI)
// VIP y COMENTARIO no están en el formulario -> se preservan leyéndolos antes.
// CONTRASENA e IMAGEN van en null: 'edita' no toca la contraseña y sólo cambia IMAGEN si no es null.
const actualizaDatosCliente = async (sesId, body)=>{
    const prev = await pool.query('SELECT VIP, COMENTARIO FROM MAE_CLIENTE WHERE ID_CLIENTE = ?', [sesId]);
    const vip        = prev[0][0] ? prev[0][0].VIP : 0;
    const comentario = prev[0][0] ? prev[0][0].COMENTARIO : null;

    const fechaNac = body.fechaNacimiento
        ? moment(body.fechaNacimiento, 'DD-MM-YYYY').format('YYYY-MM-DD')
        : null;

    const query = `CALL USP_UPD_INS_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        sesId,
        body.nombre,
        body.apellidoPaterno,
        body.apellidoMaterno,
        body.tipoDocumento,
        vip,
        body.documento,
        (body.direccion === '' || body.direccion == null) ? null : body.direccion,
        fechaNac,
        body.celular,
        body.email,
        null,
        comentario,
        null,
        'edita',
        sesId
    ]);

    return {
        resultado : true,
        info : row[0][0],
        mensaje : '¡Tus datos fueron actualizados!'
    };
}

const verificaPassword = async (id,body)=>{  
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        0,
        0,
        7,
        0,
        0
    ]);
    if(row[0].length>0){
        const validPassword = matchPassword(body.contrasenaActual,row[0][0].CONTRASENA);
        if(validPassword){
            return { 
                resultado : true,
                mensaje : '¡Contrasena correcta!',
            };
        }else{
            return { 
                resultado : false,
                mensaje : '¡La contrasena actual no es correcta!',
            };
        }
    }else{
        return { 
            resultado : false,
            mensaje : '¡No existe el usuario!'
        }; 
    }           
}

module.exports = {
    cambiaPassword,
    salirLogin,
    actualizaDatosCliente,
    verificaPassword,
};

