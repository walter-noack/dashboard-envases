const express = require('express');
const router = express.Router();
const blumaxController = require('../controllers/blumaxController');

// GET /api/blumax - Obtener todos los datos de Blumax
router.get('/', blumaxController.getBlumax);

// GET /api/blumax/residuos-clasificacion - Resumen de residuos por clasificación
router.get('/residuos-clasificacion', blumaxController.getResumenResiduosBlumax);

// GET /api/blumax/años - Obtener años disponibles
router.get('/años', blumaxController.getAñosDisponibles);

// GET /api/blumax/estado-meses - Obtener estado de meses cargados
router.get('/estado-meses', blumaxController.getEstadoMeses);

// DELETE /api/blumax/limpiar-año - Limpiar datos por año
router.delete('/limpiar-año', blumaxController.limpiarPorAño);

// DELETE /api/blumax/limpiar-todo - Limpiar todos los datos
router.delete('/limpiar-todo', blumaxController.limpiarTodo);

// DELETE /api/blumax/limpiar-periodo - Limpiar datos por período (año y opcionalmente mes)
router.delete('/limpiar-periodo', blumaxController.limpiarPorPeriodo);

// GET /api/blumax/exportar-rep - Exportar datos en formato REP
router.get('/exportar-rep', blumaxController.exportarBlumaxREP);

module.exports = router;
