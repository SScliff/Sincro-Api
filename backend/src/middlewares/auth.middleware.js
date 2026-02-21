const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { jwt: jwtConfig } = require('../config');

/**
 * Auth Middleware (Protetor de rota)
 * 
 * fluxo:
 * 1. extrair do header "Authorization: Bearer <token>" 
 * 2. verifica assinatura com jwt.verify()
 * 3. Injeta o payload decodificado no req.user
 * 
 * se o token tiver faltando ou invalido → 401 Unauthorized
 */

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Token não fornecido', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expirado. Faça login novamente', 401));
        }
        return next(new AppError('Token inválido', 401));
    }
};

module.exports = authMiddleware;
