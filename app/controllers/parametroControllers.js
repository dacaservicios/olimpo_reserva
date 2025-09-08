const {listarParametro} = require('../models/parametroModels');


const listarId=(req, res)=>{
    const id =  req.params.id;
    const sesId=req.params.sesId;
    listarParametro(id,'parametroDetalle',sesId)
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
    listarId
}