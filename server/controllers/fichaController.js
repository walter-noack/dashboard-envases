const FichaProducto = require('../models/FichaProducto');
const Venta = require('../models/Venta');
const Envase = require('../models/Envase');
const mapeoSKU = require('../config/mapeoSKU.json');
const path = require('path');
const fs = require('fs');
const { generarFichaPDF } = require('../utils/pdfGenerator');
const archiver = require('archiver');
const s3Service = require('../services/s3Service');

// Obtener todos los SKUs únicos de ventas con estado de ficha
exports.getSKUsDisponibles = async (req, res) => {
  try {
    // Obtener SKUs únicos de ventas
    const skusVentas = await Venta.aggregate([
      {
        $group: {
          _id: '$material',
          nombre: { $first: '$materialNombre' },
          envase: { $first: '$envase' },
          totalUnidades: { $sum: '$unidades' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Obtener fichas existentes
    const fichasExistentes = await FichaProducto.find({}, 'sku nombreComercial imagen activo');
    const fichasMap = {};
    fichasExistentes.forEach(f => {
      fichasMap[f.sku] = f;
    });

    // Combinar información
    const resultado = skusVentas.map(sku => {
      const fichaExistente = fichasMap[sku._id];
      const mapeoInfo = mapeoSKU.mapeoSKU[sku._id] || null;

      return {
        sku: sku._id,
        nombreProducto: sku.nombre,
        envase: sku.envase,
        categoria: mapeoInfo?.categoria || sku.envase,
        capacidad: mapeoInfo?.capacidad || null,
        totalUnidades: sku.totalUnidades,
        tieneFicha: !!fichaExistente,
        ficha: fichaExistente ? {
          nombreComercial: fichaExistente.nombreComercial,
          imagen: fichaExistente.imagen,
          activo: fichaExistente.activo
        } : null
      };
    });

    res.json({
      success: true,
      total: resultado.length,
      conFicha: resultado.filter(r => r.tieneFicha).length,
      sinFicha: resultado.filter(r => !r.tieneFicha).length,
      data: resultado
    });
  } catch (error) {
    console.error('Error obteniendo SKUs:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo SKUs disponibles',
      error: error.message
    });
  }
};

// Obtener ficha completa por SKU (con composición de residuos)
exports.getFichaBySKU = async (req, res) => {
  try {
    const { sku } = req.params;

    // Buscar info del SKU en ventas
    const ventaInfo = await Venta.findOne({ material: sku });
    if (!ventaInfo) {
      return res.status(404).json({
        success: false,
        message: 'SKU no encontrado en ventas'
      });
    }

    // Buscar ficha existente
    let ficha = await FichaProducto.findOne({ sku });

    // Si no existe ficha, crear datos base
    const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;
    const categoria = mapeoInfo?.categoria || ventaInfo.envase;

    // Buscar composición de residuos del envase
    const envase = await Envase.findOne({ nombre: categoria });
    const componentes = envase?.componentes || [];

    // Calcular totales de composición
    let pesoTotal = 0;
    let esPeligroso = false;
    let esDomiciliario = null;

    componentes.forEach(comp => {
      pesoTotal += comp.pesoGramos || 0;
      if (comp.peligrosidad === 'PELIGROSO') esPeligroso = true;
      if (comp.domiciliario) esDomiciliario = comp.domiciliario;
    });

    const resultado = {
      sku,
      nombreProducto: ventaInfo.materialNombre,
      nombreComercial: ficha?.nombreComercial || ventaInfo.materialNombre,
      descripcion: ficha?.descripcion || '',
      imagen: ficha?.imagen || null,
      imagenProducto: ficha?.imagenProducto || null,
      imagenEnvase: ficha?.imagenEnvase || null,
      categoria,
      capacidad: mapeoInfo?.capacidad || null,
      tipoEnvase: categoria,
      componentes: componentes.map(c => ({
        nombre: c.nombre,
        material: c.material,
        pesoGramos: c.pesoGramos,
        categoria: c.categoria,
        codigoClasificacion: c.codigoClasificacion,
        caracteristica: c.caracteristica,
        peligrosidad: c.peligrosidad,
        domiciliario: c.domiciliario
      })),
      resumen: {
        pesoTotalGramos: pesoTotal,
        pesoTotalKg: pesoTotal / 1000,
        esPeligroso,
        domiciliario: esDomiciliario
      },
      // Especificaciones técnicas del envase
      especificacionesEnvase: envase?.especificaciones || null,
      tieneFicha: !!ficha,
      activo: ficha?.activo ?? true,
      updatedAt: ficha?.updatedAt || null,
      createdAt: ficha?.createdAt || null
    };

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error obteniendo ficha:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo ficha',
      error: error.message
    });
  }
};

// Crear o actualizar ficha
exports.upsertFicha = async (req, res) => {
  try {
    const { sku, nombreComercial, descripcion, categoria, capacidad, tipoEnvase } = req.body;

    if (!sku || !nombreComercial) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren sku y nombreComercial'
      });
    }

    // Verificar que el SKU existe en ventas
    const ventaInfo = await Venta.findOne({ material: sku });
    if (!ventaInfo) {
      return res.status(404).json({
        success: false,
        message: 'SKU no encontrado en ventas'
      });
    }

    const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;

    const fichaData = {
      sku,
      nombreComercial,
      descripcion: descripcion || '',
      categoria: categoria || mapeoInfo?.categoria || ventaInfo.envase,
      capacidad: capacidad || mapeoInfo?.capacidad,
      tipoEnvase: tipoEnvase || mapeoInfo?.categoria || ventaInfo.envase,
      activo: true
    };

    const ficha = await FichaProducto.findOneAndUpdate(
      { sku },
      fichaData,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: ficha.isNew ? 'Ficha creada exitosamente' : 'Ficha actualizada exitosamente',
      data: ficha
    });
  } catch (error) {
    console.error('Error guardando ficha:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando ficha',
      error: error.message
    });
  }
};

// Subir imagen de producto a S3 (legacy - mantener por compatibilidad)
exports.uploadImagen = async (req, res) => {
  try {
    const { sku } = req.params;
    const { tipo } = req.query; // 'producto' o 'envase'

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó imagen'
      });
    }

    // Verificar que S3 está configurado
    if (!s3Service.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'El servicio de almacenamiento S3 no está configurado'
      });
    }

    // Determinar qué campo actualizar
    const campoImagen = tipo === 'envase' ? 'imagenEnvase' : 'imagenProducto';
    const carpetaS3 = tipo === 'envase' ? 'envases' : 'productos';

    // Obtener la ficha existente
    const fichaExistente = await FichaProducto.findOne({ sku });
    const imagenAnterior = fichaExistente?.[campoImagen];

    // Subir imagen a S3
    const imagenUrl = await s3Service.uploadImage(
      req.file.buffer,
      `${sku}/${carpetaS3}`,
      req.file.mimetype
    );

    // Preparar datos de actualización
    const updateData = { [campoImagen]: imagenUrl };

    // Si es imagen de producto, también actualizar el campo legacy 'imagen'
    if (tipo !== 'envase') {
      updateData.imagen = imagenUrl;
    }

    // Actualizar ficha con la nueva URL
    const ficha = await FichaProducto.findOneAndUpdate(
      { sku },
      updateData,
      { new: true }
    );

    if (!ficha) {
      // Si no existe la ficha, crearla con datos mínimos
      const ventaInfo = await Venta.findOne({ material: sku });
      const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;

      const nuevaFicha = new FichaProducto({
        sku,
        nombreComercial: ventaInfo?.materialNombre || sku,
        categoria: mapeoInfo?.categoria || ventaInfo?.envase || 'Sin categoría',
        capacidad: mapeoInfo?.capacidad,
        [campoImagen]: imagenUrl,
        imagen: tipo !== 'envase' ? imagenUrl : null
      });
      await nuevaFicha.save();

      return res.json({
        success: true,
        message: `Imagen de ${tipo || 'producto'} subida a S3 y ficha creada`,
        data: { [campoImagen]: imagenUrl }
      });
    }

    // Eliminar imagen anterior de S3 si existía
    if (imagenAnterior) {
      await s3Service.deleteImage(imagenAnterior);
    }

    res.json({
      success: true,
      message: `Imagen de ${tipo || 'producto'} subida a S3 exitosamente`,
      data: { [campoImagen]: imagenUrl }
    });
  } catch (error) {
    console.error('Error subiendo imagen a S3:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen',
      error: error.message
    });
  }
};

// Eliminar ficha
exports.deleteFicha = async (req, res) => {
  try {
    const { sku } = req.params;

    const ficha = await FichaProducto.findOneAndDelete({ sku });

    if (!ficha) {
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    // Si tenía imagen, eliminarla de S3
    if (ficha.imagen) {
      // Si es URL de S3, eliminar de S3
      if (ficha.imagen.includes('s3.') && ficha.imagen.includes('amazonaws.com')) {
        await s3Service.deleteImage(ficha.imagen);
      } else {
        // Compatibilidad: si es path local antiguo, intentar eliminar del filesystem
        const imagePath = path.join(__dirname, '../../client/public', ficha.imagen);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    res.json({
      success: true,
      message: 'Ficha eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando ficha:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando ficha',
      error: error.message
    });
  }
};

// Listar todas las fichas creadas
exports.getFichas = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { nombreComercial: { $regex: search, $options: 'i' } }
      ];
    }

    const fichas = await FichaProducto.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await FichaProducto.countDocuments(query);

    res.json({
      success: true,
      data: fichas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error listando fichas:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando fichas',
      error: error.message
    });
  }
};

// Generar PDF de una ficha
exports.generarPDF = async (req, res) => {
  try {
    const { sku } = req.params;

    // Obtener datos completos de la ficha
    const ventaInfo = await Venta.findOne({ material: sku });
    if (!ventaInfo) {
      return res.status(404).json({
        success: false,
        message: 'SKU no encontrado'
      });
    }

    const ficha = await FichaProducto.findOne({ sku });
    const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;
    const categoria = mapeoInfo?.categoria || ventaInfo.envase;

    // Buscar composición de residuos
    const envase = await Envase.findOne({ nombre: categoria });
    const componentes = envase?.componentes || [];

    // Calcular resumen
    let pesoTotal = 0;
    let esPeligroso = false;
    let domiciliario = 'NO DOMICILIARIO';

    componentes.forEach(comp => {
      pesoTotal += comp.pesoGramos || 0;
      if (comp.peligrosidad === 'PELIGROSO') esPeligroso = true;
      if (comp.domiciliario) domiciliario = comp.domiciliario;
    });

    // Preparar datos para PDF
    const fichaData = {
      sku,
      nombreComercial: ficha?.nombreComercial || ventaInfo.materialNombre,
      categoria,
      capacidad: mapeoInfo?.capacidad || ficha?.capacidad || null,
      tipoEnvase: categoria,
      componentes,
      resumen: {
        pesoTotalGramos: pesoTotal,
        esPeligroso,
        domiciliario
      },
      // Imágenes de S3
      imagenProducto: ficha?.imagenProducto || null,
      imagenEnvase: ficha?.imagenEnvase || null,
      // Fallback a imagen local legacy
      imagenPath: ficha?.imagen && !ficha.imagen.includes('s3.') ? path.join(__dirname, '../../client/public', ficha.imagen) : null,
      // Agregar especificaciones técnicas del envase si existen
      especificacionesEnvase: envase?.especificaciones || null
    };

    // Generar PDF
    const pdfBuffer = await generarFichaPDF(fichaData);

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ficha_${sku}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando PDF',
      error: error.message
    });
  }
};

// Generar ZIP con múltiples PDFs
exports.generarPDFLote = async (req, res) => {
  try {
    const { skus } = req.body;

    if (!skus || !Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de SKUs'
      });
    }

    // Configurar respuesta como ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=fichas_tecnicas.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Generar PDF para cada SKU
    for (const sku of skus) {
      try {
        const ventaInfo = await Venta.findOne({ material: sku });
        if (!ventaInfo) continue;

        const ficha = await FichaProducto.findOne({ sku });
        const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;
        const categoria = mapeoInfo?.categoria || ventaInfo.envase;

        const envase = await Envase.findOne({ nombre: categoria });
        const componentes = envase?.componentes || [];

        let pesoTotal = 0;
        let esPeligroso = false;
        let domiciliario = 'NO DOMICILIARIO';

        componentes.forEach(comp => {
          pesoTotal += comp.pesoGramos || 0;
          if (comp.peligrosidad === 'PELIGROSO') esPeligroso = true;
          if (comp.domiciliario) domiciliario = comp.domiciliario;
        });

        const fichaData = {
          sku,
          nombreComercial: ficha?.nombreComercial || ventaInfo.materialNombre,
          categoria,
          capacidad: mapeoInfo?.capacidad || null,
          tipoEnvase: categoria,
          componentes,
          resumen: {
            pesoTotalGramos: pesoTotal,
            esPeligroso,
            domiciliario
          },
          imagenPath: ficha?.imagen ? path.join(__dirname, '../../client/public', ficha.imagen) : null,
          especificacionesEnvase: envase?.especificaciones || null
        };

        const pdfBuffer = await generarFichaPDF(fichaData);
        archive.append(pdfBuffer, { name: `ficha_${sku}.pdf` });

      } catch (error) {
        console.error(`Error generando PDF para SKU ${sku}:`, error);
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error('Error generando lote de PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando lote de PDFs',
      error: error.message
    });
  }
};
