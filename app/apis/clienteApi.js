const express = require('express');
const router = express.Router();
const {editar,buscar,listar,listar_wp} = require('../controllers/clienteControllers');
const {verificarToken} = require('../middlewares/jwt');
const {schemaCliente} = require('../middlewares/schema');
const {caracter, validaSchema, verificaAdjunto} = require('../middlewares/auth');

router.get('/api/cliente/listar/:id/:sesId', verificarToken, listar);
router.get('/api/cliente/listar_wp/:id/:sesId', verificarToken, listar_wp);
router.get('/api/cliente/buscar/:id/:sesId', verificarToken, buscar);
router.put('/api/cliente/editar/:id', caracter, validaSchema(schemaCliente), verificaAdjunto, verificarToken, editar);

module.exports = router;