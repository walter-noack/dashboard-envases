const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { procesarExcelEnvases } = require('../utils/envaseParser');
const Envase = require('../models/Envase');

// Configurar almacenamiento temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `envases-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

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
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Subir y procesar archivo de envases
exports.uploadExcelEnvases = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    console.log(`📁 Archivo de envases recibido: ${req.file.originalname}`);
    
    const resultado = await procesarExcelEnvases(req.file.path);
    
    fs.unlinkSync(req.file.path);
    console.log('🗑️  Archivo temporal eliminado');
    
    res.json({
      success: true,
      message: 'Archivo de envases procesado correctamente',
      data: resultado
    });
    
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error procesando el archivo de envases',
      error: error.message
    });
  }
};

// Obtener todos los envases
exports.getEnvases = async (req, res) => {
  try {
    const envases = await Envase.find();
    
    res.json({
      success: true,
      count: envases.length,
      data: envases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener envases',
      error: error.message
    });
  }
};

// Obtener un envase por nombre
exports.getEnvaseByNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const envase = await Envase.findOne({ nombre });
    
    if (!envase) {
      return res.status(404).json({
        success: false,
        message: 'Envase no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: envase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener envase',
      error: error.message
    });
  }
};

exports.uploadMiddleware = upload.single('file');