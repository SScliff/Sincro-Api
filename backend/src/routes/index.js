const express = require('express');
const router = express.Router();
const v1Router = require('./v1');

//versionamento de rotas de api usando api/*v1*/rota
router.use('/v1', v1Router);

module.exports = router;
