const express = require('express');
const router = express.Router();
const blumaxController = require('../controllers/blumaxController');

// GET /api/blumax - Obtener todos los datos de Blumax
router.get('/', blumaxController.getBlumax);

// GET /api/blumax/residuos-clasificacion - Resumen de residuos por clasificación
router.get('/residuos-clasificacion', blumaxController.getResumenResiduosBlumax);

// GET /api/blumax/años - Obtener años disponibles
router.get('/años', blumaxController.getAñosDisponibles);

// DELETE /api/blumax/limpiar-año - Limpiar datos por año
router.delete('/limpiar-año', blumaxController.limpiarPorAño);

// DELETE /api/blumax/limpiar-todo - Limpiar todos los datos
router.delete('/limpiar-todo', blumaxController.limpiarTodo);

module.exports = router;
