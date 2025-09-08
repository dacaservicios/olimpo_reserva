const express = require('express');
const router = express.Router();
const {buscar,listar} = require('../controllers/empleadoControllers');
const {verificarToken} = require('../middlewares/jwt');


router.get('/api/empleado/listar/:id/:sesId', verificarToken, listar);
router.get('/api/empleado/buscar/:id/:sesId', verificarToken, buscar);


module.exports = router;