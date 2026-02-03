const express = require('express');
const router = express.Router();
const multer = require('multer');
const monitoringController = require('../controllers/monitoringController');
const auth = require('../middleware/auth');

// Configurar multer para archivos en memoria (necesario para Lambda)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  }
});

// Todas las rutas requieren autenticación
router.use(auth);

// Parsear PDF sin guardar (para preview/edición)
router.post('/parse', upload.single('archivo'), monitoringController.parsePDF);

// Guardar registros editados
router.post('/guardar', monitoringController.guardarRegistros);

// Subir y procesar PDF (legacy - guarda directo)
router.post('/upload', upload.single('archivo'), monitoringController.uploadPDF);

// Obtener registros con filtros
router.get('/registros', monitoringController.getRegistros);

// Obtener resumen agrupado
router.get('/resumen', monitoringController.getResumen);

// Exportar a Excel
router.get('/exportar', monitoringController.exportarExcel);

// Obtener años disponibles
router.get('/anios', monitoringController.getAniosDisponibles);

// Eliminar un registro específico
router.delete('/registros/:id', monitoringController.eliminarRegistro);

// Limpiar datos (con filtros opcionales)
router.delete('/limpiar', monitoringController.limpiarDatos);

module.exports = router;
