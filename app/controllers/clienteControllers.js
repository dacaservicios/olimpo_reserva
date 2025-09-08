const {editarCliente,buscarCliente,listarCliente} = require('../models/clienteModels');

const listar=(req, res)=>{
    const id =  req.params.id;
    const sesId=req.params.sesId;
    listarCliente(id,'cliente',sesId)
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

const listar_wp=(req, res)=>{
    const id =  req.params.id;
    const sesId=req.params.sesId;
    listarCliente(id,'cliente_wp',sesId)
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

const buscar=(req, res)=>{
    const sesId =  req.params.sesId;
    const id =  req.params.id;
    buscarCliente(id,'cliente',sesId)
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


const editar=(req, res)=>{
    const id=req.params.id;
    editarCliente(id,req.body)
    .then(valor => {
        if(req.archivo!=0){
            uploadedFile = req.files.imagen;
            ruta='../public/imagenes/cliente/CLI_'+valor.info.ID_CLIENTE+"_"+uploadedFile.name;
            uploadedFile.mv(path.join(__dirname,ruta));
        }
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
    buscar,
    listar_wp,
    editar
}