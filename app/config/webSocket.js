const SocketIO = (server)=>{
    const io = require('socket.io')(server);
 
    io.on('connection', (socket)=>{
        //console.log("nuevo usuario conectado al socket: "+socket.id);

        socket.on("joinUsuario", function(data){
            socket.join(data.usuario);
        });

        socket.on("joinNivel", function(data){
            socket.join(data.nivel);
        });

        socket.on("joinSucursal", function(data){
            socket.join(data.sucursal);
        });

        /*socket.on("join", function(data){
            socket.join(data.empresa);
            //console.log("connected to room: "+data.empresa);
            //console.log(io.nsps["/"].adapter);
        });*/

        //************************************************************* */
        socket.on('actualizaModulo', (data)=>{
            io.sockets.emit('actualizaModulo', data);
        });

        socket.on('actualizaAcceso', (data)=>{
            io.sockets.in(data.usuario).emit('actualizaAcceso', data);
        });

        socket.on('actualizaFechaServicio', (data)=>{
            io.sockets.in(data.sucursal).emit('actualizaFechaServicio', data);
        });

        socket.on('sunatVenta', (data)=>{
            io.sockets.in(data.administrador).emit('sunatVenta', data);
        });

        socket.on('actualizaCaja', (data)=>{
            io.sockets.in(data.sucursal).emit('actualizaCaja', data);
        });

        socket.on('actualizaNombreSucursal', (data)=>{
            io.sockets.in(data.usuario).emit('actualizaNombreSucursal', data);
        });

        socket.on('actualizaLogoSucursal', (data)=>{
            io.sockets.in(data.sucursal).emit('actualizaLogoSucursal', data);
        });

        /*socket.on('loginUsuarioAdmin', (data)=>{
            io.sockets.in(data.nivelAdmin).emit('loginUsuarioAdmin', data);
        });

        socket.on('loginUsuarioSuper', (data)=>{
            io.sockets.in(data.nivelSuper).emit('loginUsuarioSuper', data);
        });*/

    })
}

module.exports = {
    SocketIO
};
