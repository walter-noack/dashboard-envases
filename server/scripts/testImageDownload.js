/**
 * Test de descarga y conversión de imágenes WebP
 */
const https = require('https');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'https://copec-dashboard-envases-images.s3.eu-west-2.amazonaws.com/fichas/106071/productos/1770330337770-producto.webp';

const descargarImagen = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : require('http');

    console.log(`Descargando: ${url}`);

    protocol.get(url, (response) => {
      // Manejar redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`Redirect a: ${response.headers.location}`);
        descargarImagen(response.headers.location).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Error descargando imagen: HTTP ${response.statusCode}`);
        resolve(null);
        return;
      }

      console.log(`Content-Type: ${response.headers['content-type']}`);

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          let buffer = Buffer.concat(chunks);
          console.log(`Buffer original: ${buffer.length} bytes`);

          // Detectar si es WebP y convertir a PNG
          const esWebP = url.toLowerCase().includes('.webp') ||
              response.headers['content-type']?.includes('webp');

          console.log(`¿Es WebP? ${esWebP}`);

          if (esWebP) {
            console.log('Convirtiendo WebP a PNG...');
            buffer = await sharp(buffer).png().toBuffer();
            console.log(`Buffer convertido: ${buffer.length} bytes`);
          }

          resolve(buffer);
        } catch (error) {
          console.error('Error procesando imagen:', error.message);
          resolve(null);
        }
      });
      response.on('error', (err) => {
        console.error('Error en response:', err.message);
        resolve(null);
      });
    }).on('error', (err) => {
      console.error('Error en request:', err.message);
      resolve(null);
    });
  });
};

async function test() {
  console.log('=== Test de descarga y conversión de imagen ===\n');

  const buffer = await descargarImagen(TEST_URL);

  if (buffer) {
    console.log('\n✓ Imagen descargada y convertida exitosamente');
    console.log(`Tamaño final: ${buffer.length} bytes`);

    // Guardar para verificar
    const outputPath = path.join(__dirname, 'test-output.png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`\nImagen guardada en: ${outputPath}`);
    console.log('Puedes abrirla para verificar que se ve correctamente.');
  } else {
    console.log('\n❌ Error: No se pudo descargar/convertir la imagen');
  }
}

test();
