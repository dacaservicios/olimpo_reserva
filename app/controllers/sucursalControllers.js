const {listarSucursal} = require('../models/sucursalModels');

const listar=(req, res)=>{
    const id =  req.params.id;
    const sesId=req.params.sesId;
    listarSucursal(id,'sucursal',sesId)
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


module.exports = {
    listar,
}