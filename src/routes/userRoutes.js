const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rotas de gestão de usuários exigem ser Admin
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.patch('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
