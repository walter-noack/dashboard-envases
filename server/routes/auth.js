const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// GET /api/auth/verificar - Verificar token válido
router.get('/verificar', authMiddleware, authController.verificarToken);

module.exports = router;
