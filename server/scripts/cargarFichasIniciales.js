/**
 * Script para cargar las fichas iniciales con imágenes a S3
 *
 * Uso: node scripts/cargarFichasIniciales.js
 *
 * IMPORTANTE: Antes de ejecutar:
 * 1. Crear el bucket S3 en AWS Console
 * 2. Configurar las variables en .env:
 *    - AWS_S3_BUCKET
 *    - AWS_S3_REGION
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuración S3
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;

// Datos de las fichas a cargar
const FICHAS = [
  {
    sku: '106071',
    nombreComercial: 'Lubricante 1 Litro',
    categoria: 'Botella 1 litro Lub-Anticongelante',
    capacidad: '1L',
    archivoProducto: '106071.webp',
    archivoEnvase: 'Envase 106071.png'
  },
  {
    sku: '100122',
    nombreComercial: 'Lubricante Balde',
    categoria: 'Balde y Tapa Lub-Anticongelante',
    capacidad: '20L',
    archivoProducto: '100122.webp',
    archivoEnvase: 'Envase 100122.png'
  },
  {
    sku: '100244',
    nombreComercial: 'Lubricante Bins',
    categoria: 'Bins Lub-Agua-Anticongelante',
    capacidad: '1000L',
    archivoProducto: '100244.jpg',
    archivoEnvase: null // No disponible
  },
  {
    sku: '104745',
    nombreComercial: 'Agua 1 Litro',
    categoria: 'Botella 1 litro agua',
    capacidad: '1L',
    archivoProducto: '104745.png',
    archivoEnvase: 'Envase 104745.png'
  }
];

// Carpeta donde están las imágenes
const CARPETA_IMAGENES = path.join(__dirname, '../../planillas/FOTOS PRODUCTOS');

/**
 * Sube un archivo a S3
 */
async function subirArchivoS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: mimeTypes[ext] || 'image/jpeg'
  }));

  return `https://${BUCKET}.s3.${process.env.AWS_S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Función principal
 */
async function main() {
  console.log('=== Carga de Fichas Iniciales ===\n');

  // Verificar configuración
  if (!BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Error: Faltan variables de entorno de S3');
    console.log('   Configura en .env:');
    console.log('   - AWS_S3_BUCKET');
    console.log('   - AWS_S3_REGION');
    console.log('   - AWS_ACCESS_KEY_ID');
    console.log('   - AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  console.log(`✓ Bucket S3: ${BUCKET}`);
  console.log(`✓ Región: ${process.env.AWS_S3_REGION || 'us-east-1'}\n`);

  // Conectar a MongoDB
  console.log('Conectando a MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Conectado a MongoDB\n');

  // Cargar modelo
  const FichaProducto = require('../models/FichaProducto');

  // Procesar cada ficha
  for (const fichaData of FICHAS) {
    console.log(`\n--- Procesando SKU: ${fichaData.sku} ---`);

    let imagenProductoUrl = null;
    let imagenEnvaseUrl = null;

    // Subir imagen de producto
    if (fichaData.archivoProducto) {
      const rutaProducto = path.join(CARPETA_IMAGENES, fichaData.archivoProducto);
      if (fs.existsSync(rutaProducto)) {
        console.log(`  Subiendo imagen de producto: ${fichaData.archivoProducto}`);
        const key = `fichas/${fichaData.sku}/productos/${Date.now()}-producto${path.extname(fichaData.archivoProducto)}`;
        imagenProductoUrl = await subirArchivoS3(rutaProducto, key);
        console.log(`  ✓ Subida: ${imagenProductoUrl}`);
      } else {
        console.log(`  ⚠ No encontrada: ${fichaData.archivoProducto}`);
      }
    }

    // Subir imagen de envase
    if (fichaData.archivoEnvase) {
      const rutaEnvase = path.join(CARPETA_IMAGENES, fichaData.archivoEnvase);
      if (fs.existsSync(rutaEnvase)) {
        console.log(`  Subiendo imagen de envase: ${fichaData.archivoEnvase}`);
        const key = `fichas/${fichaData.sku}/envases/${Date.now()}-envase${path.extname(fichaData.archivoEnvase)}`;
        imagenEnvaseUrl = await subirArchivoS3(rutaEnvase, key);
        console.log(`  ✓ Subida: ${imagenEnvaseUrl}`);
      } else {
        console.log(`  ⚠ No encontrada: ${fichaData.archivoEnvase}`);
      }
    } else {
      console.log(`  ⚠ Sin imagen de envase definida`);
    }

    // Crear/actualizar ficha en MongoDB
    const fichaDoc = {
      sku: fichaData.sku,
      nombreComercial: fichaData.nombreComercial,
      categoria: fichaData.categoria,
      capacidad: fichaData.capacidad,
      tipoEnvase: fichaData.categoria,
      imagen: imagenProductoUrl, // Campo legacy
      imagenProducto: imagenProductoUrl,
      imagenEnvase: imagenEnvaseUrl,
      activo: true
    };

    await FichaProducto.findOneAndUpdate(
      { sku: fichaData.sku },
      fichaDoc,
      { upsert: true, new: true }
    );

    console.log(`  ✓ Ficha guardada en MongoDB`);
  }

  console.log('\n=== Carga completada ===');
  console.log(`Total fichas procesadas: ${FICHAS.length}`);

  await mongoose.disconnect();
  console.log('Desconectado de MongoDB');
}

// Ejecutar
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
