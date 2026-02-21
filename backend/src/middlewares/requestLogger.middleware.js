const logger = require('../services/monitoring/logger.service');
const { metrics } = require('../services/monitoring/metrics.service');
const rotasIgnoradas = ['/metrics', '/health'];
/**
 * Request Logger and Metrics Middleware
 * 
 * Centralizes:
 * 1. Success Logging (INFO)
 * 2. HTTP Metrics collection (Prometheus)
 * 3. Rate Limit Warning detection
 */

const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        // Normalize route for metrics compatibility: remove /api/v1 prefix and trailing slash
        let route = req.route ? (req.baseUrl + req.route.path) : req.path;
        route = route.replace('/api/v1', '').replace(/\/$/, '') || '/';
        const status = res.statusCode;

        if (rotasIgnoradas.includes(route)) return;

        // 1. Success Logging (INFO)
        if (status < 400) {
            logger.info({
                module: 'http',
                action: 'request_success',
                method: req.method,
                route,
                status,
                duration: `${duration}ms`
            }, `Requisição processada com sucesso: ${req.method} ${route}`);
        }

        // 2. Metrics Collection
        metrics.httpRequestTotal.inc({
            method: req.method,
            route: route,
            status: status.toString()
        });

        // 3. Rate Limit Logging (Special Case)
        if (status === 429) {
            logger.warn({
                module: 'http',
                action: 'rate_limit_hit',
                method: req.method,
                route,
                ip: req.ip
            }, 'Limite de requisições excedido pelo cliente');
        }
    });

    next();
};

module.exports = requestLogger;
