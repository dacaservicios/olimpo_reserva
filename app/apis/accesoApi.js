const express = require('express');
const router = express.Router();
const {password,logout,verificaPass,datos} = require('../controllers/accesoControllers');
const {verificarToken} = require('../middlewares/jwt');
const {caracter, isLogin, validaSchema} = require('../middlewares/auth');
const {schemaDatosCliente} = require('../middlewares/schema');

router.put('/api/acceso/password/:sesId',isLogin, verificarToken, password);
router.put('/api/acceso/verificaPass/:sesId',isLogin, verificarToken, verificaPass);
router.put('/api/acceso/datos/:sesId',isLogin, caracter, validaSchema(schemaDatosCliente), verificarToken, datos);
router.put('/api/acceso/logout/:sesId',isLogin, caracter, verificarToken, logout);
router.put('/api/acceso/terminaToken/:sesId',isLogin, caracter, logout);
module.exports = router;
