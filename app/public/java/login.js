$(document).ready(function() {
	let tabla='login';
	let usuario=$("#"+tabla+" input[name=txtCorreo]");
	let contrasena=$("#"+tabla+" input[name=txtContrasena]");
	let elementos={
		usuario:usuario,
		contrasena:contrasena
	}

	$('button.submit').off( 'click');
	$('button.submit').on( 'click', function (e) {
		e.preventDefault();
		validaFormulario({tabla:tabla, elementos:elementos});
	});

	// ── Enter / botón "Ir" del teclado móvil = iniciar sesión ──
	$('#login').off('submit').on('submit', function (e) {
		e.preventDefault();
		validaFormulario({tabla:tabla, elementos:elementos});
	});
	$('#login').off('keydown').on('keydown', 'input', function (e) {
		if (e.key === 'Enter' || e.keyCode === 13) {
			e.preventDefault();
			validaFormulario({tabla:tabla, elementos:elementos});
		}
	});

	// ── Enter en el formulario de recuperación ──
	$('#recovery').off('submit').on('submit', function (e) {
		e.preventDefault();
		recuperaContrasena();
	});
	$('#recovery').off('keydown').on('keydown', 'input', function (e) {
		if (e.key === 'Enter' || e.keyCode === 13) {
			e.preventDefault();
			recuperaContrasena();
		}
	});

	// ── Ir a "Restablecer contraseña" ──
	$('button.olvidaste').off('click');
	$('button.olvidaste').on('click', function (e) {
		e.preventDefault();
		$('#loginPane').hide();
		$('#recoveryPane').show();
		$('#recovery input[name=cuenta]').val('');
		_loginMarkOk($('#recovery input[name=cuenta]'));
	});

	// ── Volver al login ──
	$('button.volverLogin').off('click');
	$('button.volverLogin').on('click', function (e) {
		e.preventDefault();
		$('#recoveryPane').hide();
		$('#loginPane').show();
	});

	// ── Enviar solicitud de restablecimiento ──
	$('button.recuperar').off('click');
	$('button.recuperar').on('click', function (e) {
		e.preventDefault();
		recuperaContrasena();
	});

	$('#'+tabla).off( 'keyup');
	$('#'+tabla).on( 'keyup','input[type=text]',function(){
		enviaEventoLogin({tipo:'usuario',elementos:elementos});
	});
	$('#'+tabla).on( 'keyup','input[type=textPass], input[type=password]',function(){
		enviaEventoLogin({tipo:'contrasena',elementos:elementos});
	});

	$('#recovery').off('keyup').on('keyup','input[name=cuenta]',function(){
		let inp=$(this);
		if(!inp.val()) _loginMarkError(inp,'vacio');
		else if(!_esCorreoOCelular(inp.val())) _loginMarkError(inp,'formato');
		else _loginMarkOk(inp);
	});

	$('#'+tabla).on( 'click','span#verPass',function(){
		if($(this).children('i').hasClass('la-low-vision')){
			$(this).children('i').removeClass('la-low-vision').addClass('la-eye');
			$(this).parents('form#login').find('input[name=txtContrasena]').attr('type','textPass');
		}else{
			$(this).children('i').removeClass('la-eye').addClass('la-low-vision');
			$(this).parents('form#login').find('input[name=txtContrasena]').attr('type','password');
		}
	});

});

// ── Validaciones de formato ──────────────────────────────────────────────
function _esDocumento(v){ return /^[0-9]{6,15}$/.test(v); }
function _esCelular(v){ return /^9[0-9]{8}$/.test(v); }
function _esCorreo(v){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }
function _esCorreoOCelular(v){ return _esCorreo(v) || _esCelular(v); }

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

	let userVal = objeto.elementos.usuario.val();
	if(!userVal){
		_loginMarkError(objeto.elementos.usuario, 'vacio'); valid = false;
	} else if(!_esDocumento(userVal)){
		_loginMarkError(objeto.elementos.usuario, 'formato'); valid = false;
	} else {
		_loginMarkOk(objeto.elementos.usuario);
	}

	let passVal = objeto.elementos.contrasena.val();
	if(!passVal){
		_loginMarkError(objeto.elementos.contrasena, 'vacio'); valid = false;
	} else {
		_loginMarkOk(objeto.elementos.contrasena);
	}

	if(valid){ login(objeto); }
}

function enviaEventoLogin(objeto){
	if(objeto.tipo === 'usuario'){
		let input = objeto.elementos.usuario, val = input.val();
		if(!val) _loginMarkError(input, 'vacio');
		else if(!_esDocumento(val)) _loginMarkError(input, 'formato');
		else _loginMarkOk(input);
	} else {
		let input = objeto.elementos.contrasena;
		if(!input.val()) _loginMarkError(input, 'vacio');
		else _loginMarkOk(input);
	}
}

// ── Login (paso 1: verifica credenciales) ───────────────────────────────
async function login(objeto){
	bloquea();
	$.ajax({
		type: "post",
		url: '/inicio/verificaLogin',
		data:{
			txtCorreo:objeto.elementos.usuario.val(),
			txtContrasena:objeto.elementos.contrasena.val()
		},
		success: function(msg) {
			resp=msg.valor;
			desbloquea();
			if(resp.resultado){
				loginOk(objeto,resp.idUser, resp.idNivel);
			}else{
				if(resp.tipo==3){
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

// ── Login (paso 2: crea la sesión Passport + JWT) ──────────────────────
function loginOk(objeto, idUser, idNivel){
	bloquea();
	$.ajax({
		type: "post",
		url: '/inicio/verificaLoginOk',
		data:{
			txtCorreo:objeto.elementos.usuario.val(),
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

// ── Restablecer contraseña (correo o celular) ──────────────────────────
function recuperaContrasena(){
	let inp = $('#recovery input[name=cuenta]');
	let val = (inp.val() || '').trim();

	if(!val){ _loginMarkError(inp,'vacio'); return; }
	if(!_esCorreoOCelular(val)){ _loginMarkError(inp,'formato'); return; }
	_loginMarkOk(inp);

	bloquea();
	$.ajax({
		type: "post",
		url: '/inicio/recupera',
		data:{ cuenta: val },
		success: function(msg){
			let r = msg.valor;
			desbloquea();
			if(r.resultado){
				info2(r.mensaje, function(){
					$('#recoveryPane').hide();
					$('#loginPane').show();
				});
			}else{
				mensajeSistema(r.mensaje);
			}
		},
		error: function(msg){
			desbloquea();
			mensajeError(msg.responseJSON.error);
		}
	});
}
