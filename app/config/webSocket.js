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

        // Este servidor es independiente del de olimpo y ningún cliente de esta app emite eventos (solo los
        // joins de general.js). Se quitaron todos los relays copiados de olimpo, ya que no tenían emisor:
        // actualizaModulo, actualizaAcceso, actualizaFechaServicio, sunatVenta, actualizaCaja,
        // actualizaNombreSucursal, actualizaLogoSucursal y loginUsuario*.

    })
}

module.exports = {
    SocketIO
};
