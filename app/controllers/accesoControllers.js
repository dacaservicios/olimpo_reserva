const {cambiaPassword,salirLogin,verificaPassword} = require('../models/accesoModels');

const password=(req, res)=>{
    const sesId =  req.params.sesId;
    cambiaPassword(sesId, req.body)
    .then(valor => {
        //req.logOut();
        res.json({
            valor : valor
        });
    })
    .catch(error => {
        res.status(400).json({
            error : {
                message:error.message,
                errno: error.errno,
                code : error.code
            }
        });
    });
}

const verificaPass=(req, res)=>{
    const sesId =  req.params.sesId;
    verificaPassword(sesId,req.body)
    .then(valor => {
        res.json({
            valor : valor
        });
    })
    .catch(error => {
        res.status(400).json({
            error : {
                message:error.message,
                errno: error.errno,
                code : error.code
            }
        });
    });
}

const logout = async (req, res) => {
    const sesId = req.params.sesId;
    const ip    = req.ip;
    const server = req.hostname;
    try {
        const valor = await salirLogin(sesId, ip, server);
        req.logOut();
        res.json({ valor });
    } catch(error) {
        req.logOut();
        res.json({
            valor: {
                resultado: true,
                mensaje: '¡Se terminó la sesión!'
            }
        });
    }
}



module.exports = {
    password,
    verificaPass,
    logout
}