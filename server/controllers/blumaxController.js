const Blumax = require('../models/Blumax');
const mapeoEnvasesBlumax = require('../config/mapeoEnvasesBlumax.json');

// Función para calcular residuos de un registro Blumax usando el mapeo
const calcularResiduosBlumax = (registro) => {
  const { envase, unidades } = registro;

  // Buscar nombre normalizado del envase
  const nombreEnvase = mapeoEnvasesBlumax.mapeoNombres[envase.toUpperCase()];

  if (!nombreEnvase || !mapeoEnvasesBlumax.envases[nombreEnvase]) {
    return null;
  }

  const envaseConfig = mapeoEnvasesBlumax.envases[nombreEnvase];
  const residuos = [];

  envaseConfig.componentes.forEach(comp => {
    const pesoKg = (comp.pesoGr * comp.cantidad * unidades) / 1000;

    residuos.push({
      componente: comp.nombre,
      material: comp.material,
      codigo: comp.codigo,
      categoria: comp.categoria,
      pesoKg: pesoKg,
      peligroso: comp.peligrosidad === 'PELIGROSO',
      domiciliario: comp.domiciliario
    });
  });

  return residuos;
};

// Obtener todos los datos de Blumax con filtros opcionales
exports.getBlumax = async (req, res) => {
  try {
    const { año } = req.query;

    let filtro = {};
    if (año) filtro.año = parseInt(año);

    const datos = await Blumax.find(filtro);

    res.json({
      success: true,
      count: datos.length,
      data: datos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de Blumax',
      error: error.message
    });
  }
};

// Obtener resumen de residuos Blumax por clasificación
exports.getResumenResiduosBlumax = async (req, res) => {
  try {
    const { año, mes } = req.query;

    if (!año) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere parámetro año'
      });
    }

    const datos = await Blumax.find({ año: parseInt(año) });

    // Si se filtra por mes específico, dividir por 12 (distribución equitativa mensual)
    const mesInt = mes ? parseInt(mes) : 0;
    const factorMes = mesInt > 0 ? (1 / 12) : 1;

    // Calcular residuos y agrupar por material
    const clasificacionMap = {};

    datos.forEach(registro => {
      const residuos = calcularResiduosBlumax(registro);

      if (!residuos) return;

      residuos.forEach(item => {
        // Usar material + peligrosidad como clave para separar PEAD peligroso vs no peligroso
        const key = `${item.material}|${item.peligroso ? 'P' : 'NP'}`;

        if (!clasificacionMap[key]) {
          clasificacionMap[key] = {
            material: item.material,
            codigo: item.codigo,
            categoria: item.categoria,
            pesoTotal: 0,
            peligroso: item.peligroso,
            domiciliario: item.domiciliario
          };
        }

        // Aplicar factor de división mensual
        clasificacionMap[key].pesoTotal += item.pesoKg * factorMes;
      });
    });

    const resumenClasificacion = Object.values(clasificacionMap)
      .map(item => ({
        ...item,
        pesoTotal: Math.round(item.pesoTotal * 100) / 100
      }))
      .sort((a, b) => b.pesoTotal - a.pesoTotal);

    const totales = {
      pesoTotal: 0,
      plasticos: 0,
      papelCarton: 0,
      metales: 0,
      peligrosos: 0,
      noPeligrosos: 0
    };

    resumenClasificacion.forEach(item => {
      totales.pesoTotal += item.pesoTotal;

      if (item.categoria === 'Plásticos') totales.plasticos += item.pesoTotal;
      if (item.categoria === 'Papel y cartón') totales.papelCarton += item.pesoTotal;
      if (item.categoria === 'Metales') totales.metales += item.pesoTotal;

      if (item.peligroso) {
        totales.peligrosos += item.pesoTotal;
      } else {
        totales.noPeligrosos += item.pesoTotal;
      }
    });

    // Redondear totales
    Object.keys(totales).forEach(key => {
      totales[key] = Math.round(totales[key] * 100) / 100;
    });

    res.json({
      success: true,
      data: resumenClasificacion,
      totales: totales
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al calcular resumen Blumax',
      error: error.message
    });
  }
};

// Obtener años disponibles
exports.getAñosDisponibles = async (req, res) => {
  try {
    const años = await Blumax.distinct('año');
    res.json({
      success: true,
      data: años.sort((a, b) => b - a)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener años disponibles',
      error: error.message
    });
  }
};

// Limpiar datos de Blumax por año
exports.limpiarPorAño = async (req, res) => {
  try {
    const { año } = req.body;

    if (!año) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro año'
      });
    }

    const resultado = await Blumax.deleteMany({ año: parseInt(año) });

    res.json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} registros de Blumax del año ${año}`,
      eliminados: resultado.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar datos de Blumax',
      error: error.message
    });
  }
};

// Limpiar todos los datos de Blumax
exports.limpiarTodo = async (req, res) => {
  try {
    const resultado = await Blumax.deleteMany({});

    res.json({
      success: true,
      message: `Se eliminaron todos los datos de Blumax (${resultado.deletedCount} registros)`,
      eliminados: resultado.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar todos los datos de Blumax',
      error: error.message
    });
  }
};

// Limpiar datos de Blumax por período (año y opcionalmente mes)
exports.limpiarPorPeriodo = async (req, res) => {
  try {
    const { año, mes } = req.body;

    if (!año) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro año'
      });
    }

    const filtro = { año: parseInt(año) };
    if (mes) {
      filtro.mes = parseInt(mes);
    }

    const resultado = await Blumax.deleteMany(filtro);

    const mensaje = mes
      ? `Se eliminaron ${resultado.deletedCount} registros de Blumax de ${mes}/${año}`
      : `Se eliminaron ${resultado.deletedCount} registros de Blumax del año ${año}`;

    res.json({
      success: true,
      message: mensaje,
      eliminados: resultado.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar datos de Blumax por período',
      error: error.message
    });
  }
};

// Exportar datos de Blumax en formato Excel
exports.exportarBlumaxREP = async (req, res) => {
  try {
    const { año, mes } = req.query;
    const XLSX = require('xlsx');

    if (!año) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro año'
      });
    }

    const filtro = { año: parseInt(año) };
    if (mes) {
      filtro.mes = parseInt(mes);
    }

    const datos = await Blumax.find(filtro).lean();

    if (datos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay datos para exportar'
      });
    }

    // Calcular residuos para cada registro
    const datosExport = [];
    datos.forEach(registro => {
      const residuos = calcularResiduosBlumax(registro);
      if (residuos) {
        residuos.forEach(r => {
          datosExport.push({
            'Año': registro.año,
            'Mes': registro.mes || 'Anual',
            'Envase': registro.envase,
            'Unidades': registro.unidades,
            'Material': r.material,
            'Código': r.codigo,
            'Categoría': r.categoria,
            'Peso (Kg)': Math.round(r.pesoKg * 100) / 100,
            'Peligroso': r.peligroso ? 'Sí' : 'No',
            'Domiciliario': r.domiciliario ? 'Sí' : 'No'
          });
        });
      }
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Bluemax');

    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const nombreArchivo = mes
      ? `Bluemax_${año}-${String(mes).padStart(2, '0')}.xlsx`
      : `Bluemax_${año}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(buffer);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al exportar datos de Blumax',
      error: error.message
    });
  }
};

// Obtener estado de meses cargados para Blumax
exports.getEstadoMeses = async (req, res) => {
  try {
    const { año } = req.query;
    const añoInt = parseInt(año) || new Date().getFullYear();

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Obtener conteo de registros por mes
    const estadoMeses = await Blumax.aggregate([
      { $match: { año: añoInt, mes: { $ne: null } } },
      {
        $group: {
          _id: '$mes',
          registros: { $sum: 1 },
          unidades: { $sum: '$unidades' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Crear estructura con todos los meses
    const meses = [];
    for (let i = 1; i <= 12; i++) {
      const mesDatos = estadoMeses.find(m => m._id === i);
      meses.push({
        mes: i,
        nombre: nombresMeses[i - 1],
        cargado: !!mesDatos,
        registros: mesDatos?.registros || 0,
        unidades: mesDatos?.unidades || 0
      });
    }

    res.json({
      success: true,
      data: {
        año: añoInt,
        meses: meses,
        totalCargados: meses.filter(m => m.cargado).length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de meses',
      error: error.message
    });
  }
};

// Exportar función de cálculo para uso en otros controllers
exports.calcularResiduosBlumax = calcularResiduosBlumax;
