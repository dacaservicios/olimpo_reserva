// Offcanvas helpers — reemplazan los modales Bootstrap
function _getOffcanvas(id) {
	return bootstrap.Offcanvas.getOrCreateInstance(document.getElementById(id), {
		backdrop: true,
		scroll: false
	});
}

function mostrar_general1(objeto) {
	const oc = _getOffcanvas('general1');
	oc.show();
	$('#tituloGeneral1').html(objeto.titulo || '');
	$('#general1 span#padreId').text(objeto.idPadre || '');
	if (objeto.nombre !== undefined) {
		$('#subtituloGeneral1').html("<div class='alert alert-primary mb-0 mx-3 mt-2'>" + objeto.nombre + "</div>");
	} else {
		$('#subtituloGeneral1').html('');
	}
	$('#contenidoGeneral1').html(objeto.msg || '');

	$('#general1 button[name=btnCancela]').off('click').on('click', function () {
		oc.hide();
		$('#contenidoGeneral1').html('');
		$('#subtituloGeneral1').html('');
		$('#general1 span#padreId').text('');
	});
}

function mostrar_general2(objeto) {
	const oc = _getOffcanvas('general2');
	document.getElementById('general2').style.zIndex = '1070';
	oc.show();
	$('#tituloGeneral2').html(objeto.titulo || '');
	if (objeto.nombre !== undefined) {
		$('#subtituloGeneral2').html("<div class='alert alert-primary mb-0 mx-3 mt-2'>" + objeto.nombre + "</div>");
	} else {
		$('#subtituloGeneral2').html('');
	}
	$('#contenidoGeneral2').html(objeto.msg || '');

	$('#general2 button[name=btnCancela]').off('click').on('click', function () {
		oc.hide();
		$('#contenidoGeneral2').html('');
		$('#subtituloGeneral2').html('');
	});
}

function mostrar_general3(objeto) {
	const oc = _getOffcanvas('general3');
	document.getElementById('general3').style.zIndex = '1080';
	oc.show();
	$('#tituloGeneral3').html(objeto.titulo || '');
	if (objeto.nombre !== undefined) {
		$('#subtituloGeneral3').html("<div class='alert alert-primary mb-0 mx-3 mt-2'>" + objeto.nombre + "</div>");
	} else {
		$('#subtituloGeneral3').html('');
	}
	$('#contenidoGeneral3').html(objeto.msg || '');

	$('#general3 button[name=btnCancela]').off('click').on('click', function () {
		oc.hide();
		$('#contenidoGeneral3').html('');
		$('#subtituloGeneral3').html('');
	});
}

function cerrar_general1() {
	const el = document.getElementById('general1');
	const oc = bootstrap.Offcanvas.getInstance(el);
	if (oc) {
		oc.hide();
		$('#contenidoGeneral1').html('');
		$('#subtituloGeneral1').html('');
		$('#general1 span#padreId').text('');
	}
}
