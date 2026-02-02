const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload - Subir archivo Excel de ventas
router.post('/', uploadController.uploadMiddleware, uploadController.uploadExcel);

// POST /api/upload/blumax - Subir archivo Excel de Blumax
router.post('/blumax', uploadController.uploadMiddleware, uploadController.uploadExcelBlumax);

module.exports = router;