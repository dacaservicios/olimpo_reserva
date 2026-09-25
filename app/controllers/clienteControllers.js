const {buscarCliente} = require('../models/clienteModels');

const buscar=(req, res)=>{
    const sesId =  req.params.sesId;
    const id =  req.params.id;
    buscarCliente(id,'cliente_reserva',sesId)
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
    buscar
}
