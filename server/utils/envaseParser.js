const XLSX = require('xlsx');
const Envase = require('../models/Envase');

// Extraer código de clasificación del material (ej: "(2)", "(5)")
function extraerCodigoClasificacion(material) {
  if (!material) return null;
  
  const match = material.match(/\((\d+)\)/);
  return match ? match[1] : null;
}

// Parsear archivo Excel de residuos y guardar en MongoDB
exports.procesarExcelEnvases = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Procesando ${data.length} registros de envases...`);
    
    const envasesMap = {};
    
    data.forEach(row => {
      const nombre = row['Nombre'];
      
      if (!envasesMap[nombre]) {
        envasesMap[nombre] = {
          nombre: nombre,
          componentes: [],
          unidadesVendidas: row['Unidades vendidasKU'] || 0,
          businessUnit: row['BU'] || ''
        };
      }
      
      // Extraer código de clasificación
      const codigoClasificacion = extraerCodigoClasificacion(row['Material']);
      
      // Agregar componente
      envasesMap[nombre].componentes.push({
        nombre: row['Componente'],
        cantidad: row['Cantidad'] || 1,
        pesoGramos: row['Peso (gr)'] || 0,
        categoria: row['Categoría'],
        material: row['Material'],
        codigoClasificacion: codigoClasificacion, // NUEVO
        caracteristica: row['Característica'],
        porcentajeReciclado: row['%Reciclado'] || 0,
        retornable: row['Retornable '] === 1 || row['Retornable '] === 7897,
        peligrosidad: row['Peligrosidad'],
        domiciliario: row['Domiciliario']
      });
    });
    
    await Envase.deleteMany({});
    console.log('🗑️  Datos anteriores de envases eliminados');
    
    const envases = Object.values(envasesMap);
    const resultado = await Envase.insertMany(envases);
    
    console.log(`✅ ${resultado.length} tipos de envases insertados`);
    
    return {
      success: true,
      envasesInsertados: resultado.length,
      productosUnicos: envases.map(e => e.nombre)
    };
    
  } catch (error) {
    console.error('❌ Error procesando Excel de envases:', error);
    throw error;
  }
};