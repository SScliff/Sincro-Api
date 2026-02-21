/**
 * Custom Application Error Class
 * 
 * Used to differentiate "Operational Errors" (e.g., validation, not found) 
 * from "Programming Errors" (e.g., bugs, db connection loss).
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        // Operational errors are predicted failures (4xx)
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
