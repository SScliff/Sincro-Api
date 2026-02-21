const { AsyncLocalStorage } = require('node:async_hooks');

/**
 * Global Storage for Request Context
 * Allows retrieving context (like traceId) without passing the request object everywhere.
 */
const storage = new AsyncLocalStorage();

module.exports = storage;
