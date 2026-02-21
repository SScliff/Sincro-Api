const authService = require('../services/auth/auth.service');
const AppError = require('../utils/AppError');

//controler simples para controlar login / register


exports.register = async (req, res, next) => {
    const { name, email, password } = req.body;
    try {
        const user = await authService.register(name, email, password);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const result = await authService.login(email, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
