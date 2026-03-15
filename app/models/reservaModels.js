const pool = require('../config/connections');
const moment = require('moment');
const config = require('../config/config');
const axios = require('axios');

const crearReserva = async (body)=>{
    const query = `CALL USP_UPD_INS_RESERVA_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?)`;
    const row= await pool.query(query,
    [
        0,
        body.cliente,
        body.empleado,
        body.servicio,
        moment(body.fechaReserva+" "+body.horaReserva,'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
        (body.comentario=='')?null:body.comentario,
        'crea',
        body.sesId
    ]);

    if(row[0][0].CEL_CLIENTE &&  row[0][0].NRO_WHATSAPP){
    moment.locale('es');

    let body2={
            phone:'51'+row[0][0].CEL_CLIENTE,
            message:`
🧔‍♂️💈 ¡Hola, ${row[0][0].CLIENTE}!
Tu reserva en nuestra barbería ha sido *registrada con éxito*. ✂️

💈 *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}
🧔 *Barbero:* ${row[0][0].EMPLEADO}
📅 *Fecha:* ${moment(row[0][0].FECHA_RESERVA).format('dddd, DD [de] MMMM [del] YYYY')}
🕒 *Hora:* ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

📍 Te esperamos puntualmente para darte el mejor servicio.
Si deseas modificar o cancelar tu cita, contáctanos con anticipación. 📲

¡Gracias por elegirnos! 🙌`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }

        await axios.post(config.URL_WHATSAPP,body2);
    }

    if(row[0][0].CELULAR_EMPLEADO &&  row[0][0].NRO_WHATSAPP){
        let body3={
            phone:'51'+row[0][0].CELULAR_EMPLEADO,
            message:`
💈🧔‍♂️ *Nueva cita agendada*

👤 *Cliente:* ${row[0][0].CLIENTE}
✂️ *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}

📅 ${moment(row[0][0].FECHA_RESERVA).format('DD/MM/YYYY')}
🕒 ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

🔥 ¡Prepárate para el próximo corte!`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }
        await axios.post(config.URL_WHATSAPP,body3);
    }

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro creado!'
    }; 
}

const editarReserva = async (id,body)=>{

    const query = `CALL USP_UPD_INS_RESERVA_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        body.cliente,
        body.empleado,
        body.servicio,
        moment(body.fechaReserva+" "+body.horaReserva,'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm'),
        (body.comentario=='')?null:body.comentario,
        'edita',
        body.sesId
    ]);

    if(row[0][0].CEL_CLIENTE && row[0][0].NRO_WHATSAPP){
    moment.locale('es');

    let body2={
            phone:'51'+row[0][0].CEL_CLIENTE,
            message:`
🧔‍♂️💈 ¡Hola, ${row[0][0].CLIENTE}!
Tu reserva en nuestra barbería ha sido *modificada con éxito*. ✂️

💈 *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}
🧔 *Barbero:* ${row[0][0].EMPLEADO}
📅 *Nueva fecha:* ${moment(row[0][0].FECHA_RESERVA).format('dddd, DD [de] MMMM [del] YYYY')}
🕒 *Nueva hora:* ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

📍 ¡Gracias por avisarnos! Te esperamos con la misma energía de siempre. 💈
Si necesitas volver a cambiar tu cita, contáctanos con anticipación. 📲`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }

    await axios.post(config.URL_WHATSAPP,body2);
    }

    if(row[0][0].CELULAR_EMPLEADO &&  row[0][0].NRO_WHATSAPP){
        let body3={
            phone:'51'+row[0][0].CELULAR_EMPLEADO,
            message:`
✏️💈 *Cita modificada*

👤 *Cliente:* ${row[0][0].CLIENTE}
✂️ *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}

📅 ${moment(row[0][0].FECHA_RESERVA).format('DD/MM/YYYY')}
🕒 ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

⚠️ Revisa el cambio en tu agenda.`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }
        await axios.post(config.URL_WHATSAPP,body3);
    }

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro editado!'
    }; 
    
}

const editarReservaDD = async (id,body)=>{
    const query = `CALL USP_UPD_INS_RESERVA_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?)`;
    const row = await pool.query(query,
    [
        id,
        0,
        0,
        0,
        moment(body.fecha).format('YYYY-MM-DD HH:mm:00.0000'),
        0,
        'editaDD',
        body.sesId
    ]);

    if(row[0][0].CEL_CLIENTE && row[0][0].NRO_WHATSAPP){
    moment.locale('es');

    let body2={
            phone:'51'+row[0][0].CEL_CLIENTE,
            message:`
🧔‍♂️💈 ¡Hola, ${row[0][0].CLIENTE}!
Tu reserva en nuestra barbería ha sido *modificada con éxito*. ✂️

💈 *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}
🧔 *Barbero:* ${row[0][0].EMPLEADO}
📅 *Nueva fecha:* ${moment(row[0][0].FECHA_RESERVA).format('dddd, DD [de] MMMM [del] YYYY')}
🕒 *Nueva hora:* ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

📍 ¡Gracias por avisarnos! Te esperamos con la misma energía de siempre. 💈
Si necesitas volver a cambiar tu cita, contáctanos con anticipación. 📲`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }

    await axios.post(config.URL_WHATSAPP,body2);
    }

    if(row[0][0].CELULAR_EMPLEADO &&  row[0][0].NRO_WHATSAPP){
        let body3={
            phone:'51'+row[0][0].CELULAR_EMPLEADO,
            message:`
✏️💈 *Cita modificada*

👤 *Cliente:* ${row[0][0].CLIENTE}
✂️ *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}

📅 ${moment(row[0][0].FECHA_RESERVA).format('DD/MM/YYYY')}
🕒 ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

⚠️ Revisa el cambio en tu agenda.`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }
        await axios.post(config.URL_WHATSAPP,body3);
    }


    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro editado!'
    }; 
    
}

const buscarReserva = async(id,tabla,sesId)=>{
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

const listarReserva = async (id, tabla,sesId)=>{
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


const eliminarReserva = async(id,tabla)=>{
    const query = `CALL USP_DEL_ELIMINA(?, ?)`;
    const row =  await pool.query(query,
    [
        id,
        tabla
    ]);

    if(row[0][0].CEL_CLIENTE && row[0][0].NRO_WHATSAPP){
    moment.locale('es');

    let body2={
            phone:'51'+row[0][0].CEL_CLIENTE,
            message:`
❌ ¡Hola, ${row[0][0].CLIENTE}!
Hemos recibido tu solicitud de *cancelación de reserva*.

💈 *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}
🧔 *Barbero:* ${row[0][0].EMPLEADO}
📅 *Fecha cancelada:* ${moment(row[0][0].FECHA_RESERVA).format('dddd, DD [de] MMMM [del] YYYY')}
🕒 *hora:* ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

⚠️ Esperamos verte en otra ocasión.
Cuando quieras agendar una nueva cita, estamos a tu disposición. 💈
¡Gracias por avisarnos! 🙏`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }

    await axios.post(config.URL_WHATSAPP,body2);
    }

    if(row[0][0].CELULAR_EMPLEADO &&  row[0][0].NRO_WHATSAPP){
        let body3={
            phone:'51'+row[0][0].CELULAR_EMPLEADO,
            message:`
❌💈 *Cita cancelada*

👤 *Cliente:* ${row[0][0].CLIENTE}
✂️ *Servicio:* ${row[0][0].NOMBRE_SERVICIO+((row[0][0].DESCRIPCION_SERVICIO===null)?'':" - "+row[0][0].DESCRIPCION_SERVICIO)}

📅 ${moment(row[0][0].FECHA_RESERVA).format('DD/MM/YYYY')}
🕒 ${moment(row[0][0].FECHA_RESERVA).format('hh:mm A')}

📌 Este espacio ha quedado disponible.`.trim(),
            sender: row[0][0].NRO_WHATSAPP,
        }
        await axios.post(config.URL_WHATSAPP,body3);
    }

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro eliminado!'
    }; 
    
}

const estadoReserva = async(id,tabla)=>{
    const query = `CALL USP_UPD_ESTADO(?, ?)`;
    const row =  await pool.query(query,
    [
        id,
        tabla
    ]);

    return { 
        resultado : true,
        info : row[0][0],
        mensaje : '¡Registro eliminado!'
    }; 
    
}

const listarReservaDetalle = async(id, fecha,tabla,sesId)=>{
    const query = `CALL USP_UPD_INS_DETALLE(?, ?, ?, ? ,?)`;
    const row =  await pool.query(query,
    [
        id,
        0,
        moment(fecha,'DD-MM-YYYY').format('YYYY-MM-DD'),
        tabla,
        sesId
    ]);

    return { 
        resultado : true,
        info : row[0],
        mensaje : '¡Exito!'
    }; 
    
}

module.exports = {
    crearReserva,
    editarReserva,
    editarReservaDD,
    buscarReserva,
    listarReserva,
    estadoReserva,
    eliminarReserva,
    listarReservaDetalle
}

