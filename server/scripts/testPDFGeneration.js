/**
 * Test de generación de PDF
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { generarFichaPDF } = require('../utils/pdfGenerator');

const MONGODB_URI = process.env.MONGODB_URI;

// Schemas inline
const fichaSchema = new mongoose.Schema({
  sku: String,
  nombreComercial: String,
  imagenProducto: String,
  imagenEnvase: String,
  imagen: String,
  categoria: String,
  capacidad: String
}, { collection: 'fichaproductos' });

const envaseSchema = new mongoose.Schema({
  nombre: String,
  componentes: Array,
  especificaciones: Object
}, { collection: 'envases' });

const ventaSchema = new mongoose.Schema({
  material: String,
  materialNombre: String,
  envase: String
}, { collection: 'ventas' });

const FichaProducto = mongoose.model('FichaProducto', fichaSchema);
const Envase = mongoose.model('Envase', envaseSchema);
const Venta = mongoose.model('Venta', ventaSchema);

const mapeoSKU = require('../config/mapeoSKU.json');

async function testPDF() {
  const sku = '106071';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generando PDF para SKU: ${sku}`);
  console.log('='.repeat(60) + '\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Obtener datos
  const ventaInfo = await Venta.findOne({ material: sku });
  const ficha = await FichaProducto.findOne({ sku });
  const mapeoInfo = mapeoSKU.mapeoSKU[sku] || null;
  const categoria = mapeoInfo?.categoria || ventaInfo?.envase || 'Sin categoria';

  console.log(`Venta info: ${ventaInfo?.materialNombre}`);
  console.log(`Categoria: ${categoria}`);

  const envase = await Envase.findOne({ nombre: categoria });
  const componentes = envase?.componentes || [];

  console.log(`Componentes encontrados: ${componentes.length}`);

  // Calcular resumen
  let pesoTotal = 0;
  let esPeligroso = false;
  let domiciliario = 'NO DOMICILIARIO';

  componentes.forEach(comp => {
    pesoTotal += comp.pesoGramos || 0;
    if (comp.peligrosidad === 'PELIGROSO') esPeligroso = true;
    if (comp.domiciliario) domiciliario = comp.domiciliario;
  });

  // Datos para PDF
  const fichaData = {
    sku,
    nombreComercial: ficha?.nombreComercial || ventaInfo?.materialNombre || sku,
    categoria,
    capacidad: mapeoInfo?.capacidad || ficha?.capacidad || null,
    tipoEnvase: categoria,
    componentes,
    resumen: {
      pesoTotalGramos: pesoTotal,
      esPeligroso,
      domiciliario
    },
    imagenProducto: ficha?.imagenProducto || null,
    imagenEnvase: ficha?.imagenEnvase || null,
    imagenPath: null,
    especificacionesEnvase: envase?.especificaciones || null
  };

  console.log(`\nDatos del PDF:`);
  console.log(`  Nombre Comercial: ${fichaData.nombreComercial}`);
  console.log(`  Imagen Producto: ${fichaData.imagenProducto || 'NO DEFINIDA'}`);
  console.log(`  Imagen Envase: ${fichaData.imagenEnvase || 'NO DEFINIDA'}`);
  console.log(`  Componentes: ${componentes.length}`);
  console.log(`  Peso Total: ${pesoTotal}g`);

  console.log('\nGenerando PDF...');

  try {
    const pdfBuffer = await generarFichaPDF(fichaData);

    const outputPath = path.join(__dirname, `test-ficha_${sku}.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`\n✓ PDF generado exitosamente`);
    console.log(`  Tamaño: ${pdfBuffer.length} bytes`);
    console.log(`  Guardado en: ${outputPath}`);
    console.log(`\nAbre el archivo para verificar que las imágenes se muestran correctamente.`);
  } catch (error) {
    console.error('\n❌ Error generando PDF:', error);
  }

  await mongoose.disconnect();
}

testPDF();
