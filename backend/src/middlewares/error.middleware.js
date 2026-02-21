const logger = require('../services/monitoring/logger.service');
const config = require('../config');

//  middleware de erro global para centralizar e padronizar erros 

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    const isDevelopment = config.app.env === 'development';
    const logPayload = {
        module: 'app',
        action: 'error_handler',
        message: err.message,
        url: req.url,
        method: req.method,
        statusCode: err.statusCode
    };

    //usando o logger de forma correta
    // erros 500 - erro critico 
    // erro 400  - avisos 

    if (err.statusCode >= 500) {
        logPayload.stack = err.stack;
        logger.error(logPayload, 'Erro Critico!');
    } else {
        logger.warn(logPayload, 'AVISO: Requisição inválida ou erro operacional');
    }

    // resposta ao cliente
    res.status(err.statusCode).json({
        error: err.statusCode >= 500 ? 'Erro interno no servidor' : 'Erro na requisição',
        message: err.message,
        ...(isDevelopment && { stack: err.stack, details: err.details || [] }) //se no app tiver como "development" ele não esconde os stacktraces 
    });
};

module.exports = errorHandler;
