const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { procesarExcelVentas, procesarExcelBlumax } = require('../utils/excelParser');

// Configurar almacenamiento temporal (usar /tmp para Lambda)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `upload-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtrar solo archivos Excel
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

// Controlador para procesar el archivo
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    console.log(`📁 Archivo recibido: ${req.file.originalname}`);
    
    // Procesar el Excel
    const resultado = await procesarExcelVentas(req.file.path);
    
    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);
    console.log('🗑️  Archivo temporal eliminado');
    
    res.json({
      success: true,
      message: 'Archivo procesado correctamente',
      data: resultado
    });
    
  } catch (error) {
    // Limpiar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error procesando el archivo',
      error: error.message
    });
  }
};

exports.uploadMiddleware = upload.single('file');

// Controlador para procesar archivo Blumax
exports.uploadExcelBlumax = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    console.log(`Archivo Blumax recibido: ${req.file.originalname}`);

    // Procesar el Excel de Blumax
    const resultado = await procesarExcelBlumax(req.file.path);

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Archivo Blumax procesado correctamente',
      data: resultado
    });

  } catch (error) {
    // Limpiar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error procesando el archivo Blumax',
      error: error.message
    });
  }
};