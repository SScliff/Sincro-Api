const pino = require('pino');
const storage = require('../../utils/storage');

//* serviço de logger usando pino para padronização de log

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        app: 'node-analytics-api',
        env: process.env.NODE_ENV || 'development'
    },
    mixin() {
        const store = storage.getStore();
        return store ? { traceId: store.traceId } : {};
    },
    timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;
