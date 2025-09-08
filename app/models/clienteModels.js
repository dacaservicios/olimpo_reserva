const pool = require('../config/connections');
const moment = require('moment');

const buscarCliente = async(id,tabla,sesId)=>{
    const query = `CALL USP_SEL_VERLISTAID(?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        tabla,
        sesId
    ]);

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Exito!'
    }; 
    
}

const listarCliente = async (id, tabla,sesId)=>{
    const query = `CALL USP_SEL_VERLISTA(?, ?, ?)`;
    const row =  await pool.query(query,
    [
        id,
        tabla,
        sesId
    ]);

    return { 
        resultado : true,
        info : row[0],
        mensaje : '¡Exito!'
    }; 
}

const editarCliente = async (id,body)=>{

    const query = `CALL USP_UPD_INS_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        body.nombre,
        (body.apellidoPaterno=='')?null:body.apellidoPaterno,
        (body.apellidoMaterno=='')?null:body.apellidoMaterno,
        (body.tipoDocumento=='')?null:body.tipoDocumento,
        0
        (body.documento=='')?null:body.documento,
        (body.direccion=='')?null:body.direccion,
        (body.fechaNacimiento=='')?null:moment(body.fechaNacimiento,'DD-MM-YYYY').format('YYYY-MM-DD'),
        (body.celular=='')?null:body.celular, 
        (body.email=='')?null:body.email,
        null,
        0
        (body.imagen=='')?null:body.imagen,
        'edita',
        body.sesId
    ]);

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro editado!'
    }; 
    
}

module.exports = {
    buscarCliente,
    listarCliente,
    editarCliente
}

