const XLSX = require('xlsx');
const Venta = require('../models/Venta');
const Blumax = require('../models/Blumax');

// Parsear archivo Excel y guardar en MongoDB
exports.procesarExcelVentas = async (filePath) => {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Procesando ${data.length} registros...`);
    
    // Mapear datos al formato del modelo
    const ventas = data.map(row => ({
      año: row['Año'] || row['año'] || row['Ano'],
      mes: row['Mes'] || row['mes'],
      canal: row['Canal'] || row['canal'],
      grupoLineas: row['GrupoLineas'] || row['grupoLineas'],
      material: row['Material'] || row['material'],
      materialNombre: row['MaterialNombre'] || row['materialNombre'],
      oficina: row['Oficina'] || row['oficina'],
      envase: row['Envase'] || row['envase'],
      volumen: row['Vol'] || row['vol'] || row['Volumen'] || 0,
      unidades: row['Unidades'] || row['unidades'] || 0
    }));
    
    // Limpiar ventas existentes del año (opcional)
    const año = ventas[0]?.año;
    if (año) {
      await Venta.deleteMany({ año });
      console.log(`🗑️  Ventas anteriores del ${año} eliminadas`);
    }
    
    // Insertar en MongoDB
    const resultado = await Venta.insertMany(ventas);
    
    console.log(`✅ ${resultado.length} registros insertados correctamente`);
    
    return {
      success: true,
      registrosInsertados: resultado.length,
      año: año
    };
    
  } catch (error) {
    console.error('Error procesando Excel:', error);
    throw error;
  }
};

// Parsear archivo Excel de Blumax y guardar en MongoDB
// Formato esperado: Año | Envase | Unidades
exports.procesarExcelBlumax = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON con headers
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Procesando archivo Blumax con ${data.length} filas...`);

    const registros = data.map(row => ({
      año: row['Año'] || row['año'] || row['Ano'],
      envase: (row['Envase'] || row['envase'] || '').toString().toUpperCase().trim(),
      unidades: parseFloat(row['Unidades'] || row['unidades']) || 0
    })).filter(r => r.año && r.envase && r.unidades > 0);

    if (registros.length === 0) {
      throw new Error('No se encontraron registros válidos. Formato esperado: Año, Envase, Unidades');
    }

    // Obtener años únicos para limpiar
    const añosUnicos = [...new Set(registros.map(r => r.año))];

    // Limpiar datos existentes de esos años
    for (const año of añosUnicos) {
      await Blumax.deleteMany({ año });
      console.log(`Datos Blumax del ${año} eliminados`);
    }

    // Insertar nuevos registros
    const resultado = await Blumax.insertMany(registros);

    console.log(`${resultado.length} registros Blumax insertados`);

    return {
      success: true,
      registrosInsertados: resultado.length,
      años: añosUnicos,
      envases: [...new Set(registros.map(r => r.envase))]
    };

  } catch (error) {
    console.error('Error procesando Excel Blumax:', error);
    throw error;
  }
};