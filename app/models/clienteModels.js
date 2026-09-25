const pool = require('../config/connections');

const buscarCliente = async(id,tabla,sesId)=>{
    const query = `CALL USP_SEL_VERLISTAID(?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        tabla,
        sesId
    ]);

    // 'cliente_reserva' trae CONTRASENA (inicioModels la necesita en el servidor): el hash nunca debe salir al frontend.
    const info = row[0][0];
    if(info){
        delete info.CONTRASENA;
    }

    return {
        resultado : true,
        info : info,
        mensaje : '¡Exito!'
    };

}

module.exports = {
    buscarCliente
}
