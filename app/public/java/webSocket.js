let opcionesToast = {
    "progressBar": true,
    "positionClass": "toast-bottom-right",
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "10000",
    "extendedTimeOut": "0",
}

/*const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });*/

var socket = io.connect();

socket.on('connection', function (data) {
    console.log(data);
});

//--------------MODULO------------
socket.on('actualizaModulo',function (data){
	menu();
});

socket.on('actualizaFechaServicio',function (data){
	$('#fechaServicio'+data.idVenta).text(moment(data.fechaVenta).locale('es').fromNow());
});

socket.on('actualizaNombreSucursal',function (data){
    $("#sucursalVentas").text(data.sucursal);
    $("#userSucursal").val(data.id_sucursal);
});

socket.on('actualizaLogoSucursal',function (data){
    $("img.imagenSucursalInicio").attr('src','/imagenes/sucursal/LOGO_'+data.id_sucursal+'_'+data.imagen);
});







socket.on('sunatVenta',function (data){
    $("#"+data.tabla+"Tabla #"+data.ID_VENTA+" span.botonSunat").html(`
        <a type='Anular' class="crud anular cursor" data-toggle="tooltip" data-placement="top" title="Anular">
            <i class="las la-minus-circle la-2x"></i>
        </a>`
    );
    $("#"+data.tabla+"Tabla #"+objeto.orden+" span.botonesSunat").html(`
        <a type='Email' class="crud email cursor" data-toggle="tooltip" data-placement="top" title="Email">
            <i class="las la-envelope la-2x"></i>
        </a>
        <a type='Xml' class="crud xml cursor" data-toggle="tooltip" data-placement="top" title="Xml">
            <i class="las la-file-code la-2x"></i>
        </a>
        <a type='Cdr' class="crud cdr cursor" data-toggle="tooltip" data-placement="top" title="Cdr">
            <i class="las la-file-signature la-2x"></i>
        </a>`
    );  
});

socket.on('actualizaCaja',function (data){
    if(data.tipo=='saldo'){
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .saldo").text(parseFloat(Math.abs(data.saldo)).toFixed(2));
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .faltante").text(parseFloat(Math.abs(data.faltante)).toFixed(2));
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .sobrante").text(parseFloat(Math.abs(data.sobrante)).toFixed(2));
    }else if(data.tipo=='cierre'){
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .cierre").text(parseFloat(Math.abs(data.cierre)).toFixed(2));
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .faltante").text(parseFloat(Math.abs(data.faltante)).toFixed(2));
        $("#"+data.tabla+"Tabla #"+data.idCaja+" .sobrante").text(parseFloat(Math.abs(data.sobrante)).toFixed(2));
    }
});

/*
socket.on('actualizaSaldoAdmin',function (data){
    $("#usuarioTabla #"+data.idUsuario+" span.saldoPagado").text(parseFloat(data.saldo).toFixed(2));
    toastr[data.tipo](data.cuerpo,data.titulo,opcionesToast);
    vibracion();
});

socket.on('actualizaSaldoSuper',function (data){
    $("#usuarioTabla #"+data.idUsuario+" span.saldoPagado").text(parseFloat(data.saldo).toFixed(2));
    toastr[data.tipo](data.cuerpo,data.titulo,opcionesToast);
    vibracion();
});


socket.on('loginUsuarioAdmin',function (data){
    loginUsuario(data);
});

socket.on('loginUsuarioSuper',function (data){
    loginUsuario(data);
});*/

/*==================FUNCIONES========================*/
/*function loginUsuario(data){
    let logeado;
    if(data.sesion=='A'){
        logeado="<i class='fas fa-check-circle'></i>";
    }else{
        logeado="";
    }
    $("#"+data.idUsuario+" span.logeado").html(logeado);

    toastr[data.tipo](data.cuerpo,data.titulo,opcionesToast);
    vibracion();
}*/


function vibracion(){
    window.navigator.vibrate([1000,300,1000,300,1000,300]);
}

function notificacion(objeto){
    Push.create(objeto.titulo, {
        body: objeto.cuerpo,
        icon: 'img/message.png',
        timeout: 10000,
        vibrate : [100,100,100],
        onClick: function () {
            window.focus();
            this.close();
        }
    });
}
