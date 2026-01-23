const fs = require('fs');
const path = require('path');

// Cargar configuración de mapeo desde JSON
let configMapeo = null;
let mapeoSKU = null;

function cargarConfiguracion() {
  if (configMapeo) return configMapeo;

  const rutaConfig = path.join(__dirname, '../config/mapeoEnvases.json');
  const contenido = fs.readFileSync(rutaConfig, 'utf8');
  configMapeo = JSON.parse(contenido);
  return configMapeo;
}

function cargarMapeoSKU() {
  if (mapeoSKU) return mapeoSKU;

  const rutaMapeo = path.join(__dirname, '../config/mapeoSKU.json');
  const contenido = fs.readFileSync(rutaMapeo, 'utf8');
  mapeoSKU = JSON.parse(contenido);
  return mapeoSKU;
}

// Recargar configuración (útil si se modifica el archivo)
exports.recargarConfiguracion = () => {
  configMapeo = null;
  mapeoSKU = null;
  cargarConfiguracion();
  cargarMapeoSKU();
};

// Mapear una venta a su tipo de envase correspondiente
exports.mapearVentaAEnvase = (venta) => {
  const config = cargarConfiguracion();
  const skuMap = cargarMapeoSKU();

  const sku = String(venta.material || venta.Material || '').trim();
  const grupoLineas = venta.grupoLineas || venta.GrupoLineas || '';
  const envase = venta.envase || venta.Envase || '';
  const nombre = venta.materialNombre || venta.MaterialNombre || '';

  // 1. PRIORIDAD: Buscar por SKU directo en mapeoSKU.json
  if (sku && skuMap.mapeoSKU && skuMap.mapeoSKU[sku]) {
    return skuMap.mapeoSKU[sku].categoria;
  }

  // 2. Verificar reglas generales (aplican a todos los grupos)
  if (config.reglasGenerales[envase] !== undefined) {
    return config.reglasGenerales[envase];
  }

  // 3. Verificar excepciones por nombre (productos a excluir)
  const excepciones = config.excepcionesPorNombre[grupoLineas];
  if (excepciones && excepciones.excluir) {
    const nombreUpper = nombre.toUpperCase();
    for (const patron of excepciones.excluir) {
      if (nombreUpper.includes(patron.toUpperCase())) {
        return null;
      }
    }
  }

  // 4. Buscar en reglas por grupo (fallback)
  const reglasGrupo = config.porGrupo[grupoLineas];
  if (reglasGrupo && reglasGrupo[envase] !== undefined) {
    return reglasGrupo[envase];
  }

  // 5. Si el grupo es vacío o null, usar reglas de [NULL]
  if (!grupoLineas || grupoLineas === '[NULL]') {
    const reglasNull = config.porGrupo['[NULL]'];
    if (reglasNull && reglasNull[envase] !== undefined) {
      return reglasNull[envase];
    }
  }

  // No hay match
  return null;
};

// Calcular residuos totales para una venta con clasificación de empresa recolectora
exports.calcularResiduos = (venta, envase) => {
  if (!envase || !envase.componentes) {
    return null;
  }

  const unidades = venta.unidades || venta.Unidades || 0;

  const residuosPorCategoria = {
    'Plásticos': 0,
    'Papel y cartón': 0,
    'Metales': 0
  };

  // Agrupar por clasificación de empresa recolectora
  const residuosPorClasificacion = {};

  let totalKg = 0;
  let peligroso = false;

  envase.componentes.forEach(componente => {
    // Calcular peso total del componente
    const pesoTotalGramos = componente.pesoGramos * unidades;
    const pesoKg = pesoTotalGramos / 1000;

    // Sumar por categoría general
    if (residuosPorCategoria[componente.categoria] !== undefined) {
      residuosPorCategoria[componente.categoria] += pesoKg;
    }

    // Sumar por clasificación de empresa recolectora
    const clasificacionKey = componente.material || 'Sin clasificación';

    if (!residuosPorClasificacion[clasificacionKey]) {
      residuosPorClasificacion[clasificacionKey] = {
        material: clasificacionKey,
        codigo: componente.codigoClasificacion || null,
        categoria: componente.categoria,
        pesoKg: 0,
        peligroso: componente.peligrosidad === 'PELIGROSO',
        domiciliario: componente.domiciliario
      };
    }

    residuosPorClasificacion[clasificacionKey].pesoKg += pesoKg;

    totalKg += pesoKg;

    if (componente.peligrosidad === 'PELIGROSO') {
      peligroso = true;
    }
  });

  return {
    totalKg: Math.round(totalKg * 100) / 100,
    plasticos: Math.round(residuosPorCategoria['Plásticos'] * 100) / 100,
    papelCarton: Math.round(residuosPorCategoria['Papel y cartón'] * 100) / 100,
    metales: Math.round(residuosPorCategoria['Metales'] * 100) / 100,
    peligroso: peligroso,
    tipoEnvase: envase.nombre,
    porClasificacion: Object.values(residuosPorClasificacion).map(item => ({
      ...item,
      pesoKg: Math.round(item.pesoKg * 100) / 100
    }))
  };
};
