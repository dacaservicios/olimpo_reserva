const jwt = require('jsonwebtoken');
const config = require('../config/config');
const moment = require("moment");

/*const verificarToken = (req, res, next)=>{
    next();
}*/
const verificarToken = (req, res, next)=>{
    if(!req.headers.authorization){
        res.status(403).json({
            error : {
                message:'No tiene autorización para consumir los recursos',
                errno: 'SA',
                code : 0
            }
        });
        return;
    }else{
        const token = req.headers.authorization.split(" ")[1];
        try{
            jwt.verify(token,config.SEED,(error, data)=>{
                // Solo tokens de cliente: un token de usuario de olimpo no debe pasar aunque
                // llegara firmado con la misma clave (su data.id es un ID de SEG_USUARIO).
                if(!error && !(data && data.data && data.data.tipo === 'cliente')){
                    error = new Error('tipo de token inválido');
                }
                if(error){
                    res.status(403).json({
                        error : {
                            message:'Existe un problema con su autenticación',
                            errno: 'TC',
                            code : 0
                        }
                    });
                    return;
                }else{
                    req.usuario = data;

                    // Multitenant (igual que olimpo): el "sesId" (ID del cliente) que usan los modelos/SPs
                    // nunca sale de la URL/body — siempre se reemplaza por el ID del cliente del JWT.
                    const idClienteToken = (data && data.data) ? data.data.id : null;
                    if(idClienteToken !== null && idClienteToken !== undefined){
                        if(req.params && Object.prototype.hasOwnProperty.call(req.params, 'sesId')){
                            req.params.sesId = String(idClienteToken);
                        }
                        if(req.body && typeof req.body === 'object'){
                            req.body.sesId = idClienteToken;
                        }
                    }

                    next();
                }
            }); 
        }catch (err) {
            console.log(err)
        }
    }
}


module.exports = {
    verificarToken
}