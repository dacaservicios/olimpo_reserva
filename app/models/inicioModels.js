const pool = require('../config/connections');
const config = require('../config/config');
const jwt = require('jsonwebtoken');
const {encryptPassword,randomPassword} = require('../libs/helpers');
const moment = require('moment');
const {enviaEmail} = require('../config/email');
const {mensajeOlvidaPassword} = require('../html/inicioMensaje');
const { passwordAleatorio } = require('../middlewares/auth');
 
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
                idSucursal : datos.ID_SUCURSAL
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

    return { 
        resultado : true,
        info:row1[0][0],
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

const recuperaPassword = async (id,body,ip,server)=>{
    const nuevaPass = passwordAleatorio(10);
    //const nuevaPass = body.documento;
    const contrasenaNueva = encryptPassword(nuevaPass);

    /*console.log('CALL USP_UPD_INS_REGISTRO(',id,",",
        `'${body.correo}'`,",",
        `'${contrasena}'`,",",
        0,",",
        10,",",
        `'${body.ip}'`,",",
        `'${body.server}'`,')')
        return*/

    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row=await pool.query(query,
    [
        id,
        body.correo,
        contrasenaNueva,
        10,
        ip,
        server
    ]);

    const mensaje =mensajeOlvidaPassword({usuario:row[0][0].NUM_DOCUMENTO,contrasena:nuevaPass});
    enviaEmail(body.correo,'Recuperación de contrasena', mensaje,'','');

    return { 
        resultado : true,
        info : row[0][0],
        url: config.URL_SISTEMA,
        mensaje : '¡Se recuperó la contraseña!'
    };       
}


module.exports = {
    login,
    datosUsuario,
    //registro,
    //contrasena,
    recuperaPassword
};

