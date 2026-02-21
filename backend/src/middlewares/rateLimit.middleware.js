const logger = require('../services/monitoring/logger.service');
const { security } = require('../config');

/**
 * Middleware de rate Limit com Sliding Window & Whitelist ip
 * 
 * Flow:
 * 1. Whitelist de IP pra teste/dev.
 * 2. Janela deslizante para impedir requisições por min (100rq/m) e sim por usuario 
 * 3. Logging consistente
 * 4. headers personalizados (RateLimit-Limit, RateLimit-Remaining).
 */


const ipHistory = new Map();

const { windowMs, limit } = security.rateLimit;
const { trustedIps } = security;

module.exports = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    // checagem de whitelist
    if (trustedIps.includes(ip)) {
        return next();
    }

    // 2. iniciando o IP
    if (!ipHistory.has(ip)) {
        ipHistory.set(ip, []);
    }

    let timestamps = ipHistory.get(ip);

    // 3. algoritimo de janela flutuante - 
    const windowStart = now - windowMs;
    timestamps = timestamps.filter(time => time > windowStart);

    // 4. checagem do rate limit
    if (timestamps.length >= limit) {
        logger.warn({
            module: 'security',
            action: 'rate_limit_block',
            ip,
            count: timestamps.length,
            limit
        }, 'Rate limit atingido (Sliding Window)');

        // RFC-compliant Headers
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));

        return res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)}s.`,
            status: 429
        });
    }

    // 5. Success: Register hit and move on
    timestamps.push(now);
    ipHistory.set(ip, timestamps);

    // Add remaining info to headers for the client
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - timestamps.length);

    next();
};
