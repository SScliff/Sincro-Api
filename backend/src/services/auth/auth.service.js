const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db.service');
const AppError = require('../../utils/AppError');
const { jwt: jwtConfig } = require('../../config');

const SALT_ROUNDS = 10; //fator de aleatoriedade do bycript quanto maior mais seguro porem mais pesado o algoritimo

/**
 * Registrar um novo usuario
 */
const register = async (name, email, password) => {
    //verifica se o email já existe
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
        throw new AppError('Email já cadastrado', 409);
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
        [name, email, passwordHash]
    );
    return result.rows[0];
};

/**
 * Logar um usuario
 */
const login = async (email, password) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
        throw new AppError('Credenciais inválidas', 401);
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new AppError('Credenciais inválidas', 401);
    }
    const token = generateToken(user);
    return { token };
};

/**
 * Gerar JWT token para rotas seguras
 */
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
    };

    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn
    });
};

module.exports = { register, login };
