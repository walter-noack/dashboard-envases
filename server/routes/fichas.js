const express = require('express');
const router = express.Router();
const fichaController = require('../controllers/fichaController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar multer para subir imágenes
const uploadDir = path.join(__dirname, '../../client/public/uploads/fichas');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `producto-${req.params.sku}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// GET /api/fichas/skus - Obtener todos los SKUs disponibles con estado de ficha
router.get('/skus', fichaController.getSKUsDisponibles);

// GET /api/fichas - Listar fichas creadas (con paginación)
router.get('/', fichaController.getFichas);

// GET /api/fichas/:sku - Obtener ficha completa por SKU
router.get('/:sku', fichaController.getFichaBySKU);

// POST /api/fichas - Crear o actualizar ficha
router.post('/', fichaController.upsertFicha);

// DELETE /api/fichas/:sku - Eliminar ficha
router.delete('/:sku', fichaController.deleteFicha);

// GET /api/fichas/:sku/pdf - Descargar PDF de ficha
router.get('/:sku/pdf', fichaController.generarPDF);

// POST /api/fichas/pdf-lote - Descargar ZIP con múltiples PDFs
router.post('/pdf-lote', fichaController.generarPDFLote);

// POST /api/fichas/:sku/imagen - Subir imagen de producto
router.post('/:sku/imagen', upload.single('imagen'), fichaController.uploadImagen);

module.exports = router;
