const Venta = require('../models/Venta');
const Blumax = require('../models/Blumax');
const Envase = require('../models/Envase');
const Monitoring = require('../models/Monitoring');

// Mapeo de tipos de envase a categorías - Ampliado con todos los envases del sistema
const CATEGORIA_MAP = {
  'Plásticos': [
    'PEAD', 'PP', 'PET', 'LDPE', 'PS', 'PVC', 'PLASTICO', 'PLÁSTICO',
    'BIDÓN', 'BIDON', 'BIDONES', 'GARRAFA', 'BOTELLA', 'ENVASE',
    'BALDE', 'CUÑETE', 'CUNETE', 'IBC', 'CONTENEDOR', 'BIN', 'BINS',
    'TAMBOR', 'GRANEL', 'BLOQUE', 'PAN'
  ],
  'Papel y cartón': [
    'CARTON', 'PAPEL', 'CARTÓN', 'CAJA', 'ETIQUETA', 'PACK', 'CARTRIDG'
  ],
  'Metales': [
    'HOJALATA', 'ALUMINIO', 'ACERO', 'METAL', 'LATA', 'TAPA MET'
  ]
};

function categorizarEnvase(envase) {
  const envaseUpper = (envase || '').toUpperCase();
  for (const [categoria, keywords] of Object.entries(CATEGORIA_MAP)) {
    if (keywords.some(k => envaseUpper.includes(k))) {
      return categoria;
    }
  }
  // Intentar clasificar por defecto como plástico si contiene números típicos de volumen
  if (/\d+\s*(L|LT|ML|GAL)/i.test(envaseUpper)) {
    return 'Plásticos';
  }
  return 'Otros';
}

// Obtener resumen de línea base por categoría
exports.getLineaBaseResumen = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();
    const añoAnterior = añoActual - 1;

    // Obtener envases con sus componentes (normalizado a mayúsculas)
    const envases = await Envase.find({});
    const envaseMap = {};
    envases.forEach(e => {
      // Guardar con nombre original y también normalizado
      envaseMap[e.nombre] = e.componentes || [];
      envaseMap[e.nombre.toUpperCase()] = e.componentes || [];
      envaseMap[e.nombre.toLowerCase()] = e.componentes || [];
    });

    console.log(`[Stats] Envases en catálogo: ${envases.length}`);

    // Datos de Ventas (LUB)
    const ventasActual = await Venta.find({ año: añoActual });
    const ventasAnterior = await Venta.find({ año: añoAnterior });

    console.log(`[Stats] Ventas ${añoActual}: ${ventasActual.length}, ${añoAnterior}: ${ventasAnterior.length}`);

    // Datos de Blumax
    const blumaxActual = await Blumax.find({ año: añoActual });
    const blumaxAnterior = await Blumax.find({ año: añoAnterior });

    console.log(`[Stats] Blumax ${añoActual}: ${blumaxActual.length}, ${añoAnterior}: ${blumaxAnterior.length}`);

    // Mostrar algunos ejemplos de envases para debug
    if (ventasActual.length > 0) {
      const envasesUnicos = [...new Set(ventasActual.slice(0, 10).map(v => v.envase))];
      console.log(`[Stats] Ejemplos envases ventas: ${envasesUnicos.join(', ')}`);
    }

    // Calcular totales por categoría para LUB
    const calcularTotalesLUB = (ventas) => {
      const totales = {
        'Plásticos': { unidades: 0, pesoKg: 0 },
        'Papel y cartón': { unidades: 0, pesoKg: 0 },
        'Metales': { unidades: 0, pesoKg: 0 },
        'Otros': { unidades: 0, pesoKg: 0 }
      };

      ventas.forEach(v => {
        const componentes = envaseMap[v.envase] || [];
        if (componentes.length > 0) {
          componentes.forEach(comp => {
            const cat = comp.categoria || 'Otros';
            if (totales[cat]) {
              totales[cat].unidades += v.unidades || 0;
              totales[cat].pesoKg += ((comp.pesoGramos || 0) * (v.unidades || 0)) / 1000;
            }
          });
        } else {
          const cat = categorizarEnvase(v.envase);
          totales[cat].unidades += v.unidades || 0;
        }
      });

      return totales;
    };

    // Calcular totales para Blumax
    const calcularTotalesBlumax = (datos) => {
      const totales = {
        'Plásticos': { unidades: 0, pesoKg: 0 },
        'Papel y cartón': { unidades: 0, pesoKg: 0 },
        'Metales': { unidades: 0, pesoKg: 0 },
        'Otros': { unidades: 0, pesoKg: 0 }
      };

      datos.forEach(d => {
        const componentes = envaseMap[d.envase] || [];
        if (componentes.length > 0) {
          componentes.forEach(comp => {
            const cat = comp.categoria || 'Otros';
            if (totales[cat]) {
              totales[cat].unidades += d.unidades || 0;
              totales[cat].pesoKg += ((comp.pesoGramos || 0) * (d.unidades || 0)) / 1000;
            }
          });
        } else {
          const cat = categorizarEnvase(d.envase);
          totales[cat].unidades += d.unidades || 0;
        }
      });

      return totales;
    };

    const lubActual = calcularTotalesLUB(ventasActual);
    const lubAnterior = calcularTotalesLUB(ventasAnterior);
    const bmxActual = calcularTotalesBlumax(blumaxActual);
    const bmxAnterior = calcularTotalesBlumax(blumaxAnterior);

    // Combinar totales
    const combinarTotales = (lub, bmx) => {
      const result = {};
      for (const cat of Object.keys(lub)) {
        result[cat] = {
          unidades: lub[cat].unidades + bmx[cat].unidades,
          pesoKg: lub[cat].pesoKg + bmx[cat].pesoKg
        };
      }
      return result;
    };

    res.json({
      success: true,
      data: {
        añoActual,
        añoAnterior,
        actual: {
          lub: lubActual,
          blumax: bmxActual,
          total: combinarTotales(lubActual, bmxActual)
        },
        anterior: {
          lub: lubAnterior,
          blumax: bmxAnterior,
          total: combinarTotales(lubAnterior, bmxAnterior)
        }
      }
    });
  } catch (error) {
    console.error('Error en getLineaBaseResumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener datos mensuales para comparativa
exports.getLineaBaseMensual = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();
    const añoAnterior = añoActual - 1;

    const envases = await Envase.find({});
    const envaseMap = {};
    envases.forEach(e => {
      envaseMap[e.nombre] = e.componentes || [];
    });

    // Agregación mensual de ventas
    const ventasActual = await Venta.aggregate([
      { $match: { año: añoActual } },
      { $group: { _id: '$mes', totalUnidades: { $sum: '$unidades' } } },
      { $sort: { _id: 1 } }
    ]);

    const ventasAnterior = await Venta.aggregate([
      { $match: { año: añoAnterior } },
      { $group: { _id: '$mes', totalUnidades: { $sum: '$unidades' } } },
      { $sort: { _id: 1 } }
    ]);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const formatearDatos = (datos) => {
      const result = meses.map((mes, i) => ({ mes, unidades: 0 }));
      datos.forEach(d => {
        if (d._id >= 1 && d._id <= 12) {
          result[d._id - 1].unidades = d.totalUnidades;
        }
      });
      return result;
    };

    res.json({
      success: true,
      data: {
        añoActual,
        añoAnterior,
        actual: formatearDatos(ventasActual),
        anterior: formatearDatos(ventasAnterior)
      }
    });
  } catch (error) {
    console.error('Error en getLineaBaseMensual:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener datos por planta (LUB vs Blumax)
exports.getLineaBasePorPlanta = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();

    const ventasTotal = await Venta.aggregate([
      { $match: { año: añoActual } },
      { $group: { _id: null, totalUnidades: { $sum: '$unidades' } } }
    ]);

    const blumaxTotal = await Blumax.aggregate([
      { $match: { año: añoActual } },
      { $group: { _id: null, totalUnidades: { $sum: '$unidades' } } }
    ]);

    res.json({
      success: true,
      data: {
        año: añoActual,
        plantas: [
          { nombre: 'Lubricantes', unidades: ventasTotal[0]?.totalUnidades || 0 },
          { nombre: 'Bluemax', unidades: blumaxTotal[0]?.totalUnidades || 0 }
        ]
      }
    });
  } catch (error) {
    console.error('Error en getLineaBasePorPlanta:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener resumen de Monitoring
exports.getMonitoringResumen = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();
    const añoAnterior = añoActual - 1;

    // Totales por categoría
    const porCategoriaActual = await Monitoring.aggregate([
      { $match: { anio: añoActual } },
      { $group: { _id: '$subCategoria', totalToneladas: { $sum: '$toneladas' } } }
    ]);

    const porCategoriaAnterior = await Monitoring.aggregate([
      { $match: { anio: añoAnterior } },
      { $group: { _id: '$subCategoria', totalToneladas: { $sum: '$toneladas' } } }
    ]);

    // Totales por gestor
    const porGestor = await Monitoring.aggregate([
      { $match: { anio: añoActual } },
      { $group: {
        _id: '$rutGestor',
        nombreGestor: { $first: '$nombreGestor' },
        totalToneladas: { $sum: '$toneladas' }
      } },
      { $sort: { totalToneladas: -1 } },
      { $limit: 10 }
    ]);

    const formatearCategorias = (datos) => {
      const result = {
        'Papel_y_Cartón': 0,
        'Plásticos_Flexibles': 0,
        'Plásticos_Rígidos': 0,
        'Metales': 0
      };
      datos.forEach(d => {
        if (result.hasOwnProperty(d._id)) {
          result[d._id] = d.totalToneladas;
        }
      });
      return result;
    };

    res.json({
      success: true,
      data: {
        añoActual,
        añoAnterior,
        actual: formatearCategorias(porCategoriaActual),
        anterior: formatearCategorias(porCategoriaAnterior),
        porGestor: porGestor.map(g => ({
          rut: g._id,
          nombre: g.nombreGestor || g._id,
          toneladas: g.totalToneladas
        }))
      }
    });
  } catch (error) {
    console.error('Error en getMonitoringResumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener datos mensuales de Monitoring
exports.getMonitoringMensual = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();

    const mesesOrden = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const datosMensuales = await Monitoring.aggregate([
      { $match: { anio: añoActual } },
      { $group: { _id: '$periodo', totalToneladas: { $sum: '$toneladas' } } }
    ]);

    const result = mesesOrden.map((mes, index) => {
      const dato = datosMensuales.find(d => d._id === mes);
      return {
        mes: mes.substring(0, 3),
        mesCompleto: mes,
        toneladas: dato?.totalToneladas || 0
      };
    });

    res.json({
      success: true,
      data: {
        año: añoActual,
        mensual: result
      }
    });
  } catch (error) {
    console.error('Error en getMonitoringMensual:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Endpoint de diagnóstico para verificar datos
exports.getDiagnostico = async (req, res) => {
  try {
    const ventasCount = await Venta.countDocuments();
    const blumaxCount = await Blumax.countDocuments();
    const envaseCount = await Envase.countDocuments();
    const monitoringCount = await Monitoring.countDocuments();

    // Obtener años disponibles
    const ventasAños = await Venta.distinct('año');
    const blumaxAños = await Blumax.distinct('año');
    const monitoringAños = await Monitoring.distinct('anio');

    // Obtener ejemplos de envases de ventas
    const ventasEjemplos = await Venta.find().limit(5).select('envase año unidades');
    const blumaxEjemplos = await Blumax.find().limit(5).select('envase año unidades');

    // Probar clasificación de envases
    const clasificaciones = ventasEjemplos.map(v => ({
      envase: v.envase,
      categoria: categorizarEnvase(v.envase)
    }));

    res.json({
      success: true,
      data: {
        counts: {
          ventas: ventasCount,
          blumax: blumaxCount,
          envases: envaseCount,
          monitoring: monitoringCount
        },
        añosDisponibles: {
          ventas: ventasAños.sort(),
          blumax: blumaxAños.sort(),
          monitoring: monitoringAños.sort()
        },
        ejemplos: {
          ventas: ventasEjemplos,
          blumax: blumaxEjemplos,
          clasificaciones
        }
      }
    });
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener resumen general para dashboard
exports.getDashboardResumen = async (req, res) => {
  try {
    const { año } = req.query;
    const añoActual = parseInt(año) || new Date().getFullYear();
    const añoAnterior = añoActual - 1;

    // Total unidades vendidas (línea base)
    const ventasActual = await Venta.aggregate([
      { $match: { año: añoActual } },
      { $group: { _id: null, total: { $sum: '$unidades' } } }
    ]);

    const ventasAnterior = await Venta.aggregate([
      { $match: { año: añoAnterior } },
      { $group: { _id: null, total: { $sum: '$unidades' } } }
    ]);

    const blumaxActual = await Blumax.aggregate([
      { $match: { año: añoActual } },
      { $group: { _id: null, total: { $sum: '$unidades' } } }
    ]);

    const blumaxAnterior = await Blumax.aggregate([
      { $match: { año: añoAnterior } },
      { $group: { _id: null, total: { $sum: '$unidades' } } }
    ]);

    // Total toneladas gestionadas (monitoring)
    const monitoringActual = await Monitoring.aggregate([
      { $match: { anio: añoActual } },
      { $group: { _id: null, total: { $sum: '$toneladas' } } }
    ]);

    const monitoringAnterior = await Monitoring.aggregate([
      { $match: { anio: añoAnterior } },
      { $group: { _id: null, total: { $sum: '$toneladas' } } }
    ]);

    // Cantidad de gestores únicos
    const gestoresUnicos = await Monitoring.distinct('rutGestor', { anio: añoActual });

    // Cantidad de documentos procesados
    const documentosProcesados = await Monitoring.distinct('numeroDTE', { anio: añoActual });

    const totalLineaBaseActual = (ventasActual[0]?.total || 0) + (blumaxActual[0]?.total || 0);
    const totalLineaBaseAnterior = (ventasAnterior[0]?.total || 0) + (blumaxAnterior[0]?.total || 0);

    res.json({
      success: true,
      data: {
        añoActual,
        añoAnterior,
        lineaBase: {
          actual: totalLineaBaseActual,
          anterior: totalLineaBaseAnterior,
          variacion: totalLineaBaseAnterior > 0
            ? ((totalLineaBaseActual - totalLineaBaseAnterior) / totalLineaBaseAnterior * 100).toFixed(1)
            : 0
        },
        monitoring: {
          actual: monitoringActual[0]?.total || 0,
          anterior: monitoringAnterior[0]?.total || 0,
          variacion: monitoringAnterior[0]?.total > 0
            ? ((monitoringActual[0]?.total - monitoringAnterior[0]?.total) / monitoringAnterior[0]?.total * 100).toFixed(1)
            : 0
        },
        gestoresActivos: gestoresUnicos.length,
        documentosProcesados: documentosProcesados.length
      }
    });
  } catch (error) {
    console.error('Error en getDashboardResumen:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
