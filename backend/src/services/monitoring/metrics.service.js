const client = require('prom-client');

//* serviço de coleta de metricas padrões e costumizaveis usando prom-client

const register = new client.Registry();

register.setDefaultLabels({
    app: 'node-analytics-api'
});

client.collectDefaultMetrics({ register });// metricas padrões

//metricas customizaveis

const httpRequestTotal = new client.Counter({
    name: 'http_request_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});

const dbConnectionsActive = new client.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections in the pool',
});

const dbQueryDuration = new client.Summary({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type'],
});

const ticketsCreated = new client.Counter({
    name: 'tickets_created_total',
    help: 'Number of tickets created',
    labelNames: ['status'],
});

const ticketsDeleted = new client.Counter({
    name: 'tickets_deleted_total',
    help: 'Number of tickets deleted',
    labelNames: ['status'],
});

const ticketsUpdated = new client.Counter({
    name: 'tickets_updated_total',
    help: 'Number of tickets updated',
    labelNames: ['status'],
});

const proprietaryCreated = new client.Counter({
    name: 'proprietary_created_total',
    help: 'Number of proprietary created',
    labelNames: ['status'],
});

const proprietaryDeleted = new client.Counter({
    name: 'proprietary_deleted_total',
    help: 'Number of proprietary deleted',
    labelNames: ['status'],
});

const proprietaryUpdated = new client.Counter({
    name: 'proprietary_updated_total',
    help: 'Number of proprietary updated',
    labelNames: ['status'],
});

register.registerMetric(httpRequestTotal);
register.registerMetric(dbConnectionsActive);
register.registerMetric(dbQueryDuration);
register.registerMetric(ticketsCreated);
register.registerMetric(ticketsDeleted);
register.registerMetric(ticketsUpdated);
register.registerMetric(proprietaryCreated);
register.registerMetric(proprietaryDeleted);
register.registerMetric(proprietaryUpdated);

module.exports = {
    register,
    metrics: {
        httpRequestTotal,
        dbConnectionsActive,
        dbQueryDuration,
        ticketsCreated,
        ticketsDeleted,
        ticketsUpdated,
        proprietaryCreated,
        proprietaryDeleted,
        proprietaryUpdated
    }
};
