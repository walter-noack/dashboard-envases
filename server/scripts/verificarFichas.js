/**
 * Script para verificar el estado de las fichas y sus imágenes
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

const MONGODB_URI = process.env.MONGODB_URI;

// Definir schema inline para evitar dependencias
const fichaSchema = new mongoose.Schema({
  sku: String,
  nombreComercial: String,
  imagenProducto: String,
  imagenEnvase: String,
  imagen: String
}, { collection: 'fichaproductos' });

const FichaProducto = mongoose.model('FichaProducto', fichaSchema);

const verificarURL = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ accesible: false, error: 'URL vacía' });
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (response) => {
      resolve({
        accesible: response.statusCode === 200,
        status: response.statusCode,
        contentType: response.headers['content-type']
      });
      response.destroy();
    });

    req.on('error', (err) => {
      resolve({ accesible: false, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ accesible: false, error: 'Timeout' });
    });
  });
};

async function verificar() {
  console.log('Conectando a MongoDB...\n');
  await mongoose.connect(MONGODB_URI);

  const skus = ['106071', '100122', '100244', '104745'];

  for (const sku of skus) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SKU: ${sku}`);
    console.log('='.repeat(60));

    const ficha = await FichaProducto.findOne({ sku });

    if (!ficha) {
      console.log('❌ Ficha NO encontrada en MongoDB');
      continue;
    }

    console.log(`✓ Nombre Comercial: ${ficha.nombreComercial || 'NO DEFINIDO'}`);

    // Verificar imagen de producto
    console.log(`\nImagen Producto: ${ficha.imagenProducto || 'NO DEFINIDA'}`);
    if (ficha.imagenProducto) {
      const check = await verificarURL(ficha.imagenProducto);
      if (check.accesible) {
        console.log(`  ✓ Accesible - Content-Type: ${check.contentType}`);
      } else {
        console.log(`  ❌ No accesible - ${check.error || `Status: ${check.status}`}`);
      }
    }

    // Verificar imagen de envase
    console.log(`\nImagen Envase: ${ficha.imagenEnvase || 'NO DEFINIDA'}`);
    if (ficha.imagenEnvase) {
      const check = await verificarURL(ficha.imagenEnvase);
      if (check.accesible) {
        console.log(`  ✓ Accesible - Content-Type: ${check.contentType}`);
      } else {
        console.log(`  ❌ No accesible - ${check.error || `Status: ${check.status}`}`);
      }
    }

    // Campo legacy
    if (ficha.imagen) {
      console.log(`\nImagen (legacy): ${ficha.imagen}`);
    }
  }

  console.log('\n\nVerificación completa.');
  await mongoose.disconnect();
}

verificar().catch(console.error);
