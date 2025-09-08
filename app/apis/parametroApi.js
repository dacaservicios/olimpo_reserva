const express = require('express');
const router = express.Router();
const {listarId} = require('../controllers/parametroControllers');
const {verificarToken} = require('../middlewares/jwt');
const {caracter} = require('../middlewares/auth');

router.get('/api/parametro/detalle/listar/:id/:sesId', caracter, verificarToken, listarId);


module.exports = router;