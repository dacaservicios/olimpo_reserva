const express = require('express');
const router = express.Router();
const {buscar} = require('../controllers/clienteControllers');
const {verificarToken} = require('../middlewares/jwt');

// Solo el propio cliente (rama 'cliente_reserva'). Se quitaron listar / listar_wp / editar: usaban ramas internas
// de olimpo ('cliente' filtra por la empresa de un SEG_USUARIO con el ID del cliente; 'cliente_wp' exponía la
// mensajería de cualquier sucursal) y la UI no los usaba. El perfil se edita con PUT /api/acceso/datos/:sesId.
router.get('/api/cliente/buscar/:id/:sesId', verificarToken, buscar);

module.exports = router;
