const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Sharp se carga de forma diferida para evitar errores en Lambda cold start
let sharp = null;
const getSharp = () => {
  if (!sharp) {
    try {
      sharp = require('sharp');
    } catch (e) {
      console.warn('Sharp no disponible, las imágenes WebP no serán convertidas:', e.message);
      sharp = null;
    }
  }
  return sharp;
};

const LOGO_PATH = path.join(__dirname, '../../client/public/logocopec.png');

/**
 * Descarga una imagen desde una URL y retorna el buffer
 * Convierte WebP a PNG para compatibilidad con PDFKit
 * @param {string} url - URL de la imagen
 * @returns {Promise<Buffer|null>}
 */
const descargarImagen = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      // Manejar redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        descargarImagen(response.headers.location).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`Error descargando imagen: HTTP ${response.statusCode}`);
        resolve(null);
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          let buffer = Buffer.concat(chunks);

          // Detectar si es WebP y convertir a PNG
          if (url.toLowerCase().includes('.webp') ||
              response.headers['content-type']?.includes('webp')) {
            const sharpLib = getSharp();
            if (sharpLib) {
              buffer = await sharpLib(buffer).png().toBuffer();
            }
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

const generarFichaPDF = async (fichaData) => {
  // Pre-descargar imágenes de S3
  let imagenProductoBuffer = null;
  let imagenEnvaseBuffer = null;

  // Intentar descargar imagen de producto
  if (fichaData.imagenProducto) {
    imagenProductoBuffer = await descargarImagen(fichaData.imagenProducto);
  } else if (fichaData.imagenPath && fs.existsSync(fichaData.imagenPath)) {
    // Fallback a imagen local si existe
    try {
      let buffer = fs.readFileSync(fichaData.imagenPath);
      if (fichaData.imagenPath.toLowerCase().includes('.webp')) {
        const sharpLib = getSharp();
        if (sharpLib) {
          buffer = await sharpLib(buffer).png().toBuffer();
        }
      }
      imagenProductoBuffer = buffer;
    } catch (e) {
      console.error('Error leyendo imagen local:', e.message);
    }
  }

  // Intentar descargar imagen de envase
  if (fichaData.imagenEnvase) {
    imagenEnvaseBuffer = await descargarImagen(fichaData.imagenEnvase);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
        bufferPages: true // Permitir manipulación de páginas
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // margins

      // === HEADER CON LOGO ===
      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, 50, 40, { width: 100 });
      }

      // Título más destacado
      doc.fontSize(24)
         .fillColor('#1e3a5f')
         .font('Helvetica-Bold')
         .text('FICHA TÉCNICA', 200, 45, { align: 'center' })
         .fontSize(16)
         .fillColor('#64748b')
         .font('Helvetica')
         .text('DE PRODUCTO', 200, 72, { align: 'center' });

      doc.moveTo(50, 105).lineTo(545, 105).stroke('#e2e8f0');

      // === INFORMACIÓN DEL PRODUCTO ===
      let y = 120;

      doc.fontSize(11).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('INFORMACIÓN DEL PRODUCTO', 50, y);
      y += 20;

      doc.font('Helvetica').fillColor('#334155').fontSize(10);

      // Información básica
      const infoItems = [
        ['SKU', fichaData.sku],
        ['Nombre Comercial', fichaData.nombreComercial],
        ['Categoría', fichaData.categoria],
        ['Capacidad', fichaData.capacidad || 'N/A'],
        ['Tipo de Envase', fichaData.tipoEnvase || fichaData.categoria]
      ];

      infoItems.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(`${label}:`, 50, y, { continued: true });
        doc.font('Helvetica').text(` ${value}`, { continued: false });
        y += 15;
      });

      // === IMÁGENES DEL PRODUCTO Y ENVASE ===
      const imgStartX = 360;
      const imgWidth = 95;
      const imgHeight = 95;
      const imgY = 120;

      // Imagen de Producto
      doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold');
      doc.text('PRODUCTO', imgStartX, imgY - 12, { width: imgWidth, align: 'center' });

      if (imagenProductoBuffer) {
        try {
          doc.image(imagenProductoBuffer, imgStartX, imgY, {
            width: imgWidth,
            height: imgHeight,
            fit: [imgWidth, imgHeight],
            align: 'center',
            valign: 'center'
          });
        } catch (e) {
          console.error('Error insertando imagen producto:', e.message);
          doc.rect(imgStartX, imgY, imgWidth, imgHeight).stroke('#e2e8f0');
          doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
          doc.text('Error imagen', imgStartX, imgY + 40, { width: imgWidth, align: 'center' });
        }
      } else {
        doc.rect(imgStartX, imgY, imgWidth, imgHeight).stroke('#e2e8f0');
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
        doc.text('Sin imagen', imgStartX, imgY + 40, { width: imgWidth, align: 'center' });
      }

      // Imagen de Envase
      const imgEnvaseX = imgStartX + imgWidth + 10;
      doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold');
      doc.text('ENVASE', imgEnvaseX, imgY - 12, { width: imgWidth, align: 'center' });

      if (imagenEnvaseBuffer) {
        try {
          doc.image(imagenEnvaseBuffer, imgEnvaseX, imgY, {
            width: imgWidth,
            height: imgHeight,
            fit: [imgWidth, imgHeight],
            align: 'center',
            valign: 'center'
          });
        } catch (e) {
          console.error('Error insertando imagen envase:', e.message);
          doc.rect(imgEnvaseX, imgY, imgWidth, imgHeight).stroke('#e2e8f0');
          doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
          doc.text('Error imagen', imgEnvaseX, imgY + 40, { width: imgWidth, align: 'center' });
        }
      } else {
        doc.rect(imgEnvaseX, imgY, imgWidth, imgHeight).stroke('#e2e8f0');
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
        doc.text('Sin imagen', imgEnvaseX, imgY + 40, { width: imgWidth, align: 'center' });
      }

      y = Math.max(y, imgY + imgHeight + 15);
      doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
      y += 12;

      // === COMPOSICIÓN DE RESIDUOS ===
      doc.fontSize(11).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('COMPOSICIÓN DE RESIDUOS', 50, y);
      y += 18;

      if (fichaData.componentes && fichaData.componentes.length > 0) {
        // Header de tabla
        const colWidths = [80, 150, 55, 55, 100];
        const headers = ['Componente', 'Material', 'Peso (g)', 'Código', 'Categoría'];

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e3a5f');
        let x = 50;
        headers.forEach((header, i) => {
          doc.text(header, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });

        y += 11;
        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 4;

        // Filas de datos
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        fichaData.componentes.forEach((comp, index) => {
          // Fondo alternado
          if (index % 2 === 0) {
            doc.rect(50, y - 2, 495, 13).fill('#f8fafc');
            doc.fillColor('#334155');
          }

          x = 50;
          const rowData = [
            comp.nombre || '-',
            comp.material || '-',
            comp.pesoGramos?.toString() || '0',
            comp.codigoClasificacion || '-',
            comp.categoria || '-'
          ];

          rowData.forEach((cell, i) => {
            let displayText = cell;
            if (cell.length > 28 && i === 1) {
              displayText = cell.substring(0, 25) + '...';
            }
            doc.text(displayText, x + 2, y, { width: colWidths[i] - 4 });
            x += colWidths[i];
          });

          y += 13;
        });

        y += 5;
        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 12;
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#64748b');
        doc.text('Sin información de composición disponible', 50, y);
        y += 20;
      }

      // === CLASIFICACIÓN ===
      doc.fontSize(11).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('CLASIFICACIÓN', 50, y);
      y += 18;

      const resumen = fichaData.resumen || {};

      // Badges
      const peligrosoColor = resumen.esPeligroso ? '#dc2626' : '#16a34a';
      const peligrosoText = resumen.esPeligroso ? 'PELIGROSO' : 'NO PELIGROSO';
      doc.roundedRect(50, y, 105, 20, 4).fill(peligrosoColor);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
      doc.text(peligrosoText, 52, y + 5, { width: 101, align: 'center' });

      const domiciliario = resumen.domiciliario || 'NO DOMICILIARIO';
      const domColor = domiciliario === 'DOMICILIARIO' ? '#d97706' : '#4f46e5';
      doc.roundedRect(165, y, 125, 20, 4).fill(domColor);
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
      doc.text(domiciliario, 167, y + 5, { width: 121, align: 'center' });

      y += 30;

      // Peso total
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
      doc.text(`Peso Total de Residuos: `, 50, y, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#1e3a5f');
      const pesoKg = (resumen.pesoTotalGramos || 0) / 1000;
      doc.text(`${resumen.pesoTotalGramos || 0} g (${pesoKg.toFixed(3)} kg)`);

      y += 18;

      // === ESPECIFICACIONES DEL ENVASE ===
      if (fichaData.especificacionesEnvase) {
        const esp = fichaData.especificacionesEnvase;

        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 10;

        doc.fontSize(11).fillColor('#1e3a5f').font('Helvetica-Bold');
        doc.text('ESPECIFICACIONES TÉCNICAS DEL ENVASE', 50, y);
        y += 16;

        doc.font('Helvetica').fontSize(8).fillColor('#334155');

        const especItems = [];
        if (esp.materialPrincipal) especItems.push(['Material', esp.materialPrincipal]);
        if (esp.proveedor) especItems.push(['Proveedor', esp.proveedor]);
        if (esp.codigoProveedor) especItems.push(['Código', esp.codigoProveedor]);

        if (esp.dimensiones) {
          const dim = esp.dimensiones;
          if (dim.altura?.valor) {
            const tol = dim.altura.tolerancia ? ` ± ${dim.altura.tolerancia}` : '';
            especItems.push(['Altura', `${dim.altura.valor}${tol} mm`]);
          }
          if (dim.diametro?.valor) {
            const tol = dim.diametro.tolerancia ? ` ± ${dim.diametro.tolerancia}` : '';
            especItems.push(['Diámetro', `${dim.diametro.valor}${tol} mm`]);
          }
          if (dim.ancho?.valor) {
            const tol = dim.ancho.tolerancia ? ` ± ${dim.ancho.tolerancia}` : '';
            especItems.push(['Ancho', `${dim.ancho.valor}${tol} mm`]);
          }
          if (dim.largo?.valor) {
            const tol = dim.largo.tolerancia ? ` ± ${dim.largo.tolerancia}` : '';
            especItems.push(['Largo', `${dim.largo.valor}${tol} mm`]);
          }
        }

        if (esp.pesoEnvase?.total?.valor) {
          const tol = esp.pesoEnvase.total.tolerancia ? ` ± ${esp.pesoEnvase.total.tolerancia}` : '';
          especItems.push(['Peso Envase', `${esp.pesoEnvase.total.valor}${tol} g`]);
        }

        if (esp.capacidadEnvase) {
          if (esp.capacidadEnvase.nominal) especItems.push(['Cap. Nominal', `${esp.capacidadEnvase.nominal} L`]);
          if (esp.capacidadEnvase.rebalse) especItems.push(['Cap. Rebalse', `${esp.capacidadEnvase.rebalse} L`]);
        }

        if (esp.vidaUtil) especItems.push(['Vida Útil', esp.vidaUtil]);

        // Renderizar en 2 columnas compactas
        const midPoint = Math.ceil(especItems.length / 2);
        const col1Items = especItems.slice(0, midPoint);
        const col2Items = especItems.slice(midPoint);

        const startY = y;
        col1Items.forEach(([label, value]) => {
          doc.font('Helvetica-Bold').text(`${label}:`, 50, y, { continued: true, width: 180 });
          doc.font('Helvetica').text(` ${value}`, { continued: false });
          y += 11;
        });

        let y2 = startY;
        col2Items.forEach(([label, value]) => {
          doc.font('Helvetica-Bold').text(`${label}:`, 280, y2, { continued: true, width: 180 });
          doc.font('Helvetica').text(` ${value}`, { continued: false });
          y2 += 11;
        });

        y = Math.max(y, y2) + 5;
      }

      // === FOOTER (en la misma página) ===
      y += 10;
      doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
      y += 8;

      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
      const fecha = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.text(`Fecha de generación: ${fecha}`, 50, y);
      doc.text('Documento generado automáticamente - Dashboard de Residuos COPEC', 50, y + 40, {
        align: 'center',
        width: pageWidth
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generarFichaPDF };
