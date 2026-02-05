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

// Configurar almacenamiento para imágenes técnicas
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../client/public/uploads/especificaciones');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const envaseNombre = req.params.nombre.replace(/[^a-zA-Z0-9]/g, '_');
    const uniqueName = `${envaseNombre}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, png, gif, webp)'));
  }
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadImageMiddleware = uploadImage.single('imagen');

// Obtener especificaciones de un envase
exports.getEspecificaciones = async (req, res) => {
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
      data: {
        nombre: envase.nombre,
        especificaciones: envase.especificaciones || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener especificaciones',
      error: error.message
    });
  }
};

// Actualizar especificaciones de un envase
exports.updateEspecificaciones = async (req, res) => {
  try {
    const { nombre } = req.params;
    const especificaciones = req.body;

    const envase = await Envase.findOneAndUpdate(
      { nombre },
      { especificaciones },
      { new: true }
    );

    if (!envase) {
      return res.status(404).json({
        success: false,
        message: 'Envase no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Especificaciones actualizadas correctamente',
      data: envase.especificaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar especificaciones',
      error: error.message
    });
  }
};

// Subir imagen técnica de un envase
exports.uploadImagenTecnica = async (req, res) => {
  try {
    const { nombre } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó imagen'
      });
    }

    const imagenPath = `/uploads/especificaciones/${req.file.filename}`;

    const envase = await Envase.findOneAndUpdate(
      { nombre },
      { 'especificaciones.imagenTecnica': imagenPath },
      { new: true }
    );

    if (!envase) {
      // Si no existe el envase, eliminar la imagen subida
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Envase no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Imagen técnica subida correctamente',
      data: { imagenTecnica: imagenPath }
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen técnica',
      error: error.message
    });
  }
};

// Listar todos los tipos de envases con estado de especificaciones
exports.getEnvasesConEstado = async (req, res) => {
  try {
    const envases = await Envase.find({}, 'nombre especificaciones');

    const resultado = envases.map(e => ({
      nombre: e.nombre,
      tieneEspecificaciones: !!(e.especificaciones && (
        e.especificaciones.materialPrincipal ||
        e.especificaciones.dimensiones?.altura?.valor ||
        e.especificaciones.imagenTecnica
      )),
      tieneImagen: !!e.especificaciones?.imagenTecnica
    }));

    res.json({
      success: true,
      total: resultado.length,
      conEspecificaciones: resultado.filter(r => r.tieneEspecificaciones).length,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de envases',
      error: error.message
    });
  }
};

// Datos de especificaciones predefinidas (extraídos de PDFs)
const especificacionesPredefinidas = {
  'Lub 1 L': {
    materialPrincipal: 'Polietileno Alta Densidad (PEAD)',
    proveedor: 'EPT',
    codigoProveedor: '109910003',
    descripcion: 'Envase plástico utilizado como envase primario para industria, seguro y libre de contaminaciones.',
    dimensiones: {
      altura: { valor: 227, tolerancia: 2 },
      ancho: { valor: 61.8, tolerancia: 1 },
      largo: { valor: 110.4, tolerancia: 1 },
      diametro: { valor: 34.4, tolerancia: 0.3 }
    },
    pesoEnvase: {
      total: { valor: 60, tolerancia: 3 },
      componentes: [{ nombre: 'Botella', peso: { valor: 60, tolerancia: 3 } }]
    },
    capacidadEnvase: { nominal: 1, rebalse: 1.1 },
    vidaUtil: '2 años en condiciones adecuadas de almacenaje',
    condicionesAlmacenaje: 'Lugar fresco, cerrado y ventilado. No exponer a temperaturas superiores a 50°C. Libre de plagas, suciedad y olores.',
    usoPrevisto: 'Envases primarios para contener lubricantes.',
    composicionDetallada: 'Polietileno Alta Densidad Soplado'
  },
  'Lub Balde': {
    materialPrincipal: 'PEAD (Polietileno de Alta Densidad)',
    proveedor: 'Rheem Chilena SpA',
    codigoProveedor: 'V214-00-00',
    descripcion: 'Balde plástico 05G con tapa STD, empaquetadura, flex y asa metálica.',
    dimensiones: {
      altura: { valor: 371.5, tolerancia: 3 },
      diametro: { valor: 305, tolerancia: 2 }
    },
    pesoEnvase: {
      total: { valor: 1282, tolerancia: 40 },
      componentes: [
        { nombre: 'Cuerpo + Asa', peso: { valor: 950, tolerancia: 25 } },
        { nombre: 'Tapa + Empaquetadura + Flex', peso: { valor: 332, tolerancia: 15 } }
      ]
    },
    capacidadEnvase: { nominal: 18.93, rebalse: 21.208 },
    vidaUtil: 'No especificada',
    condicionesAlmacenaje: 'Proteger de la intemperie y almacenar en lugar seco.',
    usoPrevisto: 'Contenedor para lubricantes y grasas en formato de 19 litros.',
    composicionDetallada: 'PEAD para cuerpo y tapa, acero para asa metálica, elastómero para empaquetadura'
  },
  'LUB Bins': {
    materialPrincipal: 'HDPE / Acero galvanizado',
    proveedor: 'Varios',
    codigoProveedor: 'IBC-1000',
    descripcion: 'Contenedor intermedio a granel (IBC) de 1000 litros con estructura metálica.',
    dimensiones: {
      altura: { valor: 1160, tolerancia: 10 },
      ancho: { valor: 1000, tolerancia: 5 },
      largo: { valor: 1200, tolerancia: 5 }
    },
    pesoEnvase: {
      total: { valor: 58000, tolerancia: 2000 },
      componentes: [
        { nombre: 'Contenedor HDPE', peso: { valor: 20000, tolerancia: 1000 } },
        { nombre: 'Estructura metálica', peso: { valor: 35000, tolerancia: 1500 } },
        { nombre: 'Válvula y accesorios', peso: { valor: 3000, tolerancia: 500 } }
      ]
    },
    capacidadEnvase: { nominal: 1000, rebalse: 1040 },
    vidaUtil: '5 años para uso industrial',
    condicionesAlmacenaje: 'Almacenar en superficie plana y nivelada. Temperatura máxima: 40°C.',
    usoPrevisto: 'Transporte y almacenamiento a granel de lubricantes.',
    composicionDetallada: 'Contenedor HDPE, jaula de acero galvanizado, pallet de madera o plástico'
  },
  'Agua 1 L': {
    materialPrincipal: 'Polietileno Alta Densidad (PEAD)',
    proveedor: 'EPT',
    codigoProveedor: '109910004',
    descripcion: 'Envase plástico para agua destilada/desionizada.',
    dimensiones: {
      altura: { valor: 227, tolerancia: 2 },
      ancho: { valor: 61.8, tolerancia: 1 },
      largo: { valor: 110.4, tolerancia: 1 }
    },
    pesoEnvase: {
      total: { valor: 55, tolerancia: 3 },
      componentes: [{ nombre: 'Botella', peso: { valor: 55, tolerancia: 3 } }]
    },
    capacidadEnvase: { nominal: 1, rebalse: 1.1 },
    vidaUtil: '2 años en condiciones adecuadas de almacenaje',
    condicionesAlmacenaje: 'Lugar fresco, cerrado y ventilado. No exponer a temperaturas superiores a 50°C.',
    usoPrevisto: 'Envases primarios para agua destilada y desionizada.',
    composicionDetallada: 'Polietileno Alta Densidad Soplado'
  }
};

// Cargar especificaciones predefinidas
exports.cargarEspecificacionesPredefinidas = async (req, res) => {
  try {
    const resultados = [];

    for (const [nombreEnvase, especificaciones] of Object.entries(especificacionesPredefinidas)) {
      const envase = await Envase.findOne({ nombre: nombreEnvase });

      if (!envase) {
        resultados.push({ nombre: nombreEnvase, status: 'no encontrado' });
        continue;
      }

      envase.especificaciones = {
        ...especificaciones,
        fechaEspecificacion: new Date(),
        version: '1.0'
      };

      await envase.save();
      resultados.push({ nombre: nombreEnvase, status: 'actualizado' });
    }

    const actualizados = resultados.filter(r => r.status === 'actualizado').length;

    res.json({
      success: true,
      message: `${actualizados} de ${resultados.length} envases actualizados`,
      data: resultados
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cargar especificaciones',
      error: error.message
    });
  }
};