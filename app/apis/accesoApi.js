const express = require('express');
const router = express.Router();
const {password,logout,verificaPass} = require('../controllers/accesoControllers');
const {verificarToken} = require('../middlewares/jwt');
const {caracter, isLogin} = require('../middlewares/auth');

router.put('/api/acceso/password/:sesId',isLogin, verificarToken, password);
router.put('/api/acceso/verificaPass/:sesId',isLogin, verificarToken, verificaPass);
router.put('/api/acceso/logout/:sesId',isLogin, caracter, verificarToken, logout);
router.put('/api/acceso/terminaToken/:sesId',isLogin, caracter, logout);
module.exports = router;