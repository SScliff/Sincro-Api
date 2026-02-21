const express = require('express');
const router = express.Router();
const proprietaryController = require('../../controllers/proprietary.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', proprietaryController.create);
router.get('/', proprietaryController.findAll);
router.get('/:id', proprietaryController.findOne);
router.patch('/:id', proprietaryController.update);
router.delete('/:id', proprietaryController.delete);

module.exports = router;