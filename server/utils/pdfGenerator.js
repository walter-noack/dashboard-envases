const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '../../client/public/logocopec.png');

const generarFichaPDF = async (fichaData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 }
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

      doc.fontSize(20)
         .fillColor('#1e3a5f')
         .text('FICHA TÉCNICA', 200, 50, { align: 'center' })
         .fontSize(14)
         .fillColor('#64748b')
         .text('DE PRODUCTO', 200, 75, { align: 'center' });

      doc.moveTo(50, 110).lineTo(545, 110).stroke('#e2e8f0');

      // === INFORMACIÓN DEL PRODUCTO ===
      let y = 130;

      doc.fontSize(12).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('INFORMACIÓN DEL PRODUCTO', 50, y);
      y += 25;

      doc.font('Helvetica').fillColor('#334155').fontSize(10);

      // Tabla de información básica
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
        y += 18;
      });

      // === IMAGEN DEL PRODUCTO (si existe) ===
      if (fichaData.imagenPath && fs.existsSync(fichaData.imagenPath)) {
        doc.image(fichaData.imagenPath, 400, 130, { width: 120, height: 120, fit: [120, 120] });
      } else {
        // Placeholder
        doc.rect(400, 130, 120, 120).stroke('#e2e8f0');
        doc.fontSize(8).fillColor('#94a3b8').text('Sin imagen', 430, 185);
      }

      y = Math.max(y, 270);
      doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
      y += 20;

      // === COMPOSICIÓN DE RESIDUOS ===
      doc.fontSize(12).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('COMPOSICIÓN DE RESIDUOS', 50, y);
      y += 25;

      if (fichaData.componentes && fichaData.componentes.length > 0) {
        // Header de tabla
        const colWidths = [120, 80, 70, 80, 90];
        const headers = ['Componente', 'Material', 'Peso (g)', 'Código', 'Categoría'];

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e3a5f');
        let x = 50;
        headers.forEach((header, i) => {
          doc.text(header, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });

        y += 15;
        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 8;

        // Filas de datos
        doc.font('Helvetica').fontSize(9).fillColor('#334155');
        fichaData.componentes.forEach((comp, index) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          // Fondo alternado
          if (index % 2 === 0) {
            doc.rect(50, y - 3, 495, 18).fill('#f8fafc');
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
            doc.text(cell, x + 2, y, { width: colWidths[i] - 4 });
            x += colWidths[i];
          });

          y += 18;
        });

        y += 10;
        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 20;
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#64748b');
        doc.text('Sin información de composición disponible', 50, y);
        y += 30;
      }

      // === CLASIFICACIÓN ===
      doc.fontSize(12).fillColor('#1e3a5f').font('Helvetica-Bold');
      doc.text('CLASIFICACIÓN', 50, y);
      y += 25;

      // Badges de clasificación
      const resumen = fichaData.resumen || {};

      // Peligrosidad
      const peligrosoColor = resumen.esPeligroso ? '#dc2626' : '#16a34a';
      const peligrosoText = resumen.esPeligroso ? 'PELIGROSO' : 'NO PELIGROSO';
      doc.roundedRect(50, y, 120, 25, 5).fill(peligrosoColor);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
      doc.text(peligrosoText, 55, y + 7, { width: 110, align: 'center' });

      // Domiciliario
      const domiciliario = resumen.domiciliario || 'NO DOMICILIARIO';
      const domColor = domiciliario === 'DOMICILIARIO' ? '#d97706' : '#4f46e5';
      doc.roundedRect(180, y, 140, 25, 5).fill(domColor);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
      doc.text(domiciliario, 185, y + 7, { width: 130, align: 'center' });

      y += 40;

      // Peso total
      doc.font('Helvetica').fontSize(10).fillColor('#334155');
      doc.text(`Peso Total de Residuos: `, 50, y, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#1e3a5f');
      const pesoKg = (resumen.pesoTotalGramos || 0) / 1000;
      doc.text(`${resumen.pesoTotalGramos || 0} g (${pesoKg.toFixed(3)} kg)`);

      y += 30;

      // === ESPECIFICACIONES DEL ENVASE (si existen) ===
      if (fichaData.especificacionesEnvase) {
        const esp = fichaData.especificacionesEnvase;

        // Verificar si necesitamos nueva página
        if (y > 550) {
          doc.addPage();
          y = 50;
        }

        doc.moveTo(50, y).lineTo(545, y).stroke('#e2e8f0');
        y += 20;

        doc.fontSize(12).fillColor('#1e3a5f').font('Helvetica-Bold');
        doc.text('ESPECIFICACIONES TÉCNICAS DEL ENVASE', 50, y);
        y += 25;

        // Imagen técnica del envase (si existe)
        let imageY = y;
        const imagenTecnicaPath = esp.imagenTecnica
          ? path.join(__dirname, '../../client/public', esp.imagenTecnica)
          : null;

        if (imagenTecnicaPath && fs.existsSync(imagenTecnicaPath)) {
          doc.image(imagenTecnicaPath, 380, y, { width: 140, height: 140, fit: [140, 140] });
        }

        // Información de especificaciones
        doc.font('Helvetica').fontSize(9).fillColor('#334155');

        const especItems = [];

        if (esp.materialPrincipal) {
          especItems.push(['Material', esp.materialPrincipal]);
        }
        if (esp.proveedor) {
          especItems.push(['Proveedor', esp.proveedor]);
        }
        if (esp.codigoProveedor) {
          especItems.push(['Código Proveedor', esp.codigoProveedor]);
        }

        // Dimensiones
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

        // Peso del envase
        if (esp.pesoEnvase?.total?.valor) {
          const tol = esp.pesoEnvase.total.tolerancia ? ` ± ${esp.pesoEnvase.total.tolerancia}` : '';
          especItems.push(['Peso Envase', `${esp.pesoEnvase.total.valor}${tol} g`]);
        }

        // Capacidad
        if (esp.capacidadEnvase) {
          if (esp.capacidadEnvase.nominal) {
            especItems.push(['Capacidad Nominal', `${esp.capacidadEnvase.nominal} L`]);
          }
          if (esp.capacidadEnvase.rebalse) {
            especItems.push(['Capacidad Rebalse', `${esp.capacidadEnvase.rebalse} L`]);
          }
        }

        if (esp.vidaUtil) {
          especItems.push(['Vida Útil', esp.vidaUtil]);
        }

        // Renderizar items
        especItems.forEach(([label, value]) => {
          doc.font('Helvetica-Bold').text(`${label}:`, 50, y, { continued: true, width: 300 });
          doc.font('Helvetica').text(` ${value}`, { continued: false });
          y += 15;
        });

        // Condiciones de almacenaje (si hay espacio)
        if (esp.condicionesAlmacenaje && y < 650) {
          y += 10;
          doc.font('Helvetica-Bold').fontSize(9).text('Condiciones de Almacenaje:', 50, y);
          y += 12;
          doc.font('Helvetica').fontSize(8).fillColor('#64748b');
          doc.text(esp.condicionesAlmacenaje, 50, y, { width: 300 });
          y += 30;
        }

        y = Math.max(y, imageY + 150);
      }

      // === FOOTER ===
      const footerY = doc.page.height - 60;
      doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e2e8f0');

      doc.fontSize(8).fillColor('#94a3b8').font('Helvetica');
      const fecha = new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      doc.text(`Fecha de generación: ${fecha}`, 50, footerY + 10);
      doc.text('Documento generado automáticamente - Dashboard de Residuos COPEC', 50, footerY + 22, {
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
