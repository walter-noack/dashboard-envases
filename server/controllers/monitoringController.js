const Monitoring = require('../models/Monitoring');
const { parseFacturaPDF, convertToMonitoringRecords } = require('../utils/pdfParser');
const XLSX = require('xlsx');

// Configuración por defecto para COPEC
const DEFAULT_RUT_EMPRESA = '99520000-7';
const DEFAULT_ID_ESTABLECIMIENTO = null;

/**
 * Solo parsear PDF sin guardar (para preview/edición)
 */
exports.parsePDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado un archivo PDF'
      });
    }

    const origen = req.body.origen || 'LUB';

    // Parsear el PDF
    const parsedData = await parseFacturaPDF(req.file.buffer);

    // Verificar si ya existe un documento con el mismo número
    let documentoExistente = false;
    if (parsedData.numeroDocumento && parsedData.rutGestor) {
      const existente = await Monitoring.findOne({
        numeroDTE: parsedData.numeroDocumento,
        rutGestor: parsedData.rutGestor
      });
      documentoExistente = !!existente;
    }

    res.json({
      success: true,
      documentoExistente,
      datosExtraidos: {
        rutGestor: parsedData.rutGestor,
        nombreGestor: parsedData.nombreGestor,
        numeroDocumento: parsedData.numeroDocumento,
        fechaEmision: parsedData.fechaEmision,
        rutCliente: parsedData.rutCliente,
        items: parsedData.items,
        guiasReferencia: parsedData.guiasReferencia,
        tipoDocumento: parsedData.tipoDocumento
      },
      origen,
      archivoOriginal: req.file.originalname
    });

  } catch (error) {
    console.error('Error parseando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al parsear el archivo PDF',
      error: error.message
    });
  }
};

/**
 * Guardar registros editados manualmente
 */
exports.guardarRegistros = async (req, res) => {
  try {
    const { registros } = req.body;

    if (!registros || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron registros para guardar'
      });
    }

    // Validar campos requeridos
    for (const reg of registros) {
      if (!reg.rutGestor || !reg.numeroDTE || !reg.fechaDTE || !reg.subCategoria || !reg.materialidad) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos en los registros'
        });
      }
    }

    // Verificar duplicados
    const primerRegistro = registros[0];
    const existente = await Monitoring.findOne({
      numeroDTE: primerRegistro.numeroDTE,
      rutGestor: primerRegistro.rutGestor
    });

    if (existente) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con el documento N° ${primerRegistro.numeroDTE}`
      });
    }

    // Guardar registros
    const savedRecords = await Monitoring.insertMany(registros);

    res.json({
      success: true,
      message: `Se guardaron ${savedRecords.length} registros`,
      registros: savedRecords
    });

  } catch (error) {
    console.error('Error guardando registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar los registros',
      error: error.message
    });
  }
};

/**
 * Subir y procesar PDF de factura (método legacy, guarda directo)
 */
exports.uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado un archivo PDF'
      });
    }

    const origen = req.body.origen || 'LUB';
    const rutEmpresa = req.body.rutEmpresa || DEFAULT_RUT_EMPRESA;
    const idEstablecimiento = req.body.idEstablecimiento || DEFAULT_ID_ESTABLECIMIENTO;

    // Parsear el PDF
    const parsedData = await parseFacturaPDF(req.file.buffer);

    if (!parsedData.fechaEmision) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo extraer la fecha del documento',
        datosExtraidos: parsedData
      });
    }

    if (parsedData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se encontraron items/materiales en el documento',
        datosExtraidos: parsedData
      });
    }

    // Convertir a registros de monitoring
    const records = convertToMonitoringRecords(parsedData, rutEmpresa, idEstablecimiento, origen);

    // Agregar nombre del archivo original
    records.forEach(r => {
      r.archivoOriginal = req.file.originalname;
    });

    // Verificar si ya existe un documento con el mismo número
    const existente = await Monitoring.findOne({
      numeroDTE: parsedData.numeroDocumento,
      rutGestor: parsedData.rutGestor
    });

    if (existente) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro con el documento N° ${parsedData.numeroDocumento} del gestor ${parsedData.nombreGestor || parsedData.rutGestor}`,
        datosExtraidos: parsedData
      });
    }

    // Guardar en la base de datos
    const savedRecords = await Monitoring.insertMany(records);

    res.json({
      success: true,
      message: `Se procesaron ${savedRecords.length} registros del documento`,
      datosExtraidos: {
        rutGestor: parsedData.rutGestor,
        nombreGestor: parsedData.nombreGestor,
        numeroDocumento: parsedData.numeroDocumento,
        fecha: parsedData.fechaEmision,
        items: parsedData.items.length,
        guiasReferencia: parsedData.guiasReferencia.length
      },
      registros: savedRecords
    });

  } catch (error) {
    console.error('Error procesando PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo PDF',
      error: error.message
    });
  }
};

/**
 * Obtener todos los registros de monitoring con filtros
 */
exports.getRegistros = async (req, res) => {
  try {
    const { anio, mes, origen } = req.query;

    const filtro = {};

    if (anio) {
      filtro.anio = parseInt(anio);
    }

    if (mes && mes !== '0') {
      const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      filtro.periodo = meses[parseInt(mes)];
    }

    if (origen) {
      filtro.origen = origen;
    }

    const registros = await Monitoring.find(filtro)
      .sort({ fechaDTE: -1 })
      .lean();

    res.json({
      success: true,
      total: registros.length,
      registros
    });

  } catch (error) {
    console.error('Error obteniendo registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros',
      error: error.message
    });
  }
};

/**
 * Obtener resumen agrupado por categoría
 */
exports.getResumen = async (req, res) => {
  try {
    const { anio, mes, origen } = req.query;

    const match = {};

    if (anio) {
      match.anio = parseInt(anio);
    }

    if (mes && mes !== '0') {
      const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      match.periodo = meses[parseInt(mes)];
    }

    if (origen) {
      match.origen = origen;
    }

    const resumen = await Monitoring.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            subCategoria: '$subCategoria',
            materialidad: '$materialidad'
          },
          toneladas: { $sum: '$toneladas' },
          cantidadDocumentos: { $addToSet: '$numeroDTE' }
        }
      },
      {
        $project: {
          _id: 0,
          subCategoria: '$_id.subCategoria',
          materialidad: '$_id.materialidad',
          toneladas: { $round: ['$toneladas', 3] },
          documentos: { $size: '$cantidadDocumentos' }
        }
      },
      { $sort: { subCategoria: 1, materialidad: 1 } }
    ]);

    // Calcular totales por subcategoría
    const totalesPorCategoria = {};
    resumen.forEach(r => {
      if (!totalesPorCategoria[r.subCategoria]) {
        totalesPorCategoria[r.subCategoria] = 0;
      }
      totalesPorCategoria[r.subCategoria] += r.toneladas;
    });

    res.json({
      success: true,
      resumen,
      totalesPorCategoria,
      totalGeneral: Object.values(totalesPorCategoria).reduce((a, b) => a + b, 0)
    });

  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen',
      error: error.message
    });
  }
};

/**
 * Exportar a Excel con formato de plantilla oficial
 */
exports.exportarExcel = async (req, res) => {
  try {
    const { anio, mes, origen } = req.query;

    const filtro = {};

    if (anio) {
      filtro.anio = parseInt(anio);
    }

    if (mes && mes !== '0') {
      const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      filtro.periodo = meses[parseInt(mes)];
    }

    if (origen) {
      filtro.origen = origen;
    }

    const registros = await Monitoring.find(filtro)
      .sort({ fechaDTE: 1 })
      .lean();

    // Crear datos para Excel en formato de la plantilla oficial
    const datosExcel = registros.map(r => ({
      rut_empresa: r.rutEmpresa,
      ID_establecimiento_empresa: r.idEstablecimientoEmpresa || '',
      Periodo: r.periodo,
      'Año': r.anio,
      rut_Gestor: r.rutGestor,
      ID_establecimiento_gestor: r.idEstablecimientoGestor || '',
      tipo_DTE: r.tipoDTE,
      numero_DTE: r.numeroDTE,
      fecha_DTE: r.fechaDTE ? new Date(r.fechaDTE).toLocaleDateString('es-CL') : '',
      subCategoria: r.subCategoria,
      Materialidad: r.materialidad,
      Toneladas: r.toneladas
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Hoja de datos
    const wsDatos = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, wsDatos, 'Datos');

    // Hoja de anexo (categorías)
    const anexoData = [
      ['Papel_y_Cartón', 'Plásticos_Flexibles', 'Plásticos_Rígidos', 'Metales'],
      ['Papel blanco', 'PET (1)', 'PET (1)', 'Hojalatas'],
      ['Revistas couche', 'HDPE (2)', 'HDPE (2)', 'Latas aluminio'],
      ['Diario', 'PVC (3)', 'PVC (3)', 'Otros metales'],
      ['Otros papeles', 'LDPE (4)', 'LDPE (4)', ''],
      ['Cartón', 'PP (5)', 'PP (5)', ''],
      ['Pulpa Moldeada', 'PS (6)', 'PS (6)', ''],
      ['Duplex', 'OTROS (7)', 'OTROS (7)', '']
    ];
    const wsAnexo = XLSX.utils.aoa_to_sheet(anexoData);
    XLSX.utils.book_append_sheet(wb, wsAnexo, 'Anexo');

    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Enviar archivo
    const nombreArchivo = `Monitoring_${origen || 'Total'}_${anio || 'TodosAnios'}_${mes || 'TodosMeses'}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar a Excel',
      error: error.message
    });
  }
};

/**
 * Eliminar un registro
 */
exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await Monitoring.findByIdAndDelete(id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Registro eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registro',
      error: error.message
    });
  }
};

/**
 * Eliminar todos los registros (con filtros opcionales)
 */
exports.limpiarDatos = async (req, res) => {
  try {
    const { anio, origen } = req.query;

    const filtro = {};

    if (anio) {
      filtro.anio = parseInt(anio);
    }

    if (origen) {
      filtro.origen = origen;
    }

    const resultado = await Monitoring.deleteMany(filtro);

    res.json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} registros`,
      deletedCount: resultado.deletedCount
    });

  } catch (error) {
    console.error('Error limpiando datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar datos',
      error: error.message
    });
  }
};

/**
 * Obtener años disponibles
 */
exports.getAniosDisponibles = async (req, res) => {
  try {
    const { origen } = req.query;

    const match = origen ? { origen } : {};

    const anios = await Monitoring.distinct('anio', match);

    res.json({
      success: true,
      anios: anios.sort((a, b) => b - a)
    });

  } catch (error) {
    console.error('Error obteniendo años:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener años disponibles',
      error: error.message
    });
  }
};
