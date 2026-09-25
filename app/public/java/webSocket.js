var socket = io.connect();

socket.on('connection', function (data) {
    console.log(data);
});

// Sin listeners: el servidor de sockets de esta app no retransmite ningún evento (ver app/config/webSocket.js).
// Se quitaron los copiados de olimpo (actualizaModulo, actualizaFechaServicio, actualizaNombreSucursal,
// actualizaLogoSucursal, sunatVenta, actualizaCaja, actualizaSaldo*, loginUsuario*).
