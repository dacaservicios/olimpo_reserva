const express = require('express');
const router = express.Router();
const {buscar,listar,listar_wp} = require('../controllers/clienteControllers');
const {verificarToken} = require('../middlewares/jwt');


router.get('/api/cliente/listar/:id/:sesId', verificarToken, listar);
router.get('/api/cliente/listar_wp/:id/:sesId', verificarToken, listar_wp);
router.get('/api/cliente/buscar/:id/:sesId', verificarToken, buscar);

module.exports = router;