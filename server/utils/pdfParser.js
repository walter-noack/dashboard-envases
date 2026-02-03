const pdfParse = require('pdf-parse');

// Mapeo de meses en español a número
const mesesMap = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
  'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
  'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
};

const mesesNombres = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Parsea un PDF de factura y extrae los datos relevantes
 * @param {Buffer} pdfBuffer - Buffer del archivo PDF
 * @returns {Object} Datos extraídos del PDF
 */
async function parseFacturaPDF(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  const text = data.text;

  const result = {
    tipoDocumento: 'Factura Electrónica',
    rutGestor: null,
    nombreGestor: null,
    numeroDocumento: null,
    fechaEmision: null,
    rutCliente: null,
    items: [],
    guiasReferencia: [],
    textoOriginal: text
  };

  // Extraer RUT del gestor (emisor de la factura)
  const rutGestorMatch = text.match(/R\.U\.T\.:\s*([\d\.-]+)/);
  if (rutGestorMatch) {
    result.rutGestor = rutGestorMatch[1].replace(/\./g, '');
  }

  // Extraer nombre del gestor
  const nombreGestorPatterns = [
    /RECUPAC\s+S\.A\./i,
    /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:S\.A\.|LTDA|SpA|SPA))/
  ];
  for (const pattern of nombreGestorPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.nombreGestor = match[0].trim();
      break;
    }
  }

  // Extraer número de factura
  const numFacturaMatch = text.match(/N°\s*(\d+)/);
  if (numFacturaMatch) {
    result.numeroDocumento = parseInt(numFacturaMatch[1]);
  }

  // Extraer fecha de emisión (puede estar en varias formas)
  // Forma 1: "Fecha Emisión: DD de MES de YYYY"
  // Forma 2: "DD de MES de YYYY" suelto en el texto
  let fechaMatch = text.match(/Fecha Emisión:\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!fechaMatch) {
    // Buscar fecha suelta (ej: "28 de Febrero de 2025")
    fechaMatch = text.match(/(\d{1,2})\s+de\s+(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+de\s+(\d{4})/i);
  }
  if (fechaMatch) {
    const dia = parseInt(fechaMatch[1]);
    const mesNombre = fechaMatch[2].toLowerCase();
    const anio = parseInt(fechaMatch[3]);
    const mes = mesesMap[mesNombre] || 1;
    result.fechaEmision = new Date(anio, mes - 1, dia);
  }

  // Extraer RUT del cliente (COPEC) - buscar formato 99,520,000-7 o 99.520.000-7
  const rutClientePatterns = [
    /(\d{2}[,.]?\d{3}[,.]?\d{3}-[\dkK])/,  // Formato con separadores
    /COPEC[\s\S]*?(\d{8,9}-[\dkK])/i       // Cerca de COPEC
  ];
  for (const pattern of rutClientePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.rutCliente = match[1].replace(/[,\.]/g, '');
      break;
    }
  }

  // Extraer items/materiales
  // Patrón: DESCRIPCION, TOTAL, COD, CANTIDAD, UNIDAD, PRECIO
  const itemPatterns = [
    // CARTON OCC (GRANEL) seguido de números
    /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+\([A-ZÁÉÍÓÚÑ]+\))\s+([\d.,]+)\s+INT\d+\s+([\d.,]+)\s+KG/gi,
    // Patrón alternativo
    /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:GRANEL|COMPACTADO|PRENSADO))\)?\s+([\d.,]+)\s+\w+\s+([\d.,]+)\s+KG/gi
  ];

  // Buscar materiales conocidos en el texto
  const materialesConocidos = [
    { patron: /CARTON\s+OCC\s*\(GRANEL\)/i, nombre: 'CARTON OCC', categoria: 'Papel_y_Cartón' },
    { patron: /CARTON/i, nombre: 'CARTON', categoria: 'Papel_y_Cartón' },
    { patron: /PAPEL/i, nombre: 'PAPEL', categoria: 'Papel_y_Cartón' },
    { patron: /METAL\s+FERROSO/i, nombre: 'METAL FERROSO', categoria: 'Metales' },
    { patron: /METAL/i, nombre: 'METAL', categoria: 'Metales' },
    { patron: /ALUMINIO/i, nombre: 'ALUMINIO', categoria: 'Metales' },
    { patron: /HOJALATA/i, nombre: 'HOJALATA', categoria: 'Metales' },
    { patron: /PLASTICO\s+MIXTO\s+PE/i, nombre: 'PLASTICO MIXTO PE', categoria: 'Plásticos_Flexibles' },
    { patron: /PLASTICO.*PE/i, nombre: 'PLASTICO PE', categoria: 'Plásticos_Flexibles' },
    { patron: /PLASTICO.*PET/i, nombre: 'PLASTICO PET', categoria: 'Plásticos_Rígidos' },
    { patron: /PLASTICO.*HDPE/i, nombre: 'PLASTICO HDPE', categoria: 'Plásticos_Rígidos' },
    { patron: /PLASTICO/i, nombre: 'PLASTICO', categoria: 'Plásticos_Flexibles' },
    { patron: /PET/i, nombre: 'PET', categoria: 'Plásticos_Rígidos' },
    { patron: /HDPE/i, nombre: 'HDPE', categoria: 'Plásticos_Rígidos' },
    { patron: /PP\s/i, nombre: 'PP', categoria: 'Plásticos_Rígidos' },
  ];

  // Extraer items usando el patrón específico de las facturas
  // Formato: MATERIAL\nPRECIO_TOTAL\nCODIGO\nCANTIDAD\nKG\nPRECIO_UNIT

  // Unir texto para buscar patrones más fácilmente
  const textoLimpio = text.replace(/\s+/g, ' ');

  // Patrones para cada tipo de material conocido
  const patronesItems = [
    {
      patron: /CARTON\s+OCC\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'CARTON OCC',
      categoria: 'Papel_y_Cartón'
    },
    {
      patron: /METAL\s+FERROSO\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'METAL FERROSO',
      categoria: 'Metales'
    },
    {
      patron: /PLASTICO\s+MIXTO\s+PE\s*\(GRANE\s*L?\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'PLASTICO MIXTO PE',
      categoria: 'Plásticos_Flexibles'
    },
    {
      patron: /PLASTICO\s+PET\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'PLASTICO PET',
      categoria: 'Plásticos_Rígidos'
    },
    {
      patron: /PLASTICO\s+HDPE\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'PLASTICO HDPE',
      categoria: 'Plásticos_Rígidos'
    },
    {
      patron: /PAPEL\s+BLANCO\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'PAPEL BLANCO',
      categoria: 'Papel_y_Cartón'
    },
    {
      patron: /ALUMINIO\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'ALUMINIO',
      categoria: 'Metales'
    },
    {
      patron: /HOJALATA\s*\(GRANEL\)\s*[\d.,]+\s*INT\d+\s*([\d.,]+)\s*KG/i,
      nombre: 'HOJALATA',
      categoria: 'Metales'
    }
  ];

  for (const item of patronesItems) {
    const match = textoLimpio.match(item.patron);
    if (match) {
      // Cantidad viene en formato "5.902,00" (miles con punto, decimales con coma)
      const cantidadStr = match[1];
      const cantidad = parseFloat(cantidadStr.replace(/\./g, '').replace(',', '.'));

      if (cantidad > 0) {
        result.items.push({
          descripcion: item.nombre,
          cantidad: cantidad,
          unidad: 'KG',
          subCategoria: item.categoria,
          toneladas: cantidad / 1000
        });
      }
    }
  }

  // Si no se encontraron items con los patrones específicos, buscar de forma más genérica
  if (result.items.length === 0) {
    const lineas = text.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();

      // Buscar materiales conocidos
      for (const mat of materialesConocidos) {
        if (mat.patron.test(linea)) {
          // Buscar cantidad en las siguientes líneas
          for (let j = i + 1; j < Math.min(i + 6, lineas.length); j++) {
            const lineaSig = lineas[j].trim();
            // Buscar patrón de cantidad seguido de KG
            const cantMatch = lineaSig.match(/^([\d.,]+)$/);
            if (cantMatch && lineas[j + 1] && lineas[j + 1].trim() === 'KG') {
              const cantidad = parseFloat(cantMatch[1].replace(/\./g, '').replace(',', '.'));
              if (cantidad > 0 && cantidad < 1000000) { // Sanity check
                result.items.push({
                  descripcion: mat.nombre,
                  cantidad: cantidad,
                  unidad: 'KG',
                  subCategoria: mat.categoria,
                  toneladas: cantidad / 1000
                });
                break;
              }
            }
          }
          break;
        }
      }
    }
  }

  // Extraer guías de referencia
  const guiasMatch = text.match(/GUIAS?:\s*([\d,\s]+)/i);
  if (guiasMatch) {
    result.guiasReferencia = guiasMatch[1]
      .split(/[,\s]+/)
      .filter(g => g.trim().length > 0)
      .map(g => g.trim());
  }

  return result;
}

/**
 * Convierte los datos parseados al formato de la plantilla de monitoring
 * @param {Object} parsedData - Datos parseados del PDF
 * @param {String} rutEmpresa - RUT de la empresa (COPEC)
 * @param {Number} idEstablecimiento - ID del establecimiento
 * @param {String} origen - 'LUB' o 'Bluemax'
 * @returns {Array} Array de registros para guardar
 */
function convertToMonitoringRecords(parsedData, rutEmpresa, idEstablecimiento, origen = 'LUB') {
  const records = [];

  if (!parsedData.fechaEmision) {
    throw new Error('No se pudo extraer la fecha del documento');
  }

  const mes = parsedData.fechaEmision.getMonth() + 1;
  const anio = parsedData.fechaEmision.getFullYear();
  const periodo = mesesNombres[mes];

  for (const item of parsedData.items) {
    records.push({
      rutEmpresa: rutEmpresa,
      idEstablecimientoEmpresa: idEstablecimiento,
      periodo: periodo,
      anio: anio,
      rutGestor: parsedData.rutGestor,
      nombreGestor: parsedData.nombreGestor,
      idEstablecimientoGestor: null,
      tipoDTE: parsedData.tipoDocumento,
      numeroDTE: parsedData.numeroDocumento,
      fechaDTE: parsedData.fechaEmision,
      subCategoria: item.subCategoria,
      materialidad: item.descripcion,
      toneladas: item.toneladas,
      origen: origen,
      archivoOriginal: null,
      guiasReferencia: parsedData.guiasReferencia
    });
  }

  return records;
}

module.exports = {
  parseFacturaPDF,
  convertToMonitoringRecords
};
