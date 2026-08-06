const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

// Todas as rotas de tickets requerem autenticação
router.use(authenticateToken);

router.get('/stats', ticketController.getStats);
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/status', ticketController.updateTicketStatus);
router.put('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
