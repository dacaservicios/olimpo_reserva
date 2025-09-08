const pool = require('../config/connections');
const {matchPassword} = require('../libs/helpers');
const config=require('../config/config');
const path = require('path');
const fs = require('fs');



const isLogin = (req, res, next)=>{
    if(req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/');
    }
}

const notLogin = (req, res, next)=>{
    if(!req.isAuthenticated()){
        return next();
    }else{
        return res.redirect('/sistema');
    }
}

const verificarLogin = async (req, res, next)=>{
    const body =  req.body;
    const ip =  req.ip;
    const server =  req.hostname;

    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        0,
        body.txtCorreo,
        0,
        2,
        ip,
        server
    ]);
    if(row[0].length==0){
        res.json({
            valor:{
                resultado : false,
                mensaje : '¡El usuario o la contraseña es incorrecto!',
                tipo:1
            }
        });
    }else{
        const validaPassword = matchPassword(body.txtContrasena,row[0][0].CONTRASENA);
        if(validaPassword){
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
                    res.json({
                        valor:{
                            resultado : true,
                            idUser: row[0][0].ID_CLIENTE
                        }
                    }); 
                }else{
                    res.json({
                        valor:{
                            resultado : false,
                            mensaje : row1[0][0].MENSAJE
                        }
                    }); 
                } 
        }else{
            const row2 = await pool.query(query,
            [
                0,
                body.txtCorreo,
                0,   
                4,
                ip,
                server
            ]);

            if(row2[0][0].INTENTO>=3){
                res.json({
                    valor:{
                        resultado : false,
                        mensaje : '¡Su sesión esta bloqueada, por superar el número de intentos permitidos (3)!',
                        correo: row2[0][0].EMAIL,
                        tipo:3,
                        url: config.URL_SISTEMA
                    }
                });
            }else{
                res.json({
                    valor:{
                        resultado : false,
                        mensaje : '¡El usuario o la contraseña es incorrecto!',
                        tipo:2
                    }
                });
            }
        }   
    }
}

const verificarDocumento = async (req, res, next)=>{
    const body =  req.body;
    const ip =  req.ip;
    const server =  req.hostname;

    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        body.tipoDocumento,
        body.numeroDocumento,
        0,
        11,
        ip,
        server
    ]);

    if(row[0][0].CANTIDAD>0){
        res.json({
            valor:{
                resultado : false,
                mensaje : '¡El tipo y número de documento ya existen, verique los datos ingresados.!'
            }
        });
    }else{
        res.json({
            valor:{
                resultado : true,
                mensaje : '¡No existe usuario, puede seguir!'
            }
        }); 
        //return next(); 
    }

}

const verificaLogeo = async (req, res, next)=>{
    const body =  req.body;
    const ip =  req.ip;
    const server =  req.hostname;
 
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        0,
        body.txtCorreo,
        0,
        2,
        ip,
        server
    ]);

    if(row[0][0]=== undefined){
        res.json({
            valor:{
                resultado : false,
                mensaje : '¡El usuario o la contraseña es incorrecto!'
            }
        }); 
    }else{
        const validaPassword = matchPassword(body.txtContrasena,row[0][0].CONTRASENA);
        if(validaPassword){
            return next();
        }else{
            await pool.query(query,
            [
                0,
                body.txtCorreo,
                0,   
                4,
                ip,
                server
            ]);
            res.json({
                valor:{
                    resultado : false,
                    mensaje : '¡El usuario o la contraseña es incorrecto!'
                }
            });
        }   
    }

}

const verificarCorreo = async (req, res, next)=>{
    const query = `CALL USP_UPD_INS_REGISTRO_CLIENTE(?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        0,
        req.body.correo,
        0,
        9,
        0,
        0
    ]);
    
    if(row[0].length>0){ 
        /*res.json({
            valor:{
                resultado : true,
                mensaje : '¡Su correo es correcto!'
            }
        }); */
 
        return next();
    }else{
        res.json({
            valor:{
                resultado : false,
                mensaje : '¡Su correo no esta registrado en el sistema!'
            }
        }); 
    }  

}

const caracter = (req, res, next)=>{
    //next();
    let formato=/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ!¡#$%&()º_*+\-./:;,=¿?@\[\]\{\|\}\\n\\r ]{1,}$/
    var valores="";
    let datos=(Object.keys(req.body).length===0)?req.params:req.body;

    var arrObj= Object.values(datos);
    for(var v=0;v<arrObj.length;v++){
        valores+=arrObj[v].toString().replace(" ","").replace(/(\r\n|\n|\r)/gm,"");
    }

    let resulta=formato.test(valores);
    if(resulta){
        next();
    }else{
        res.json({
            valor : {
                resultado : false,
                mensaje : '¡Existen caracteres que no estan permitidos!',
            }
        });
        return;
    }

}

const validaSchema=  (schema)=>{
    return async (req, res, next)=>{
        try {
            await schema.validateAsync(req.body);
            next();
        }catch (error) { 
            res.status(400).json({
                /*error : {
                    message:'Hubo un error en la validación',
                    errno: 'de los',
                    code : 'datos'
                }*/
                error : {
                    message:error.message,
                    errno: error.errno,
                    code : error.code
                }
            });
        }
    }
}


const passwordAleatorio = async ()=>{
    let aleatorio=[];
    let nuevaPass='';
    let numero=['0','1','2','3','4','5','6','7','8','9'];
	let minuscula=['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
	let mayuscula=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
	let especial=['!','¡','#','$','%','&','(',')','*','+','-','.','/',':',';','=','¿','?','@','[',']','{','|','}'];
    let todo=['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','!','¡','#','$','%','&','(',')','*','+','-','.','/',':',';','=','¿','?','@','[',']','{','|','}'];
    
    aleatorio.push(numero[Math.floor(Math.random() * numero.length)]);
    aleatorio.push(minuscula[Math.floor(Math.random() * minuscula.length)]);
    aleatorio.push(mayuscula[Math.floor(Math.random() * mayuscula.length)]);
    aleatorio.push(especial[Math.floor(Math.random() * especial.length)]);
    aleatorio.push(todo[Math.floor(Math.random() * todo.length)]);
    aleatorio.push(todo[Math.floor(Math.random() * todo.length)]);

    for(var i=0;i<6;i++){
        var valor=aleatorio[Math.floor(Math.random() * aleatorio.length)]
        var indice = aleatorio.indexOf(valor);
        aleatorio.splice(indice, 1); 
        nuevaPass =nuevaPass + valor
    }

    return nuevaPass;
}

const verificaAdjunto = (req, res, next)=>{
    var doc=0;
    var mensajeAdjunto='';
    req.archivo=0; 
    if(req.files==null){
        doc=1;
    }else{
        if(typeof req.files.imagen=== 'object'){
            uploadedFile = req.files.imagen;
            let extension = uploadedFile.name.split('.').pop();
            let tamanio = uploadedFile.size;

            if(config.TAMANO_ADJUNTO<tamanio){
                mensajeAdjunto='¡El documento no debe ser mayor a 1MB!, ';
            }else if(!config.FORMATOS_IMAGEN.includes(extension)){
                mensajeAdjunto='¡El documento debe tener formato: jpg, jpeg, png!, ';
            }else{
                doc=1;
                req.archivo=1;
            }
        }
    }

    if(doc>=1){
        return next(); 
    }else{
        res.json({
            valor:{
                resultado : false,
                mensaje : mensajeAdjunto
            }
        });
    }
 
}


module.exports = {
    isLogin,
    notLogin,
    verificarLogin,
    verificaLogeo,
    verificarCorreo,
    caracter,
    validaSchema,
    verificarDocumento,
    passwordAleatorio,
    verificaAdjunto
}