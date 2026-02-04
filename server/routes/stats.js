const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

// Diagnóstico de datos (público para debugging)
router.get('/diagnostico', statsController.getDiagnostico);

// Todas las demás rutas requieren autenticación
router.use(authMiddleware);

// Dashboard resumen general
router.get('/resumen', statsController.getDashboardResumen);

// Línea Base
router.get('/linea-base/resumen', statsController.getLineaBaseResumen);
router.get('/linea-base/mensual', statsController.getLineaBaseMensual);
router.get('/linea-base/plantas', statsController.getLineaBasePorPlanta);

// Monitoring
router.get('/monitoring/resumen', statsController.getMonitoringResumen);
router.get('/monitoring/mensual', statsController.getMonitoringMensual);

module.exports = router;
