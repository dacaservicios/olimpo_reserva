const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const {isLogin, notLogin, verificarLogin, verificarCorreo, caracter,sesion,validaSchema, privilegios2} = require('../middlewares/auth');
const {schemaLogin, schemaRegister, schemaRecupera, schemaOlvidaPassword} = require('../middlewares/schema');
const axios = require('axios');
const config = require('../config/config');


/*=================VISTAS INICIO===================*/

router.get('/instalar', (req, res) => {
    res.render(path.join(__dirname, '../views/instalar'));
});

router.get('/', notLogin, (req, res) => {
    res.render('index');
});

router.post('/vista/inicio/login', notLogin, (req, res) => {
    res.render(path.join(__dirname,'../views/inicio/login'));
});

router.post('/vista/inicio/register', notLogin, (req, res) => {
    res.render(path.join(__dirname,'../views/inicio/register'));
});

router.post('/vista/inicio/olvidaPassword', notLogin, (req, res) => {
    res.render(path.join(__dirname,'../views/inicio/olvidaPassword'));
});


router.get('/sistema', isLogin,(req, res) => {
    res.render(path.join(__dirname,'../views/sistema'),{
        user:req.session.passport.user
    });
});


router.post('/inicio/verificaLogin', notLogin, caracter, validaSchema(schemaLogin), verificarLogin);

router.post('/inicio/verificaLoginOk', notLogin, caracter, validaSchema(schemaLogin), (req, res, next) => {
    passport.authenticate('local.login', (err, user, info) => {
        if (err) {
            return res.status(500).json({
                error: { message: err.message || JSON.stringify(err), errno: err.errno || 0, code: err.code || 'ERR' }
            });
        }
        if (!user) {
            return res.json({
                valor: { user: { resultado: false, mensaje: (info && info.message) || 'Error de autenticación' } }
            });
        }
        req.logIn(user, (loginErr) => {
            if (loginErr) {
                return res.status(500).json({
                    error: { message: loginErr.message, errno: 0, code: 'SESSION_ERR' }
                });
            }
            return res.json({ valor: { user: req.user, url: config.URL_SISTEMA } });
        });
    })(req, res, next);
});

router.post('/inicio/register', notLogin, validaSchema(schemaRegister), async(req, res) => {
    try {
        const register = await axios.post(config.URL_SISTEMA+"/api/inicio/register",req.body);
        res.json({
            valor : register.data.valor
        });
    }catch (err) {
        res.status(400).json({
            error : {
                message:err.response.data.error.message,
                errno: err.response.data.error.errno,
                code :err.response.data.error.code
            }
        });
      }
});


router.post('/inicio/password', notLogin, validaSchema(schemaOlvidaPassword), async (req, res) => {
    try {
        const password = await axios.post(config.URL_SISTEMA+"/api/inicio/password",req.body);
        res.json({
            valor : password.data.valor
        });
    }catch (err) {
        res.status(400).json({
            error : {
                message:err.response.data.error.message,
                errno: err.response.data.error.errno,
                code :err.response.data.error.code
            }
        });
    }
    
});

router.post('/inicio/recupera', notLogin, validaSchema(schemaRecupera), verificarCorreo, async(req, res) => {
    try {
        const recupera = await axios.put(config.URL_SISTEMA+"/api/inicio/recupera/10",req.body);
        res.json({
            valor : recupera.data.valor
        });
    }catch (err) {
        res.status(400).json({
            error : {
                message:err.response.data.error.message,
                errno: err.response.data.error.errno,
                code :err.response.data.error.code
            }
        });
    }
});

/*=============================================*/

module.exports = router;