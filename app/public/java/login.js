$(document).ready(function() {
	let tabla='login';
	let correo=$("#"+tabla+" input[name=txtCorreo]");
	let contrasena=$("#"+tabla+" input[name=txtContrasena]");
	let elementos={
		correo:correo,
		contrasena:contrasena
	}
	
	$('button.submit').off( 'click');
	$('button.submit').on( 'click', function (e) {
		e.preventDefault();
		validaFormulario({tabla:tabla, elementos:elementos});
	});

	$('button.registro').off( 'click');
	$('button.registro').on( 'click', function (e) {
		e.preventDefault();
		inicioFormularioLogin('register');
	});

	$('button.olvidaste').off( 'click');
	$('button.olvidaste').on( 'click', function (e) {
		e.preventDefault();
		inicioFormularioLogin('olvidaPassword');
	});

	$('#'+tabla).off( 'keyup');
	$('#'+tabla).on( 'keyup','input[type=text]',function(){
		let name=$(this).attr("name");
		let tipo='text';
		enviaEventoLogin({tabla:tabla,tipo:tipo,name:name,elementos:elementos});
	});

	$('#'+tabla).on( 'keyup','input[type=textPass]',function(){
		let name=$(this).attr("name");
		let tipo='password';
		enviaEventoLogin({tabla:tabla,tipo:tipo,name:name,elementos:elementos});
	});

	$('#'+tabla).on( 'keyup','input[type=password]',function(){
		let name=$(this).attr("name");
		let tipo='password';
		enviaEventoLogin({tabla:tabla,tipo:tipo,name:name,elementos:elementos});
	});

	$('#'+tabla).on( 'click','span#verPass',function(){
		if($(this).children('i').hasClass('la-low-vision')){
			$(this).children('i').removeClass('la-low-vision').addClass('la-eye');
			$(this).children('strong').text('Ocultar contraseña');
			$(this).parents('form#login').find('input[name=txtContrasena]').attr('type','textPass');
		}else{
			$(this).children('i').removeClass('la-eye').addClass('la-low-vision');
			$(this).children('strong').text('Mostrar contraseña');
			$(this).parents('form#login').find('input[name=txtContrasena]').attr('type','password');
		}
		
	});

});

function _loginMarkError(input, tipo){
	let $field = input.closest('.login-field');
	let $wrap  = input.closest('.login-input-wrapper');
	$wrap.addClass('errores').removeClass('borrarErrores');
	$field.find('.vacio').toggleClass('oculto', tipo !== 'vacio');
	$field.find('.formato').toggleClass('oculto', tipo !== 'formato');
}

function _loginMarkOk(input){
	let $field = input.closest('.login-field');
	let $wrap  = input.closest('.login-input-wrapper');
	$wrap.removeClass('errores').addClass('borrarErrores');
	$field.find('.vacio, .formato').addClass('oculto');
}

function validaFormulario(objeto){
	let valid = true;

	let correoVal = objeto.elementos.correo.val();
	if(!correoVal){
		_loginMarkError(objeto.elementos.correo, 'vacio'); valid = false;
	} else if(!formatoCorreo(correoVal)){
		_loginMarkError(objeto.elementos.correo, 'formato'); valid = false;
	} else {
		_loginMarkOk(objeto.elementos.correo);
	}

	let passVal = objeto.elementos.contrasena.val();
	if(!passVal){
		_loginMarkError(objeto.elementos.contrasena, 'vacio'); valid = false;
	} else if(!formatoPassword(passVal)){
		_loginMarkError(objeto.elementos.contrasena, 'formato'); valid = false;
	} else {
		_loginMarkOk(objeto.elementos.contrasena);
	}

	if(valid){ login(objeto); }
}

function enviaEventoLogin(objeto){
	let input = (objeto.tipo === 'text') ? objeto.elementos.correo : objeto.elementos.contrasena;
	let val   = input.val();
	let esOk  = (objeto.tipo === 'text') ? formatoCorreo(val) : formatoPassword(val);

	if(!val){
		_loginMarkError(input, 'vacio');
	} else if(!esOk){
		_loginMarkError(input, 'formato');
	} else {
		_loginMarkOk(input);
	}
}

async function login(objeto){
	bloquea();	
	$.ajax({
		type: "post",
		url: '/inicio/verificaLogin',
		data:{
			txtCorreo:objeto.elementos.correo.val(),
			txtContrasena:objeto.elementos.contrasena.val()
		},
		success: function(msg) {
			resp=msg.valor;

			desbloquea();
			if(resp.resultado){
				loginOk(objeto,resp.idUser, resp.idNivel);
			}else{
				if(resp.tipo==3){
					//recuperaBloqueo({correo:resp.correo});
					info2('¡Su sesión esta bloqueada, por superar el número de intentos permitidos (3), Comunicarse con el administrador!',function(){
						window.location.replace(resp.url);
					});
				}else{
					mensajeSistema(resp.mensaje);
				}
				
			}
		},
		error: function(msg) {
			desbloquea();
			mensajeError(msg.responseJSON.error);
		}
	});
}

function loginOk(objeto, idUser, idNivel){
	bloquea();
	$.ajax({
		type: "post",
		url: '/inicio/verificaLoginOk',
		data:{
			txtCorreo:objeto.elementos.correo.val(),
			txtContrasena:objeto.elementos.contrasena.val(),
			idUser:idUser
		},
		success: function(msg) {
			resp=msg.valor;
			desbloquea();
			if(resp.user.resultado){	
				localStorage.setItem("token",resp.user.token);
				localStorage.setItem("clave",resp.user.clave);
				window.location.replace(resp.url+"/sistema");
				//window.location.href = resp.url+"/sistema"
				//location.href= resp.url+"/sistema"
			}else{
				mensajeSistema(resp.mensaje);
			}
		},
		error: function(msg) {
			desbloquea();
			mensajeError(msg.responseJSON.error);
		}
	});
}

function recuperaBloqueo(objeto){
	bloquea();	
	$.ajax({
		type: "post",
		url: '/inicio/recupera',
		data:{
			correo:objeto.correo,
		},
		success: function(msg) {
			resp=msg.valor;
			desbloquea();
			if(resp.resultado){
				info2('¡Su sesión esta bloqueada, por superar el número de intentos permitidos (3), se le enviará un correo electrónico con las nuevas credenciales!',function(){
					window.location.replace(resp.url);
				});
			}else{
				mensajeSistema(resp.mensaje);
			}
		},
		error: function(msg) {
			desbloquea();
			mensajeError(msg.responseJSON.error);
		}
	});
}
