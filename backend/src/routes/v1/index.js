const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const ticketRoutes = require('./ticket.routes');
const metricsRoutes = require('./metrics.routes');
const authRoutes = require('./auth.routes');
const proprietaryRoutes = require('./proprietary.routes');

router.use('/health', healthRoutes);
router.use('/tickets', ticketRoutes);
router.use('/metrics', metricsRoutes);
router.use('/auth', authRoutes);
router.use('/proprietary', proprietaryRoutes);

module.exports = router;
