// ═══════════════════════════════════════════
//  OLIMPO BARBER — VISTA RESERVAS + WIZARD
// ═══════════════════════════════════════════

// ── Estado global del calendario ──
let _calDate     = moment();
let _calSelected = moment();
let _calEvents   = [];
let _calTabla    = 'reserva';

// ── Estado del wizard ──
let _wiz      = {};
let _wizData  = { tipos: [], servicios: [], barberos: [], clientes: [], sucursales: [] };
let _wizCalDate = moment();

// ── Detalle/edición de reserva ──
let _resDetalle = null;

// ── Entry point ──
$(document).ready(function () {
	try { vistaReserva(); }
	catch (err) {
		desbloquea();
		mensajeError((err.response) ? err.response.data.error : err);
	}
});

// ═══════════════════════════════════════════
//  VISTA PRINCIPAL — CALENDARIO
// ═══════════════════════════════════════════
async function vistaReserva() {
	_calTabla    = 'reserva';
	_calDate     = moment();
	_calSelected = moment();
	const today = moment().format('YYYY-MM-DD');

	const dow  = moment().locale('es').format('dddd');
	const num  = moment().format('D');
	const mes  = moment().locale('es').format('MMMM YYYY');

	const html = `
	<div class="md-cal-app">
		<div class="md-today-header">
			<div class="md-today-dow">${dow.charAt(0).toUpperCase() + dow.slice(1)}</div>
			<div class="md-today-num">${num}</div>
			<div class="md-today-mes">${mes.charAt(0).toUpperCase() + mes.slice(1)}</div>
		</div>
		<div id="calCards"></div>
		<button class="md-nueva-reserva-btn" onclick="nuevaReservaFecha('${today}')">
			<i class="las la-calendar-plus"></i> Nueva Reserva
		</button>
	</div>
	<a href="https://wa.me/51963754038?text=Hola%20👋%0Aquisiera%20hacer%20una%20consulta%20📩😊"
		class="whatsapp-float" target="_blank">
		<i class="lab la-whatsapp"></i>
	</a>`;

	$('#cuerpoPrincipal').html(html);
	await _cargarEventos();
	_renderCards(today, false);
}

async function _cargarEventos() {
	bloquea();
	try {
		const r = await axios.get('/api/' + _calTabla + '/listar/0/' + verSesion(), {
			headers: { authorization: `Bearer ${verToken()}` }
		});
		_calEvents = r.data.valor.info || [];
	} catch (err) {
		mensajeError((err.response) ? err.response.data.error : err);
	}
	desbloquea();
}

async function refrescarCalendario() {
	await _cargarEventos();
	_renderCalendar();
}

function _renderCalendar() {
	const mes = _calDate.clone().locale('es').format('MMMM');
	$('#calMonthLbl').text(mes.charAt(0).toUpperCase() + mes.slice(1));
	$('#calYearLbl').text(_calDate.format('YYYY'));

	const lastDay = _calDate.clone().endOf('month').date();
	const today   = moment().format('YYYY-MM-DD');
	const selStr  = _calSelected.format('YYYY-MM-DD');

	let html = '';
	for (let d = 1; d <= lastDay; d++) {
		const dateStr = _calDate.clone().date(d).format('YYYY-MM-DD');
		const m       = _calDate.clone().date(d);
		const isToday = dateStr === today;
		const isSel   = dateStr === selStr;
		const isPast  = dateStr < today;

		const dayEvts = _calEvents.filter(e =>
			moment(e.FECHA_RESERVA).format('YYYY-MM-DD') === dateStr
		);
		const dots = dayEvts.slice(0, 3).map(e =>
			`<span class="md-dot" style="background:${e.COLOR || 'var(--md-primary)'}"></span>`
		).join('');

		let cls = 'md-strip-day';
		if (isToday)            cls += ' today';
		if (isSel)              cls += ' selected';
		if (isPast && !isToday) cls += ' past';
		if (dayEvts.length > 0) cls += ' has-events';

		const dow = m.locale('es').format('ddd').replace('.', '').toUpperCase();

		html += `<div class="${cls}" data-date="${dateStr}">
			<span class="md-strip-dow">${dow}</span>
			<span class="md-strip-num">${d}</span>
			<div class="md-strip-dots">${dots}</div>
		</div>`;
	}

	$('#calDayStrip').html(html);

	// Auto-scroll al día seleccionado (o hoy si no hay selección en este mes)
	setTimeout(() => {
		const target = document.querySelector('#calDayStrip .selected')
			|| document.querySelector('#calDayStrip .today');
		if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	}, 60);

	$('#calDayStrip').off('click').on('click', '.md-strip-day', function () {
		const date = $(this).data('date');
		if (!date) return;
		_calSelected = moment(date);
		$('#calDayStrip .md-strip-day').removeClass('selected');
		$(this).addClass('selected');
		_renderCards(date);
	});

	if (_calSelected.format('YYYY-MM') === _calDate.format('YYYY-MM')) {
		_renderCards(selStr);
	} else {
		$('#calDayTitle').text('Selecciona un día');
		$('#calCards').html('');
	}
}

function _renderCards(dateStr, showAddBtn = true) {
	const dayEvts = _calEvents.filter(e =>
		moment(e.FECHA_RESERVA).format('YYYY-MM-DD') === dateStr
	).sort((a, b) =>
		moment(a.FECHA_RESERVA).valueOf() - moment(b.FECHA_RESERVA).valueOf()
	);

	const label = moment(dateStr).locale('es').format('dddd D [de] MMMM');
	$('#calDayTitle').text(label.charAt(0).toUpperCase() + label.slice(1));

	const today  = moment().format('YYYY-MM-DD');
	const isPast = dateStr < today;

	if (dayEvts.length === 0) {
		$('#calCards').html(`
			<div class="md-cal-empty">
				<i class="las la-calendar-times"></i>
				<p>Sin reservas este día</p>
				${!isPast && showAddBtn ? `<button class="btn btn-primary mt-3" onclick="nuevaReservaFecha('${dateStr}')">
					<i class="las la-plus"></i> Nueva reserva
				</button>` : ''}
			</div>`);
		return;
	}

	let html = dayEvts.map(e => {
		const hora     = moment(e.FECHA_RESERVA).format('HH:mm');
		const cliente  = `${e.PATERNO_CLIENTE} ${e.NOMBRE_CLIENTE}`;
		const barbero  = e.NOMBRE_EMPLEADO || '';
		const servicio = e.NOMBRE || '';
		const color    = e.COLOR || 'var(--md-primary)';
		const fg       = (typeof getContrastColor === 'function') ? getContrastColor(color) : '#fff';

		return `
		<div class="md-res-card${isPast ? ' past' : ''}"
			data-id="${e.ID_RESERVA}" data-date="${dateStr}">
			<div class="md-res-chip" style="background:${color};color:${fg}">
				<span class="md-res-hora">${hora}</span>
			</div>
			<div class="md-res-info">
				<div class="md-res-cliente">${cliente}</div>
				<div class="md-res-meta">
					<i class="las la-cut"></i> ${servicio}
					&nbsp;·&nbsp;
					<i class="las la-user"></i> ${barbero}
				</div>
			</div>
			${!isPast ? '<i class="las la-pen md-res-edit"></i>' : ''}
		</div>`;
	}).join('');

	if (!isPast && showAddBtn) {
		html += `<button class="md-add-btn" onclick="nuevaReservaFecha('${dateStr}')">
			<i class="las la-plus"></i> Agregar reserva
		</button>`;
	}

	$('#calCards').html(html);

	if (!isPast) {
		$('#calCards').off('click', '.md-res-card').on('click', '.md-res-card', function () {
			const id  = $(this).data('id');
			const evt = _calEvents.find(e => e.ID_RESERVA == id);
			if (evt) verDetalleReserva(evt);
		});
	}
}

// ═══════════════════════════════════════════
//  DETALLE DE RESERVA
// ═══════════════════════════════════════════

function verDetalleReserva(evt, soloLectura = false) {
	const hora    = moment(evt.FECHA_RESERVA).format('HH:mm');
	const fechaLb = moment(evt.FECHA_RESERVA).locale('es').format('D [de] MMMM YYYY');
	const fechaStr = fechaLb.charAt(0).toUpperCase() + fechaLb.slice(1);
	const cliente  = `${evt.PATERNO_CLIENTE || ''} ${evt.NOMBRE_CLIENTE || ''}`.trim();
	const barbero  = evt.NOMBRE_EMPLEADO || '—';
	const servicio = evt.NOMBRE || '—';
	const color    = evt.COLOR || 'var(--md-primary)';
	const id       = evt.ID_RESERVA;

	_resDetalle = evt;

	const estadoBadge = _resEstadoBadge(evt.ESTADO || evt.ID_ESTADO);

	$('#general1').removeClass('wiz-active');
	mostrar_general1({
		titulo: 'Detalle de Reserva',
		msg: `
		<div class="res-detail">
			<div class="res-detail-hero" style="border-left:4px solid ${color}">
				<div class="res-detail-time">${hora}</div>
				<div class="res-detail-date">${fechaStr}</div>
			</div>

			<div class="res-detail-card">
				<div class="res-detail-row">
					<span class="res-detail-key"><i class="las la-user"></i> Cliente</span>
					<span class="res-detail-val">${cliente}</span>
				</div>
				<div class="res-detail-row">
					<span class="res-detail-key"><i class="las la-cut"></i> Servicio</span>
					<span class="res-detail-val">${servicio}</span>
				</div>
				<div class="res-detail-row">
					<span class="res-detail-key"><i class="las la-user-tie"></i> Barbero</span>
					<span class="res-detail-val">${barbero}</span>
				</div>
				<div class="res-detail-row">
					<span class="res-detail-key"><i class="las la-clock"></i> Hora</span>
					<span class="res-detail-val">${hora}</span>
				</div>
				${evt.TIPO_CLIENTE ? `
				<div class="res-detail-row">
					<span class="res-detail-key"><i class="las la-user-tag"></i> Tipo</span>
					<span class="res-detail-val">${evt.TIPO_CLIENTE}</span>
				</div>` : ''}
				<div class="res-detail-row${evt.COMENTARIO ? '' : ' last'}">
					<span class="res-detail-key"><i class="las la-tag"></i> Estado</span>
					<span class="res-detail-val">${estadoBadge}</span>
				</div>
				${evt.COMENTARIO ? `
				<div class="res-detail-row last">
					<span class="res-detail-key"><i class="las la-comment-alt"></i> Nota</span>
					<span class="res-detail-val">${evt.COMENTARIO}</span>
				</div>` : ''}
			</div>

			${!soloLectura ? `
			<div class="res-detail-actions">
				<button class="res-btn-edit" onclick="abrirEdicionReserva(${id})">
					<i class="las la-pen"></i> Editar
				</button>
				<button class="res-btn-cancel" onclick="_resCancelarActual()">
					<i class="las la-times-circle"></i> Cancelar Cita
				</button>
			</div>` : ''}
		</div>`
	});
}

function _resEstadoBadge(estado) {
	const map = {
		'PENDIENTE':   ['#2e1a00', '#f59e0b', 'PENDIENTE'],
		'CONFIRMADO':  ['#0a2e10', '#4caf50', 'CONFIRMADO'],
		'CONFIRMADA':  ['#0a2e10', '#4caf50', 'CONFIRMADA'],
		'CANCELADO':   ['#2e0a0a', '#cf6679', 'CANCELADO'],
		'CANCELADA':   ['#2e0a0a', '#cf6679', 'CANCELADA'],
		'COMPLETADO':  ['#0a1e2e', '#64b5f6', 'COMPLETADO'],
		'COMPLETADA':  ['#0a1e2e', '#64b5f6', 'COMPLETADA'],
	};
	const key = String(estado || '').toUpperCase();
	const [bg, fg, lbl] = map[key] || ['#1a1a1a', '#909090', estado || 'PENDIENTE'];
	return `<span class="res-estado-badge" style="background:${bg};color:${fg};border-color:${fg}">${lbl}</span>`;
}

function _resCancelarActual() {
	if (!_resDetalle) return;
	const nombre = `${_resDetalle.PATERNO_CLIENTE || ''} ${_resDetalle.NOMBRE_CLIENTE || ''}`.trim();
	reservaElimina({ id: _resDetalle.ID_RESERVA, nombre, tabla: 'reserva' });
}

// ═══════════════════════════════════════════
//  MIS CITAS — PANEL COMPLETO
// ═══════════════════════════════════════════

function abrirMisCitas() {
	setNavActive('navMisCitas');
	const oc = new bootstrap.Offcanvas(document.getElementById('offcanvasMisCitas'));
	oc.show();

	if (!_calEvents || _calEvents.length === 0) {
		$('#misCitasBody').html(`<div class="md-cal-empty">
			<i class="las la-calendar-times"></i>
			<p>Sin citas registradas</p>
		</div>`);
		return;
	}

	const today = moment().format('YYYY-MM-DD');

	const proximas = [..._calEvents]
		.filter(e => moment(e.FECHA_RESERVA).format('YYYY-MM-DD') >= today)
		.sort((a, b) => moment(a.FECHA_RESERVA).valueOf() - moment(b.FECHA_RESERVA).valueOf());

	const pasadas = [..._calEvents]
		.filter(e => moment(e.FECHA_RESERVA).format('YYYY-MM-DD') < today)
		.sort((a, b) => moment(b.FECHA_RESERVA).valueOf() - moment(a.FECHA_RESERVA).valueOf());

	const renderGroup = (eventos, isPast) => {
		const groups = {};
		eventos.forEach(e => {
			const d = moment(e.FECHA_RESERVA).format('YYYY-MM-DD');
			if (!groups[d]) groups[d] = [];
			groups[d].push(e);
		});
		return Object.keys(groups).map(dateStr => {
			const label = moment(dateStr).locale('es').format('ddd D [de] MMMM');
			const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
			const cards = groups[dateStr].map(e => _misCitasCard(e, isPast)).join('');
			return `<div class="md-citas-group-header${isPast ? ' past' : ''}">${labelCap}</div>${cards}`;
		}).join('');
	};

	let html = '';
	if (proximas.length > 0) {
		html += `<div class="md-citas-section-title">Próximas</div>` + renderGroup(proximas, false);
	}
	if (pasadas.length > 0) {
		html += `<div class="md-citas-section-title past">Anteriores</div>` + renderGroup(pasadas, true);
	}

	$('#misCitasBody').html(html);

	$('#misCitasBody').off('click', '.md-res-card').on('click', '.md-res-card', function () {
		const id      = $(this).data('id');
		const isPast  = $(this).hasClass('past');
		const evt     = _calEvents.find(e => e.ID_RESERVA == id);
		if (!evt) return;
		bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMisCitas')).hide();
		setTimeout(() => verDetalleReserva(evt, isPast), 350);
	});
}

function _misCitasCard(e, isPast) {
	const hora    = moment(e.FECHA_RESERVA).format('HH:mm');
	const cliente = `${e.PATERNO_CLIENTE || ''} ${e.NOMBRE_CLIENTE || ''}`.trim();
	const barbero  = e.NOMBRE_EMPLEADO || '';
	const servicio = e.NOMBRE || '';
	const color    = e.COLOR || 'var(--md-primary)';
	const fg       = (typeof getContrastColor === 'function') ? getContrastColor(color) : '#fff';
	return `
	<div class="md-res-card${isPast ? ' past' : ''}" data-id="${e.ID_RESERVA}">
		<div class="md-res-chip" style="background:${color};color:${fg}">
			<span class="md-res-hora">${hora}</span>
		</div>
		<div class="md-res-info">
			<div class="md-res-cliente">${cliente}</div>
			<div class="md-res-meta">
				<i class="las la-cut"></i> ${servicio}
				&nbsp;·&nbsp;
				<i class="las la-user"></i> ${barbero}
			</div>
		</div>
		${!isPast ? '<i class="las la-pen md-res-edit"></i>' : ''}
	</div>`;
}

// ═══════════════════════════════════════════
//  EDICIÓN DE RESERVA
// ═══════════════════════════════════════════

async function abrirEdicionReserva(id) {
	bloquea();
	try {
		const r = await axios.get(`/api/reserva/buscar/${id}/${verSesion()}`, {
			headers: { authorization: `Bearer ${verToken()}` }
		});
		const res = r.data.valor.info;
		_resDetalle = { ..._resDetalle, ...res, _id: id };
		desbloquea();
		_mostrarFormEdicion(res, id);
	} catch (err) {
		desbloquea();
		mensajeError(err.response ? err.response.data.error : err);
	}
}

function _mostrarFormEdicion(res, id) {
	$('#general1').removeClass('wiz-active');
	const today       = moment();
	const fechaActual = moment(res.FECHA_RESERVA);
	let   fechaEdit   = fechaActual.clone();

	// Si la fecha es pasada, usar hoy
	if (fechaEdit.isBefore(today, 'day')) fechaEdit = today.clone();

	let daysHtml = '';
	for (let i = 0; i < 14; i++) {
		const d   = today.clone().add(i, 'days');
		const ds  = d.format('YYYY-MM-DD');
		const sel = ds === fechaEdit.format('YYYY-MM-DD') ? ' selected' : '';
		daysHtml += `<div class="wiz-day-item${sel}" data-date="${ds}">
			<div class="wiz-day-dow">${d.locale('es').format('ddd').replace('.', '').toUpperCase()}</div>
			<div class="wiz-day-num">${d.format('D')}</div>
			<div class="wiz-day-mon">${d.locale('es').format('MMM').replace('.', '')}</div>
		</div>`;
	}

	// Cambiar título del offcanvas
	$('#tituloGeneral1').text('Editar Reserva');

	$('#contenidoGeneral1').html(`
		<div class="res-edit-form" id="resEditForm"
			data-id="${id}"
			data-empleado="${res.ID_EMPLEADO}"
			data-cliente="${res.ID_CLIENTE}"
			data-servicio="${res.ID_SERVICIO_SUCURSAL}"
			data-hora="${moment(res.FECHA_RESERVA).format('HH:mm')}"
			data-tipocliente="${res.ID_TIPO_CLIENTE || 0}">

			<div class="res-edit-section-lbl"><i class="las la-calendar-alt"></i> Fecha</div>
			<div class="wiz-day-strip-wrap">
				<div class="wiz-day-strip" id="editDayStrip">${daysHtml}</div>
			</div>

			<div class="res-edit-section-lbl" style="margin-top:14px"><i class="las la-clock"></i> Horario</div>
			<div id="editTimeGrid"><div class="wiz-time-empty"><i class="las la-spinner la-spin"></i> Cargando...</div></div>

			<div class="res-edit-section-lbl" style="margin-top:14px"><i class="las la-comment-alt"></i> Notas</div>
			<textarea id="editComentario" class="res-edit-textarea" placeholder="Notas opcionales...">${res.COMENTARIO || ''}</textarea>

			<button class="res-btn-guardar" onclick="guardarCambiosReserva()">
				<i class="las la-check-circle"></i> Guardar cambios
			</button>
		</div>
	`);

	// Auto-scroll al día seleccionado
	setTimeout(() => {
		const sel = document.querySelector('#editDayStrip .wiz-day-item.selected');
		if (sel) sel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	}, 80);

	// Día click
	$('#contenidoGeneral1').off('click', '.wiz-day-item').on('click', '.wiz-day-item', async function () {
		$('#editDayStrip .wiz-day-item').removeClass('selected');
		$(this).addClass('selected');
		$('#resEditForm').data('hora', '');
		await _editLoadTimes($(this).data('date'), res.ID_EMPLEADO);
	});

	_editLoadTimes(fechaEdit.format('YYYY-MM-DD'), res.ID_EMPLEADO, moment(res.FECHA_RESERVA).format('HH:mm'));
}

async function _editLoadTimes(dateStr, empleadoId, horaPresel) {
	$('#editTimeGrid').html('<div class="wiz-time-empty"><i class="las la-spinner la-spin"></i> Cargando...</div>');
	try {
		const fmt = moment(dateStr).format('DD-MM-YYYY');
		const [rHoras, rHorario] = await Promise.all([
			axios.get(`/api/reserva/listar/hora/${empleadoId}/${fmt}/${verSesion()}`, { headers: { authorization: `Bearer ${verToken()}` } }),
			axios.get(`/api/parametro/detalle/listar/62/${verSesion()}`,              { headers: { authorization: `Bearer ${verToken()}` } })
		]);

		const ocupadas = (rHoras.data.valor.info || []).map(r => r.HORA);
		const horarios = (rHorario.data.valor.info || []).filter(h => h.ES_VIGENTE == 1);

		if (!horarios.length) {
			$('#editTimeGrid').html('<div class="wiz-time-empty">No hay horarios configurados</div>');
			return;
		}

		const slots = horarios.map(h => {
			const hora = h.DESCRIPCIONDETALLE;
			// La hora actual de la reserva NO cuenta como ocupada
			const ocu  = ocupadas.includes(hora) && hora !== horaPresel;
			const sel  = hora === (horaPresel || '') ? ' selected' : '';
			const dis  = ocu ? ' disabled' : '';
			return `<div class="wiz-time-slot${sel}${dis}" data-hora="${hora}">${hora}</div>`;
		}).join('');

		$('#editTimeGrid').html(`<div class="wiz-time-grid">${slots}</div>`);

		$('#editTimeGrid').off('click', '.wiz-time-slot').on('click', '.wiz-time-slot', function () {
			$('.wiz-time-slot').removeClass('selected');
			$(this).addClass('selected');
			$('#resEditForm').data('hora', $(this).data('hora'));
		});

		// Registrar la hora pre-seleccionada en data
		if (horaPresel) $('#resEditForm').data('hora', horaPresel);

	} catch (err) {
		$('#editTimeGrid').html('<div class="wiz-time-empty">Error al cargar horarios</div>');
	}
}

async function guardarCambiosReserva() {
	const $form    = $('#resEditForm');
	const id       = $form.data('id');
	const empleado = $form.data('empleado');
	const cliente  = $form.data('cliente');
	const servicio = $form.data('servicio');
	const hora     = $form.data('hora') || $('#editTimeGrid .wiz-time-slot.selected').data('hora');
	const fecha    = $('#editDayStrip .wiz-day-item.selected').data('date');
	const coment   = $('#editComentario').val();

	if (!fecha) { Swal.fire({ icon: 'warning', title: 'Selecciona una fecha', timer: 2000, showConfirmButton: false, toast: true, position: 'top' }); return; }
	if (!hora)  { Swal.fire({ icon: 'warning', title: 'Selecciona un horario', timer: 2000, showConfirmButton: false, toast: true, position: 'top' }); return; }

	bloquea();
	try {
		const fd = new FormData();
		fd.append('id',           id);
		fd.append('cliente',      cliente);
		fd.append('empleado',     empleado);
		fd.append('servicio',     servicio);
		fd.append('fechaReserva', moment(fecha).format('DD-MM-YYYY'));
		fd.append('horaReserva',  hora);
		fd.append('comentario',   coment || '');
		fd.append('tipoCliente',  $form.data('tipocliente') || 0);
		fd.append('sesId',        verSesion());

		const r = await axios.put(`/api/reserva/editar/${id}`, fd, {
			headers: { authorization: `Bearer ${verToken()}` }
		});
		desbloquea();

		const resp = r.data.valor;
		if (resp.resultado) {
			cerrar_general1();
			await refrescarCalendario();
		} else {
			mensajeSistema(resp.mensaje);
		}
	} catch (err) {
		desbloquea();
		mensajeError(err.response ? err.response.data.error : err);
	}
}

// ═══════════════════════════════════════════
//  WIZARD — NUEVA RESERVA
// ═══════════════════════════════════════════

function _wizReset(fecha) {
	_wiz = {
		step: 1,
		tipo: null, tipoClienteId: null,
		sucursalId: null, sucursalNombre: '',
		servicioId: null, servicioNombre: '', servicioDur: '',
		barberoId: null, barberoNombre: '',
		fecha: fecha || moment().format('YYYY-MM-DD'),
		hora: null,
		clienteId: null, clienteNombre: '',
		comentario: ''
	};
}

async function nuevaReservaFecha(dateStr) {
	_wizReset(dateStr);
	bloquea();

	const diaSemana = moment(dateStr).isoWeekday();

	try {
		const [rServicio, rEmpleado, rCliente, rTipos, rSucursal] = await Promise.all([
			axios.get(`/api/serviciosucursal/listar/0/${verSesion()}`,      { headers: { authorization: `Bearer ${verToken()}` } }),
			axios.get(`/api/empleado/listar/0/${verSesion()}`,              { headers: { authorization: `Bearer ${verToken()}` } }),
			axios.get(`/api/cliente/listar/0/${verSesion()}`,               { headers: { authorization: `Bearer ${verToken()}` } })
				.catch(() => ({ data: { valor: { info: [] } } })),
			axios.get(`/api/parametro/detalle/listar/64/${verSesion()}`,    { headers: { authorization: `Bearer ${verToken()}` } })
				.catch(() => ({ data: { valor: { info: [] } } })),
			axios.get(`/api/sucursal/listar/${verEmpresa()}/${verSesion()}`,              { headers: { authorization: `Bearer ${verToken()}` } })
				.catch(() => ({ data: { valor: { info: [] } } }))
		]);

		_wizData.tipos     = (rTipos.data.valor.info     || []).filter(t => t.ES_VIGENTE == 1);
		_wizData.sucursales = (rSucursal.data.valor.info  || []).filter(s => s.ES_VIGENTE == 1);
		_wizData.servicios = (rServicio.data.valor.info  || []).filter(s => s.ES_VIGENTE == 1);
		_wizData.barberos  = (rEmpleado.data.valor.info || []).filter(e => {
			if (e.ES_VIGENTE != 1) return false;
			const d = e.ID_DESCANSO ? e.ID_DESCANSO.split(',').map(Number) : [];
			return !d.includes(diaSemana);
		});
		_wizData.clientes = rCliente.data.valor.info || [];

		// Fallback: at least one client
		if (!_wizData.clientes.length) {
			try {
				const rb = await axios.get(`/api/cliente/buscar/${verSesion()}/${verSesion()}`, {
					headers: { authorization: `Bearer ${verToken()}` }
				});
				const c = rb.data.valor.info;
				if (c && c.ID_CLIENTE) _wizData.clientes = [c];
			} catch (e2) { /* empty is OK */ }
		}

	} catch (err) {
		desbloquea();
		mensajeError((err.response) ? err.response.data.error : err);
		return;
	}

	desbloquea();

	mostrar_general1({
		titulo: 'Nueva Reserva',
		msg: `<div class="wiz-container" id="wizContainer">
			<div id="wizStepsBar"></div>
			<div id="wizContent" class="wiz-content"></div>
			<div id="wizNav"></div>
		</div>`
	});
	$('#general1').addClass('wiz-active');

	_wizRenderStep();
}

// ── Render principal del paso ──
function _wizRenderStep() {
	_wizRenderBar();
	switch (_wiz.step) {
		case 1: _wizStep1(); break;
		case 2: _wizStep2(); break;
		case 3: _wizStep3(); break;
		case 4: _wizStep4(); break;
		case 5: _wizStep5(); break;
	}
	_wizRenderNav();
}

function _wizRenderBar() {
	let html = '';
	for (let i = 1; i <= 5; i++) {
		const done   = i < _wiz.step;
		const active = i === _wiz.step;
		const cls    = done ? 'done' : active ? 'active' : '';
		const lbl    = done ? '<i class="las la-check"></i>' : i;
		html += `<div class="wiz-step-dot ${cls}">${lbl}</div>`;
		if (i < 5) html += `<div class="wiz-step-line ${done ? 'done' : ''}"></div>`;
	}
	$('#wizStepsBar').html(`<div class="wiz-steps-bar">${html}</div>`);
}

function _wizRenderNav() {
	const isFirst = _wiz.step === 1;
	const isLast  = _wiz.step === 5;
	const back    = isFirst ? '' : `<button class="wiz-btn-back" onclick="_wizBack()">← Atrás</button>`;
	const nextLbl = isLast ? 'Confirmar ✓' : 'Continuar →';
	$('#wizNav').html(`<div class="wiz-nav">${back}<button class="wiz-btn-next" onclick="_wizNext()">${nextLbl}</button></div>`);
}

// ── Paso 1: Tipo de cliente + Sede ──
function _wizStep1() {
	const emojiMap = (desc) => {
		const d = (desc || '').toLowerCase();
		if (d.includes('menor') || d.includes('niño') || d.includes('junior')) return '👦';
		if (d.includes('adulto') || d.includes('mayor')) return '🧔';
		return '👤';
	};

	const tipoCards = (_wizData.tipos.length
		? _wizData.tipos
		: [{ ID_PARAMETRO_DETALLE: 0, DESCRIPCIONDETALLE: 'Sin tipos configurados' }]
	).map(t => {
		const sel = t.ID_PARAMETRO_DETALLE == _wiz.tipoClienteId ? ' selected' : '';
		return `<div class="wiz-tipo-card${sel}"
			data-id="${t.ID_PARAMETRO_DETALLE}" data-nombre="${t.DESCRIPCIONDETALLE}">
			<div class="wiz-tipo-emoji">${emojiMap(t.DESCRIPCIONDETALLE)}</div>
			<div class="wiz-tipo-name">${t.DESCRIPCIONDETALLE}</div>
		</div>`;
	}).join('');

	const sucCards = (_wizData.sucursales.length
		? _wizData.sucursales
		: [{ ID_SUCURSAL: 0, NOMBRE: 'Sin sedes configuradas' }]
	).map(s => {
		const sel = s.ID_SUCURSAL == _wiz.sucursalId ? ' selected' : '';
		return `<div class="wiz-tipo-card wiz-sede-card${sel}"
			data-id="${s.ID_SUCURSAL}" data-nombre="${s.NOMB_SUCURSAL}">
			<div class="wiz-tipo-emoji">📍</div>
			<div class="wiz-tipo-name">${s.NOMB_SUCURSAL}</div>
		</div>`;
	}).join('');

	$('#wizContent').html(`
		<div class="wiz-step-label">¿Para quién es la cita?</div>
		<div class="wiz-step-sub">Selecciona el tipo de cliente</div>
		<div class="wiz-tipo-grid" id="wizTipoGrid">${tipoCards}</div>

		<div class="wiz-step-label" style="margin-top:18px">¿En qué sede quieres atenderte?</div>
		<div class="wiz-step-sub">Selecciona la sucursal</div>
		<div class="wiz-tipo-grid" id="wizSedeGrid">${sucCards}</div>
	`);

	$('#wizTipoGrid').off('click', '.wiz-tipo-card').on('click', '.wiz-tipo-card', function () {
		$('#wizTipoGrid .wiz-tipo-card').removeClass('selected');
		$(this).addClass('selected');
		_wiz.tipoClienteId = $(this).data('id');
		_wiz.tipo          = $(this).data('nombre');
	});

	$('#wizSedeGrid').off('click', '.wiz-sede-card').on('click', '.wiz-sede-card', function () {
		const newId = $(this).data('id');
		if (newId != _wiz.sucursalId) {
			_wiz.servicioId    = null;
			_wiz.servicioNombre = '';
			_wiz.servicioDur   = '';
		}
		$('#wizSedeGrid .wiz-sede-card').removeClass('selected');
		$(this).addClass('selected');
		_wiz.sucursalId     = newId;
		_wiz.sucursalNombre = $(this).data('nombre');
	});
}

// ── Paso 2: Servicio ──
function _wizStep2() {
	const filtrados = _wizData.servicios.filter(s => s.ID_SUCURSAL == _wiz.sucursalId);
	const cards = filtrados.map(s => {
		const sel  = s.ID_SERVICIO_SUCURSAL == _wiz.servicioId ? ' selected' : '';
		const desc = s.DESCRIPCION ? `<div class="wiz-service-dur">${s.DESCRIPCION}</div>` : '';
		return `<div class="wiz-service-card${sel}"
			data-id="${s.ID_SERVICIO_SUCURSAL}" data-nombre="${s.NOMBRE}" data-dur="${s.DURACION || ''}">
			<div class="wiz-service-icon"><i class="las la-cut"></i></div>
			<div class="wiz-service-name">${s.NOMBRE}</div>${desc}
		</div>`;
	}).join('') || '<div class="wiz-empty-msg" style="grid-column:1/-1">No hay servicios disponibles para esta sede</div>';

	$('#wizContent').html(`
		<div class="wiz-step-label">¿Qué servicio necesitas?</div>
		<div class="wiz-step-sub">Elige el servicio para tu cita</div>
		<div class="wiz-service-grid">${cards}</div>
	`);
	$('#wizContent').off('click', '.wiz-service-card').on('click', '.wiz-service-card', function () {
		$('.wiz-service-card').removeClass('selected');
		$(this).addClass('selected');
		_wiz.servicioId    = $(this).data('id');
		_wiz.servicioNombre = $(this).data('nombre');
		_wiz.servicioDur   = $(this).data('dur');
	});
}

// ── Paso 3: Barbero ──
function _wizStep3() {
	const items = _wizData.barberos.map(b => {
		const sel    = b.ID_EMPLEADO == _wiz.barberoId ? ' selected' : '';
		const nombre = `${b.APELLIDO_PATERNO || ''} ${b.APELLIDO_MATERNO || ''} ${b.NOMBRE || ''}`.replace(/\s+/g, ' ').trim();
		const init   = ((b.APELLIDO_PATERNO || '')[0] || '').toUpperCase() + ((b.NOMBRE || '')[0] || '').toUpperCase();
		return `<div class="wiz-barber-item${sel}" data-id="${b.ID_EMPLEADO}" data-nombre="${nombre}">
			<div class="wiz-barber-avatar">${init}</div>
			<div class="wiz-barber-info">
				<div class="wiz-barber-name">${nombre}</div>
				<div class="wiz-barber-role">Barbero</div>
			</div>
			<i class="las la-check-circle wiz-barber-check"></i>
		</div>`;
	}).join('') || '<p class="wiz-empty-msg">No hay barberos disponibles para este día</p>';

	$('#wizContent').html(`
		<div class="wiz-step-label">Elige tu barbero</div>
		<div class="wiz-step-sub">Selecciona el profesional para tu cita</div>
		<div class="wiz-barber-list">${items}</div>
	`);
	$('#wizContent').off('click', '.wiz-barber-item').on('click', '.wiz-barber-item', function () {
		$('.wiz-barber-item').removeClass('selected');
		$(this).addClass('selected');
		_wiz.barberoId     = $(this).data('id');
		_wiz.barberoNombre = $(this).data('nombre');
	});
}

// ── Paso 4: Fecha y hora ──
function _wizStep4() {
	const today = moment();
	const fm    = moment(_wiz.fecha);
	if (fm.isBefore(today, 'day')) _wiz.fecha = today.format('YYYY-MM-DD');
	_wizCalDate = moment(_wiz.fecha).startOf('month');
	_wizRenderCalStep4();
}

function _wizRenderCalStep4() {
	const todayStr    = moment().format('YYYY-MM-DD');
	const selStr      = _wiz.fecha || todayStr;
	const esMesActual = _wizCalDate.format('YYYY-MM') === moment().format('YYYY-MM');
	const lastDay     = _wizCalDate.clone().endOf('month').date();
	const mes         = _wizCalDate.clone().locale('es').format('MMMM');
	const mesCap      = mes.charAt(0).toUpperCase() + mes.slice(1);
	const anio        = _wizCalDate.format('YYYY');

	// Construir lista de fechas: en mes actual solo desde hoy; rellenar con días del siguiente mes
	const dates = [];
	for (let d = 1; d <= lastDay; d++) {
		const ds = _wizCalDate.clone().date(d).format('YYYY-MM-DD');
		if (!esMesActual || ds >= todayStr) dates.push(ds);
	}
	if (esMesActual) {
		const faltantes  = lastDay - dates.length;
		const nextMonth  = _wizCalDate.clone().add(1, 'month');
		for (let d = 1; d <= faltantes; d++) {
			dates.push(nextMonth.clone().date(d).format('YYYY-MM-DD'));
		}
	}

	const daysHtml = dates.map(ds => {
		const m       = moment(ds);
		const isToday = ds === todayStr;
		const isSel   = ds === selStr;
		const dow     = m.locale('es').format('ddd').replace('.', '').toUpperCase();
		let cls = 'wiz-day-item';
		if (isToday) cls += ' today';
		if (isSel)   cls += ' selected';
		return `<div class="${cls}" data-date="${ds}">
			<div class="wiz-day-dow">${dow}</div>
			<div class="wiz-day-num">${m.date()}</div>
		</div>`;
	}).join('');

	const enMesSeleccionado = _wiz.fecha && dates.includes(_wiz.fecha);

	$('#wizContent').html(`
		<div class="wiz-step-label">Elige fecha y hora</div>
		<div class="md-cal-header" style="margin: 0 -4px 4px;">
			<button class="android-icon-btn" id="wizCalPrev" ${esMesActual ? 'disabled style="opacity:.3;pointer-events:none"' : ''}>
				<i class="las la-angle-left"></i>
			</button>
			<div style="text-align:center">
				<div class="md-cal-month-lbl">${mesCap}</div>
				<div class="md-cal-year-lbl">${anio}</div>
			</div>
			<button class="android-icon-btn" id="wizCalNext">
				<i class="las la-angle-right"></i>
			</button>
		</div>
		<div class="wiz-day-strip-wrap">
			<div class="wiz-day-strip" id="wizDayStrip">${daysHtml}</div>
		</div>
		<div class="wiz-time-section-lbl"><i class="las la-clock"></i> Horarios disponibles</div>
		<div id="wizTimeGrid"><div class="wiz-time-empty">Selecciona un día</div></div>
	`);

	setTimeout(() => {
		const target = document.querySelector('#wizDayStrip .wiz-day-item.selected')
			|| document.querySelector('#wizDayStrip .wiz-day-item.today');
		if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
	}, 80);

	$('#wizContent').off('click', '#wizCalPrev').on('click', '#wizCalPrev', () => {
		_wizCalDate.subtract(1, 'month');
		_wizRenderCalStep4();
	});
	$('#wizContent').off('click', '#wizCalNext').on('click', '#wizCalNext', () => {
		_wizCalDate.add(1, 'month');
		_wizRenderCalStep4();
	});

	$('#wizContent').off('click', '.wiz-day-item').on('click', '.wiz-day-item', async function () {
		$('.wiz-day-item').removeClass('selected');
		$(this).addClass('selected');
		_wiz.fecha = $(this).data('date');
		_wiz.hora  = null;
		await _wizLoadTimes(_wiz.fecha);
	});

	if (enMesSeleccionado && _wiz.fecha) _wizLoadTimes(_wiz.fecha);
}

async function _wizLoadTimes(dateStr) {
	$('#wizTimeGrid').html('<div class="wiz-time-empty"><i class="las la-spinner la-spin"></i> Cargando...</div>');
	try {
		const fmt = moment(dateStr).format('DD-MM-YYYY');
		const [rHoras, rHorario] = await Promise.all([
			axios.get(`/api/reserva/listar/hora/${_wiz.barberoId}/${fmt}/${verSesion()}`, { headers: { authorization: `Bearer ${verToken()}` } }),
			axios.get(`/api/parametro/detalle/listar/62/${verSesion()}`,                  { headers: { authorization: `Bearer ${verToken()}` } })
		]);

		const ocupadas = (rHoras.data.valor.info || []).map(r => r.HORA);

		// Bloquear horas que el cliente ya tiene reservadas con este barbero en esta fecha
		(_calEvents || [])
			.filter(e =>
				String(e.ID_EMPLEADO) === String(_wiz.barberoId) &&
				moment(e.FECHA_RESERVA).format('YYYY-MM-DD') === dateStr &&
				e.ESTADO !== 'CANCELADO'
			)
			.forEach(e => {
				const h = moment(e.FECHA_RESERVA).format('HH:mm');
				if (!ocupadas.includes(h)) ocupadas.push(h);
			});

		const esHoy      = moment(dateStr).isSame(moment(), 'day');
		const horaActual = esHoy ? moment().format('HH:mm') : null;

		const horarios = (rHorario.data.valor.info || [])
			.filter(h => h.ES_VIGENTE == 1)
			.filter(h => !esHoy || h.DESCRIPCIONDETALLE > horaActual);

		if (!horarios.length) {
			const msg = esHoy
				? 'No hay horarios disponibles para hoy'
				: 'No hay horarios configurados';
			$('#wizTimeGrid').html(`<div class="wiz-time-empty">${msg}</div>`);
			return;
		}

		const slots = horarios.map(h => {
			const hora = h.DESCRIPCIONDETALLE;
			const ocu  = ocupadas.includes(hora);
			const sel  = hora === _wiz.hora ? ' selected' : '';
			const dis  = ocu ? ' disabled' : '';
			return `<div class="wiz-time-slot${sel}${dis}" data-hora="${hora}">${hora}</div>`;
		}).join('');

		$('#wizTimeGrid').html(`<div class="wiz-time-grid">${slots}</div>`);

		$('#wizTimeGrid').off('click', '.wiz-time-slot').on('click', '.wiz-time-slot', function () {
			$('.wiz-time-slot').removeClass('selected');
			$(this).addClass('selected');
			_wiz.hora = $(this).data('hora');
		});

	} catch (err) {
		$('#wizTimeGrid').html('<div class="wiz-time-empty">Error al cargar horarios</div>');
	}
}

// ── Paso 5: Cliente ──
function _wizStep5() {
	const c   = _wizData.clientes[0] || {};
	const nom = `${c.APELLIDO_PATERNO || ''} ${c.APELLIDO_MATERNO || ''} ${c.NOMBRE || ''}`.replace(/\s+/g, ' ').trim();
	const ini = ((c.APELLIDO_PATERNO || '')[0] || (c.NOMBRE || '')[0] || '?').toUpperCase();

	_wiz.clienteId     = c.ID_CLIENTE;
	_wiz.clienteNombre = nom;

	$('#wizContent').html(`
		<div class="wiz-step-label">Confirma el cliente</div>
		<div class="wiz-client-item selected" style="pointer-events:none">
			<div class="wiz-client-avatar">${ini}</div>
			<div class="wiz-client-info">
				<div class="wiz-client-name">${nom}</div>
				${c.NRO_CELULAR ? `<div class="wiz-client-phone"><i class="las la-phone"></i> ${c.NRO_CELULAR}</div>` : ''}
			</div>
			<i class="las la-check-circle wiz-client-check" style="display:block"></i>
		</div>
		<div class="wiz-field-group" style="margin-top:14px">
			<div class="wiz-field-label"><i class="las la-comment-alt"></i> Comentario</div>
			<input type="text" id="wizComentario" class="wiz-field-input" placeholder="Opcional..." value="${_wiz.comentario || ''}">
		</div>
	`);
}

// ── Navegación ──
function _wizBack() {
	if (_wiz.step > 1) { _wiz.step--; _wizRenderStep(); }
}

async function _wizNext() {
	const toast = (msg) => Swal.fire({
		icon: 'warning', title: msg, timer: 2000,
		showConfirmButton: false, toast: true, position: 'top'
	});

	switch (_wiz.step) {
		case 1:
			if (!_wiz.tipoClienteId) { toast('Selecciona el tipo de cliente'); return; }
			if (!_wiz.sucursalId)    { toast('Selecciona una sede'); return; }
			break;
		case 2:
			if (!_wiz.servicioId) { toast('Selecciona un servicio'); return; }
			break;
		case 3:
			if (!_wiz.barberoId)  { toast('Selecciona un barbero'); return; }
			break;
		case 4:
			if (!_wiz.fecha)      { toast('Selecciona una fecha'); return; }
			if (!_wiz.hora)       { toast('Selecciona una hora disponible'); return; }
			break;
		case 5:
			_wiz.comentario = $('#wizComentario').val();
			if (!_wiz.clienteId)  { toast('Selecciona un cliente de la lista'); return; }
			await _wizEnviar();
			return;
	}
	_wiz.step++;
	_wizRenderStep();
}

async function _wizEnviar() {
	const $btn = $('.wiz-btn-next');
	$btn.prop('disabled', true).text('Enviando…');
	bloquea();
	try {
		const fd = new FormData();
		fd.append('id',           0);
		fd.append('cliente',      _wiz.clienteId);
		fd.append('empleado',     _wiz.barberoId);
		fd.append('servicio',     _wiz.servicioId);
		fd.append('fechaReserva', moment(_wiz.fecha).format('DD-MM-YYYY'));
		fd.append('horaReserva',  _wiz.hora);
		fd.append('comentario',   _wiz.comentario || '');
		fd.append('tipoCliente',  _wiz.tipoClienteId);
		fd.append('sucursal',     _wiz.sucursalId);
		fd.append('sesId',        verSesion());

		const r = await axios.post('/api/reserva/crear', fd, {
			headers: { authorization: `Bearer ${verToken()}` }
		});
		desbloquea();

		const resp = r.data.valor;
		if (resp.resultado) {
			_wizShowSuccess(resp.mensaje);
			await refrescarCalendario();
		} else {
			mensajeSistema(resp.mensaje);
		}
	} catch (err) {
		$btn.prop('disabled', false).text('Confirmar ✓');
		desbloquea();
		mensajeError((err.response) ? err.response.data.error : err);
	}
}

function _wizShowSuccess(mensaje) {
	const fl      = moment(_wiz.fecha).locale('es').format('D [de] MMMM [de] YYYY');
	const fechaLbl = fl.charAt(0).toUpperCase() + fl.slice(1);
	const sinWsp   = mensaje && mensaje.includes('WhatsApp');
	const avisoWsp = sinWsp
		? `<div class="wiz-success-warn"><i class="las la-exclamation-triangle"></i> No se pudo enviar la notificación por WhatsApp. Tu reserva sí quedó registrada.</div>`
		: '';

	$('#wizStepsBar, #wizNav').html('');
	$('#wizContent').html(`
		<div class="wiz-success">
			<div class="wiz-success-icon"><i class="las la-check"></i></div>
			<div class="wiz-success-title">¡Reserva creada!</div>
			<div class="wiz-success-sub">Tu reserva ha sido confirmada.</div>
			${avisoWsp}
			<div class="wiz-success-summary">
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Servicio</span>
					<span class="wiz-sum-val">${_wiz.servicioNombre}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Barbero</span>
					<span class="wiz-sum-val">${_wiz.barberoNombre}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Fecha</span>
					<span class="wiz-sum-val">${fechaLbl}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Hora</span>
					<span class="wiz-sum-val">${_wiz.hora}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Cliente</span>
					<span class="wiz-sum-val">${_wiz.clienteNombre}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Tipo</span>
					<span class="wiz-sum-val">${_wiz.tipo || '—'}</span>
				</div>
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Sede</span>
					<span class="wiz-sum-val">${_wiz.sucursalNombre || '—'}</span>
				</div>
				${_wiz.comentario ? `
				<div class="wiz-sum-row">
					<span class="wiz-sum-key">Comentario</span>
					<span class="wiz-sum-val">${_wiz.comentario}</span>
				</div>` : ''}
			</div>
			<button class="wiz-btn-primary" onclick="cerrar_general1()">
				<i class="las la-calendar-check"></i> Volver al calendario
			</button>
		</div>
	`);
}

function reservaElimina(objeto) {
	confirm(`¡Eliminará la reserva de: ${objeto.nombre}!`, function () {
		return false;
	}, async function () {
		bloquea();
		try {
			const r = await axios.delete(`/api/${objeto.tabla}/eliminar/${objeto.id}`, {
				headers: { authorization: `Bearer ${verToken()}` }
			});
			desbloquea();
			cerrar_general1();
			const resp = r.data.valor;
			if (resp.resultado) {
				await refrescarCalendario();
			} else {
				mensajeSistema(resp.mensaje);
			}
		} catch (err) {
			desbloquea();
			mensajeError((err.response) ? err.response.data.error : err);
		}
	});
}

function reservaEstado(objeto) {
	confirm(`¡Cambiará el estado del registro: ${objeto.nombre}!`, function () {
		return false;
	}, async function () {
		bloquea();
		try {
			const r = await axios.put(`/api/${objeto.tabla}/estado/${objeto.id}`, {}, {
				headers: { authorization: `Bearer ${verToken()}` }
			});
			desbloquea();
			const resp = r.data.valor;
			if (resp.resultado) {
				await refrescarCalendario();
			} else {
				mensajeSistema(resp.mensaje);
			}
		} catch (err) {
			desbloquea();
			mensajeError((err.response) ? err.response.data.error : err);
		}
	});
}
