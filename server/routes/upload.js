const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// POST /api/upload - Subir archivo Excel de ventas
router.post('/', uploadController.uploadMiddleware, uploadController.uploadExcel);

// POST /api/upload/blumax - Subir archivo Excel de Blumax
router.post('/blumax', uploadController.uploadMiddleware, uploadController.uploadExcelBlumax);

// POST /api/upload/mensual - Subir archivo Excel de ventas mensual
router.post('/mensual', uploadController.uploadMiddleware, uploadController.uploadExcelMensual);

// POST /api/upload/blumax-mensual - Subir archivo Excel de Blumax mensual
router.post('/blumax-mensual', uploadController.uploadMiddleware, uploadController.uploadExcelBlumaxMensual);

module.exports = router;