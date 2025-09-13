const express = require('express');
const router = express.Router();
const {listar} = require('../controllers/serviciosucursalControllers');
const {verificarToken} = require('../middlewares/jwt');


router.get('/api/serviciosucursal/listar/:id/:sesId', verificarToken, listar);

module.exports = router;