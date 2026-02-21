const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const traceMiddleware = require('./middlewares/trace.middleware');
const rateLimit = require('./middlewares/rateLimit.middleware');
const errorHandler = require('./middlewares/error.middleware');
const requestLogger = require('./middlewares/requestLogger.middleware');
const app = express();

// --- Configuration ---
app.set('trust proxy', true); // Essential for Docker/K8s IP detection

// --- Global Middlewares ---
app.use(traceMiddleware); 
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimit);

// --- Routes ---
app.use('/api', routes);

// --- Error Handling ---
app.use(errorHandler);

module.exports = app;
