const Venta = require('../models/Venta');
const { mapearVentaAEnvase, calcularResiduos } = require('../utils/residuosMapper');
const Envase = require('../models/Envase');

// Obtener todas las ventas con filtros opcionales
exports.getVentas = async (req, res) => {
  try {
    const { año, mes, material } = req.query;

    let filtro = {};
    if (año) filtro.año = parseInt(año);
    if (mes) filtro.mes = parseInt(mes);
    if (material) filtro.material = material;

    const ventas = await Venta.find(filtro);

    res.json({
      success: true,
      count: ventas.length,
      data: ventas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
};

// Obtener resumen mensual por SKU
exports.getResumenMensual = async (req, res) => {
  try {
    const { año } = req.query;
    const añoFiltro = año ? parseInt(año) : 2024;

    const resumen = await Venta.aggregate([
      { $match: { año: añoFiltro } },
      {
        $group: {
          _id: {
            material: '$material',
            materialNombre: '$materialNombre',
            mes: '$mes'
          },
          totalVolumen: { $sum: '$volumen' },
          totalUnidades: { $sum: '$unidades' }
        }
      },
      {
        $sort: { '_id.mes': 1 }
      }
    ]);

    res.json({
      success: true,
      data: resumen
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen mensual',
      error: error.message
    });
  }
};

// Obtener top productos
exports.getTopProductos = async (req, res) => {
  try {
    const { año, limite = 10 } = req.query;
    const añoFiltro = año ? parseInt(año) : 2024;

    const topProductos = await Venta.aggregate([
      { $match: { año: añoFiltro } },
      {
        $group: {
          _id: {
            material: '$material',
            materialNombre: '$materialNombre'
          },
          totalVolumen: { $sum: '$volumen' },
          totalUnidades: { $sum: '$unidades' }
        }
      },
      { $sort: { totalVolumen: -1 } },
      { $limit: parseInt(limite) }
    ]);

    res.json({
      success: true,
      data: topProductos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener top productos',
      error: error.message
    });
  }
};

// Obtener ventas por mes con cálculo de residuos
exports.getVentasConResiduos = async (req, res) => {
  try {
    const { año, mes } = req.query;

    if (!año || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren parámetros año y mes'
      });
    }

    const ventas = await Venta.find({
      año: parseInt(año),
      mes: parseInt(mes),
      grupoLineas: { $ne: '8. Bluemax' },
      envase: { $ne: 'GRANEL' }
    });

    const envases = await Envase.find();
    const envasesMap = {};
    envases.forEach(env => {
      envasesMap[env.nombre] = env;
    });

    const productosMap = {};

    ventas.forEach(venta => {
      const key = venta.material;

      if (!productosMap[key]) {
        productosMap[key] = {
          sku: venta.material,
          nombre: venta.materialNombre,
          grupoLineas: venta.grupoLineas,
          envase: venta.envase,
          volumen: 0,
          unidades: 0,
          residuos: null,
          tipoEnvaseMapeado: null
        };
      }

      productosMap[key].volumen += venta.volumen;
      productosMap[key].unidades += venta.unidades;
    });

    const productosConResiduos = Object.values(productosMap).map(producto => {
      const tipoEnvase = mapearVentaAEnvase(producto);
      producto.tipoEnvaseMapeado = tipoEnvase;

      if (tipoEnvase && envasesMap[tipoEnvase]) {
        const residuos = calcularResiduos(producto, envasesMap[tipoEnvase]);
        producto.residuos = residuos;
      }

      return producto;
    });

    productosConResiduos.sort((a, b) => b.volumen - a.volumen);

    const totales = {
      productos: productosConResiduos.length,
      volumen: 0,
      unidades: 0,
      residuosTotales: 0,
      plasticos: 0,
      papelCarton: 0,
      metales: 0,
      productosSinMapeo: 0
    };

    productosConResiduos.forEach(p => {
      totales.volumen += p.volumen;
      totales.unidades += p.unidades;

      if (p.residuos) {
        totales.residuosTotales += p.residuos.totalKg;
        totales.plasticos += p.residuos.plasticos;
        totales.papelCarton += p.residuos.papelCarton;
        totales.metales += p.residuos.metales;
      } else {
        totales.productosSinMapeo++;
      }
    });

    totales.residuosTotales = Math.round(totales.residuosTotales * 100) / 100;
    totales.plasticos = Math.round(totales.plasticos * 100) / 100;
    totales.papelCarton = Math.round(totales.papelCarton * 100) / 100;
    totales.metales = Math.round(totales.metales * 100) / 100;

    res.json({
      success: true,
      data: productosConResiduos,
      totales: totales
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al calcular residuos',
      error: error.message
    });
  }
};

// Obtener resumen de residuos agrupados por clasificación de empresa recolectora
exports.getResumenResiduosPorClasificacion = async (req, res) => {
  try {
    const { año, mes } = req.query;

    if (!año || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren parámetros año y mes'
      });
    }

    const ventas = await Venta.find({
      año: parseInt(año),
      mes: parseInt(mes),
      grupoLineas: { $ne: '8. Bluemax' },
      envase: { $ne: 'GRANEL' }
    });

    const envases = await Envase.find();
    const envasesMap = {};
    envases.forEach(env => {
      envasesMap[env.nombre] = env;
    });

    const clasificacionMap = {};

    ventas.forEach(venta => {
      const tipoEnvase = mapearVentaAEnvase(venta);

      if (tipoEnvase && envasesMap[tipoEnvase]) {
        const residuos = calcularResiduos(venta, envasesMap[tipoEnvase]);

        if (residuos && residuos.porClasificacion) {
          residuos.porClasificacion.forEach(item => {
            const key = item.material;

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

            clasificacionMap[key].pesoTotal += item.pesoKg;
          });
        }
      }
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

    totales.pesoTotal = Math.round(totales.pesoTotal * 100) / 100;
    totales.plasticos = Math.round(totales.plasticos * 100) / 100;
    totales.papelCarton = Math.round(totales.papelCarton * 100) / 100;
    totales.metales = Math.round(totales.metales * 100) / 100;
    totales.peligrosos = Math.round(totales.peligrosos * 100) / 100;
    totales.noPeligrosos = Math.round(totales.noPeligrosos * 100) / 100;

    res.json({
      success: true,
      data: resumenClasificacion,
      totales: totales
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al calcular resumen por clasificación',
      error: error.message
    });
  }
};

// Limpiar ventas por período (año y mes)
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

    const resultado = await Venta.deleteMany(filtro);

    res.json({
      success: true,
      message: mes
        ? `Se eliminaron ${resultado.deletedCount} registros de ${mes}/${año}`
        : `Se eliminaron ${resultado.deletedCount} registros del año ${año}`,
      eliminados: resultado.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar datos',
      error: error.message
    });
  }
};

// Limpiar todos los datos de ventas
exports.limpiarTodo = async (req, res) => {
  try {
    const resultado = await Venta.deleteMany({});

    res.json({
      success: true,
      message: `Se eliminaron todos los datos (${resultado.deletedCount} registros)`,
      eliminados: resultado.deletedCount
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar todos los datos',
      error: error.message
    });
  }
};