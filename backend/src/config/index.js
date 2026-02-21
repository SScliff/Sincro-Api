require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT,
        env: process.env.NODE_ENV
    },
    database: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        max: process.env.MAX,
        idleTimeoutMillis: process.env.IDLETIMEOUTMILLIS,
        connectionTimeoutMillis: process.env.CONNECTIONTIMETOUTMILLIS,
    },
    security: {
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
            limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
        },
        trustedIps: (process.env.TRUSTED_IPS || '127.0.0.1,::1,::ffff:127.0.0.1,::ffff:172.18.0.1').split(',')

    },
    jwt: {
        secret: process.env.JWT_SECRET || 'umsegredomuitosecreto',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
};

module.exports = config;
