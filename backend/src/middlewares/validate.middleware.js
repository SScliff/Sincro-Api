const { z } = require('zod');
const logger = require('../services/monitoring/logger.service');

//* 
// middleware de validação dos campos usando Zod 
//* 


const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        const isZodError = error instanceof z.ZodError || error.name === 'ZodError';

        if (isZodError) {
            const issues = error.issues || error.errors || [];

            logger.warn({
                module: 'validate',
                action: 'validation_failed',
                issues: issues
            }, 'Erro de validação nos dados recebidos');

            return res.status(400).json({
                error: 'Erro de validação',
                details: issues.map(err => ({
                    path: Array.isArray(err.path) ? err.path.join('.') : '',
                    message: err.message
                }))
            });
        }

        logger.error({
            module: 'validate',
            action: 'unexpected_error',
            error: error.message,
            name: error.name
        }, 'Erro inesperado durante a validação');

        next(error);
    }
};

module.exports = { validate };