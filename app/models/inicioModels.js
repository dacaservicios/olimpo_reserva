const pool = require('../config/connections');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const {encryptPassword,randomPassword,matchPassword} = require('../libs/helpers');
const moment = require('moment');
const {enviaEmail} = require('../config/email');
const {mensajeOlvidaPassword} = require('../html/inicioMensaje');
const { passwordAleatorio } = require('../middlewares/auth');

// Contraseña temporal legible (sin caracteres ambiguos) para recuperación.
const generaClave = (largo = 8)=>{
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let clave = '';
    for (let i = 0; i < largo; i++) clave += chars.charAt(Math.floor(Math.random() * chars.length));
    return clave;
};
 
const login = async (ip,server,body)=>{  
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    
    const row1 = await pool.query(query,
    [
        0,
        body.txtCorreo,
        0, 
        1,
        ip,
        server
    ]);

    if(row1[0][0].MENSAJE=='0'){
        const datos = row1[0][0];
        const token=jwt.sign({
            data:{
                id : datos.ID_CLIENTE,
                idSucursal : datos.ID_SUCURSAL,
                idEmpresa : datos.ID_EMPRESA,
            }
        },
        config.SEED,
        {expiresIn: config.EXPIRATION}
        );

        await pool.query(query,
        [
            datos.ID_CLIENTE,
            0,
            0,
            3,
            ip,
            server
        ]);

        return { 
            resultado : true,
            id : datos.ID_CLIENTE,
            idSucursal : datos.ID_SUCURSAL,
            idEmpresa : datos.ID_EMPRESA,
            token:token,
            mensaje : 'Ingreso exitoso'
        };
       

    }else{
        return { 
            resultado : false,
            mensaje : row1[0][0].MENSAJE,
            url: config.URL_SISTEMA,
        }; 
    }           
}

const datosUsuario = async (id)=>{
    const query1 = `CALL USP_SEL_VERLISTAID(?, ?, ?)`;
    const row1 = await pool.query(query1,
    [
        id,
        'cliente',
        id
    ]);

    const cliente = row1[0][0] || {};
    const doc     = (cliente.NUMERO_DOCUMENTO || '').toString().trim();
    const celular = (cliente.NRO_CELULAR || '').toString().trim();
    const email   = (cliente.EMAIL || '').toString().trim();
    const hash    = cliente.CONTRASENA;

    // ¿Debe cambiar la contraseña? -> todavía no tiene una, o sigue siendo su nº de documento.
    let debeCambiarPass = true;
    if (hash) {
        try { debeCambiarPass = matchPassword(doc, hash); }
        catch (e) { debeCambiarPass = false; }
    }

    // ¿Perfil incompleto? -> falta documento, celular o correo (claves para login y notificaciones).
    const faltan = [];
    if (!/^[0-9]{6,15}$/.test(doc))               faltan.push('documento');
    if (!/^9[0-9]{8}$/.test(celular))             faltan.push('celular');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) faltan.push('correo');

    // El hash de la contraseña nunca debe salir al frontend.
    delete cliente.CONTRASENA;

    return {
        resultado : true,
        info: cliente,
        debeCambiarPass : debeCambiarPass,
        perfilIncompleto : faltan.length > 0,
        faltan : faltan,
        mensaje : '¡exito!'
    };

}

/*const registro = async (body)=>{  
    const nuevaPass = randomPassword(10);
    const contrasena = encryptPassword(nuevaPass);

    const query = `CALL USP_UPD_INS_USUARIO(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const row=await pool.query(query,
    [
        0,
        1,
        body.txtPaterno,
        0,   
        body.txtNombre,
        '',
        35,
        0,
        0,
        0,
        body.txtCorreo,
        moment().format('YYYY-MM-DD'),
        3,
        '',
        moment().format('YYYY-MM-DD'),
        'register',
        body.txtCorreo,
        contrasena,
        1
    ]);


    const mensaje =mensajeRegister(body,nuevaPass);
    requestEmail(body.txtCorreo,'Bienvenido a AyniSystem', mensaje);
    

    return { 
        resultado : true,
        info:row[0][0],
        mensaje : '¡Se ha enviado sus credenciales a su correo electrónico!'
    };  
}*/
/*
const contrasena = async (body)=>{ 
    const nuevaPass = randomPassword(10);
    const contrasena = encryptPassword(nuevaPass);

    const query = `CALL USP_UPD_INS_REGISTRO(?, ?, ?, ?, ?, ?, ?)`;
    
    const row = await pool.query(query,
    [
        0,
        body.txtCorreo,
        contrasena, 
        0,  
        10,
        0,
        0
    ]);

    if(row[0][0].USUARIO==1){ 
        const mensaje =mensajeOlvidaPassword(body.txtCorreo,nuevaPass);
        requestEmail(body.txtCorreo,'Recupera contraseña', mensaje);

        return { 
            resultado : true,
            mensaje : '¡Se ha enviado su nuevo password a su correo electrónico!'
        };  
    }else{
        return { 
            resultado : false,
            mensaje : '¡Su correo no esta registrado en el sistema!'
        }; 
    }      
}*/

// Restablecer contraseña. "cuenta" (body.cuenta) puede ser el correo o el celular.
//   correo  -> opción 10 -> se envía la nueva contraseña por email
//   celular -> opción 12 -> se envía la nueva contraseña por WhatsApp (sender = NRO_WHATSAPP de la sucursal)
const recuperaPassword = async (id,body,ip,server)=>{
    const cuenta = (body.cuenta || body.correo || '').toString().trim();
    const esCorreo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cuenta);

    const nuevaPass = generaClave(8);
    const contrasenaNueva = encryptPassword(nuevaPass);
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;

    if (esCorreo) {
        const row = await pool.query(query, [id, cuenta, contrasenaNueva, 10, ip, server]);
        const datos = row[0][0] || {};
        const mensaje = mensajeOlvidaPassword({ usuario: datos.NUMERO_DOCUMENTO, contrasena: nuevaPass });
        try { await enviaEmail(datos.EMAIL || cuenta, 'Recuperación de contraseña', mensaje, '', ''); }
        catch (e) { console.error('recuperaPassword email:', e.message); }

        return {
            resultado : true,
            info : datos,
            url: config.URL_SISTEMA,
            mensaje : '¡Te enviamos tu nueva contraseña a tu correo electrónico!'
        };
    }

    // Recuperación por celular -> WhatsApp
    const row = await pool.query(query, [id, cuenta, contrasenaNueva, 12, ip, server]);
    const datos = row[0][0] || {};
    let waOk = false;

    if (datos.NRO_CELULAR && datos.NRO_WHATSAPP) {
        try {
            await axios.post(config.URL_WHATSAPP, {
                phone: '51' + datos.NRO_CELULAR,
                message: `🔐 *Olimpo - Recuperación de contraseña*\n\nTu nueva contraseña es: *${nuevaPass}*\n\nIngresa con tu número de documento y esta contraseña.\nPor seguridad, cámbiala después de iniciar sesión.`,
                sender: datos.NRO_WHATSAPP
            }, { headers: { 'x-api-key': config.API_KEY_WHATSAPP } });
            waOk = true;
        } catch (e) {
            console.error('recuperaPassword whatsapp:', e.response?.data || e.message);
        }
    }

    return {
        resultado : true,
        info : datos,
        url: config.URL_SISTEMA,
        mensaje : waOk
            ? '¡Te enviamos tu nueva contraseña por WhatsApp!'
            : '¡Se generó una nueva contraseña, pero no se pudo enviar por WhatsApp. Comunícate con la barbería.'
    };
}


module.exports = {
    login,
    datosUsuario,
    //registro,
    //contrasena,
    recuperaPassword
};

