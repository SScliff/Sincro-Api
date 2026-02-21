const express = require('express');
const router = express.Router();
const ticketController = require('../../controllers/ticket.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { ticketSchema } = require('../../schemas/ticket.schema');
const authMiddleware = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', validate(ticketSchema), ticketController.create);
router.get('/', ticketController.findAll);
router.get('/:id', ticketController.findOne);
router.patch('/:id', ticketController.update);
router.delete('/:id', ticketController.delete);
router.patch('/:id/archive', ticketController.archive);

module.exports = router;
