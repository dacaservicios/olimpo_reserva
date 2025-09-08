const pool = require('../config/connections');
const {encryptPassword, matchPassword} = require('../libs/helpers');
//const {enviaEmail} = require('../config/email');
const {requestEmail} = require('../config/mailjet');
const {mensajeCambiaPassword} = require('../html/inicioMensaje');
const config = require('../config/config');

const cambiaPassword = async (id,body)=>{
    const contrasenaNueva = encryptPassword(body.contrasenaNueva);
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        0,
        contrasenaNueva,
        8,
        0,
        0
    ]);

    const mensaje =mensajeCambiaPassword({usuario:row[0][0].NUM_DOCUMENTO,contrasena:body.contrasenaNueva});
    //enviaEmail(row[0][0].EMAIL,'Cambio de contrasena', mensaje,'','');
    requestEmail(row[0][0].EMAIL,'Cambio de contrasena', mensaje);
    
    return { 
        resultado : true,
        info : row[0][0],
        url: config.URL_SISTEMA,
        mensaje : '¡Se cambio la contraseña!'
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

const cambiaDatos = async (id,img, body,sesId)=>{
    const query = `CALL USP_UPD_INS_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        body.apellidoPaterno,
        body.apellidoMaterno,
        body.nombre1,
        body.nombre2,
        body.dni,
        body.fijo,
        body.celular,
        body.correo,
        body.fechaNacimiento,
        0,
        0,
        img,
        0,
        'cambia',
        0,
        sesId
    ]);

    return{ 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Datos actualizados!'
    };  
    
}

const verificaPassword = async (id,body)=>{  
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?, ?)`;
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
    cambiaDatos,
    verificaPassword,
};

