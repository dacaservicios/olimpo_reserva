const express = require('express');
const router = express.Router();
const {listar} = require('../controllers/sucursalControllers');
const {verificarToken} = require('../middlewares/jwt');


router.get('/api/sucursal/listar/:id/:sesId', verificarToken, listar);

module.exports = router;