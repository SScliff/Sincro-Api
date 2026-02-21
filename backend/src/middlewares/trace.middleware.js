const crypto = require('node:crypto');
const storage = require('../utils/storage');

/**
 * Trace ID Middleware
 * 
 * 1. Captura ou gera um novo traceID para cada requisição do sistema.
 * 2. coloca o traceID no header.
 * 3. Guarda o traceID para propragação.
 */

const traceMiddleware = (req, res, next) => {
    const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
    res.setHeader('x-trace-id', traceId);
    storage.run({ traceId }, () => {
        next();
    });
};

module.exports = traceMiddleware;
