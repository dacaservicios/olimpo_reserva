const nodemailer = require('nodemailer');
const config = require('./config');

const enviaEmail = async (para, asunto, mensaje, ruta, file) => {
    const transporter = nodemailer.createTransport({
        host:   config.HOST_EMAIL,
        port:   config.PORT_EMAIL2,
        secure: config.SECURE2,
        debug:  config.DEBUG,
        auth: {
            user: config.USER_EMAIL,
            pass: config.PASSWORD_EMAIL
        },
        tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
        from:    config.CORREO_SERVIDOR,
        to:      para,
        subject: asunto,
        text:    mensaje,
        html:    mensaje
    };

    if (file !== '') {
        mailOptions.attachments = [{ filename: file, path: ruta }];
    }

    await transporter.sendMail(mailOptions);
}

module.exports = { enviaEmail }
