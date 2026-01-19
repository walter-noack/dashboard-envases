const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');

// GET /api/ventas - Obtener todas las ventas (con filtros opcionales)
router.get('/', ventasController.getVentas);

// GET /api/ventas/resumen-mensual - Resumen agrupado por mes y SKU
router.get('/resumen-mensual', ventasController.getResumenMensual);

// GET /api/ventas/top-productos - Top productos por volumen
router.get('/top-productos', ventasController.getTopProductos);

//GET /api/ventas/con-residuos - Ventas con cálculo de residuos (agregar esta línea)
router.get('/con-residuos', ventasController.getVentasConResiduos);

router.get('/residuos-clasificacion', ventasController.getResumenResiduosPorClasificacion);

module.exports = router;