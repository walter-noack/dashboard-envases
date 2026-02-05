const express = require('express');
const router = express.Router();
const envasesController = require('../controllers/envasesController');

// POST /api/envases/upload - Subir archivo Excel de envases
router.post('/upload', envasesController.uploadMiddleware, envasesController.uploadExcelEnvases);

// GET /api/envases - Obtener todos los envases
router.get('/', envasesController.getEnvases);

// GET /api/envases/estado - Listar envases con estado de especificaciones
router.get('/estado', envasesController.getEnvasesConEstado);

// GET /api/envases/:nombre - Obtener envase por nombre
router.get('/:nombre', envasesController.getEnvaseByNombre);

// GET /api/envases/:nombre/especificaciones - Obtener especificaciones de un envase
router.get('/:nombre/especificaciones', envasesController.getEspecificaciones);

// PUT /api/envases/:nombre/especificaciones - Actualizar especificaciones
router.put('/:nombre/especificaciones', envasesController.updateEspecificaciones);

// POST /api/envases/:nombre/especificaciones/imagen - Subir imagen técnica
router.post(
  '/:nombre/especificaciones/imagen',
  envasesController.uploadImageMiddleware,
  envasesController.uploadImagenTecnica
);

// POST /api/envases/cargar-especificaciones - Cargar especificaciones predefinidas
router.post('/cargar-especificaciones', envasesController.cargarEspecificacionesPredefinidas);

module.exports = router;