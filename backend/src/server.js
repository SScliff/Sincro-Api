require('dotenv').config();
const app = require('./app');
const logger = require('./services/monitoring/logger.service');
const listEndpoints = require('express-list-endpoints');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info({ module: 'server', action: 'startup', port: PORT }, `Api rodando na porta: ${PORT}`);
    console.log(listEndpoints(app))
});