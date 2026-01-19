const express = require('express');
const router = express.Router();
const envasesController = require('../controllers/envasesController');

// POST /api/envases/upload - Subir archivo Excel de envases
router.post('/upload', envasesController.uploadMiddleware, envasesController.uploadExcelEnvases);

// GET /api/envases - Obtener todos los envases
router.get('/', envasesController.getEnvases);

// GET /api/envases/:nombre - Obtener envase por nombre
router.get('/:nombre', envasesController.getEnvaseByNombre);

module.exports = router;