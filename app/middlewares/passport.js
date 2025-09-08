const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {login} = require('../models/inicioModels');
const {buscarCliente} = require('../models/clienteModels');

passport.use('local.login',new LocalStrategy({
    usernameField : 'txtCorreo',
    passwordField : 'txtContrasena',
    passReqToCallback : true
}, async (req,username, password, done)=>{
    const body =  req.body;
    const ip =  req.ip;  
    const server =  req.hostname;
    login(ip, server, body)
    .then(valor => {
        if(valor.resultado){
            done(null, valor);
            return;
        }else{
            done(valor, false);
            return;
        }
    })
    .catch(error => {
        done(error);
        return;
    });

}
));

passport.serializeUser((user, done)=>{
    done(null, user);
});

passport.deserializeUser((user, done)=>{
    buscarCliente(user.id,'cliente',user.id)
    .then(valor => {
        done(null, valor);
    })
    .catch(error => {
        done(error);
        return;
    });
});

