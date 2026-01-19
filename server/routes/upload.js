const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload - Subir archivo Excel
router.post('/', uploadController.uploadMiddleware, uploadController.uploadExcel);

module.exports = router;