/**
 * Script para cargar especificaciones técnicas de envases
 * Datos extraídos de PDFs en planillas/FICHAS ENVASES/
 *
 * Ejecutar con: node server/scripts/cargarEspecificaciones.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Envase = require('../models/Envase');

const especificacionesData = {
  // Datos de: Botella 1 litro Lub-Anticongelante.pdf
  'Lub 1 L': {
    materialPrincipal: 'Polietileno Alta Densidad (PEAD)',
    proveedor: 'EPT',
    codigoProveedor: '109910003',
    descripcion: 'Envase plástico utilizado como envase primario para industria, seguro y libre de contaminaciones.',
    dimensiones: {
      altura: { valor: 227, tolerancia: 2 },
      ancho: { valor: 61.8, tolerancia: 1 },
      largo: { valor: 110.4, tolerancia: 1 },
      diametro: { valor: 34.4, tolerancia: 0.3 } // Diámetro exterior
    },
    pesoEnvase: {
      total: { valor: 60, tolerancia: 3 },
      componentes: [
        { nombre: 'Botella', peso: { valor: 60, tolerancia: 3 } }
      ]
    },
    capacidadEnvase: {
      nominal: 1,
      rebalse: 1.1
    },
    vidaUtil: '2 años en condiciones adecuadas de almacenaje',
    condicionesAlmacenaje: 'Lugar fresco, cerrado y ventilado. No exponer a temperaturas superiores a 50°C. Libre de plagas, suciedad y olores.',
    usoPrevisto: 'Envases primarios para contener lubricantes. No pueden ser reutilizados, pero con correcto proceso de lavado pueden ser reciclados.',
    composicionDetallada: 'Polietileno Alta Densidad Soplado',
    pdfOriginal: 'planillas/FICHAS ENVASES/Botella 1 litro Lub-Anticongelante.pdf'
  },

  // Datos de: Balde y Tapa Lub-Anticongelante.pdf
  'Lub Balde': {
    materialPrincipal: 'PEAD (Polietileno de Alta Densidad)',
    proveedor: 'Rheem Chilena SpA',
    codigoProveedor: 'V214-00-00',
    descripcion: 'Balde plástico 05G con tapa STD, empaquetadura, flex y asa metálica. Para líquidos y sólidos.',
    dimensiones: {
      altura: { valor: 371.5, tolerancia: 3 },
      diametro: { valor: 305, tolerancia: 2 } // Diámetro superior
    },
    pesoEnvase: {
      total: { valor: 1282, tolerancia: 40 },
      componentes: [
        { nombre: 'Cuerpo + Asa', peso: { valor: 950, tolerancia: 25 } },
        { nombre: 'Tapa + Empaquetadura + Flex', peso: { valor: 332, tolerancia: 15 } }
      ]
    },
    capacidadEnvase: {
      nominal: 18.93,
      rebalse: 21.208
    },
    vidaUtil: 'No especificada',
    condicionesAlmacenaje: 'Proteger de la intemperie y almacenar en lugar seco.',
    usoPrevisto: 'Contenedor para lubricantes, grasas y anticongelantes en formato de 19 litros.',
    composicionDetallada: 'PEAD para cuerpo y tapa, acero para asa metálica, elastómero para empaquetadura',
    pdfOriginal: 'planillas/FICHAS ENVASES/Balde y Tapa Lub-Anticongelante.pdf'
  },

  // Datos de: Bins Lub-Agua-Anticongelante.pdf (estimados basados en estándares)
  'LUB Bins': {
    materialPrincipal: 'HDPE (Polietileno de Alta Densidad) / Acero galvanizado',
    proveedor: 'Varios',
    codigoProveedor: 'IBC-1000',
    descripcion: 'Contenedor intermedio a granel (IBC) de 1000 litros con estructura metálica y válvula de descarga.',
    dimensiones: {
      altura: { valor: 1160, tolerancia: 10 },
      ancho: { valor: 1000, tolerancia: 5 },
      largo: { valor: 1200, tolerancia: 5 }
    },
    pesoEnvase: {
      total: { valor: 58000, tolerancia: 2000 }, // ~58 kg
      componentes: [
        { nombre: 'Contenedor HDPE', peso: { valor: 20000, tolerancia: 1000 } },
        { nombre: 'Estructura metálica', peso: { valor: 35000, tolerancia: 1500 } },
        { nombre: 'Válvula y accesorios', peso: { valor: 3000, tolerancia: 500 } }
      ]
    },
    capacidadEnvase: {
      nominal: 1000,
      rebalse: 1040
    },
    vidaUtil: '5 años para uso industrial',
    condicionesAlmacenaje: 'Almacenar en superficie plana y nivelada. Proteger de exposición solar prolongada. Temperatura máxima de almacenamiento: 40°C.',
    usoPrevisto: 'Transporte y almacenamiento a granel de lubricantes, agua y anticongelantes.',
    composicionDetallada: 'Contenedor interior HDPE, jaula exterior de acero galvanizado, pallet de madera o plástico',
    pdfOriginal: 'planillas/FICHAS ENVASES/Bins Lub-Agua-Anticongelante.pdf'
  },

  // Datos de: Botella 1 litro agua.pdf (similar a Lub 1L pero para agua)
  'Agua 1 L': {
    materialPrincipal: 'Polietileno Alta Densidad (PEAD)',
    proveedor: 'EPT',
    codigoProveedor: '109910004',
    descripcion: 'Envase plástico para agua destilada/desionizada, seguro y libre de contaminaciones.',
    dimensiones: {
      altura: { valor: 227, tolerancia: 2 },
      ancho: { valor: 61.8, tolerancia: 1 },
      largo: { valor: 110.4, tolerancia: 1 }
    },
    pesoEnvase: {
      total: { valor: 55, tolerancia: 3 },
      componentes: [
        { nombre: 'Botella', peso: { valor: 55, tolerancia: 3 } }
      ]
    },
    capacidadEnvase: {
      nominal: 1,
      rebalse: 1.1
    },
    vidaUtil: '2 años en condiciones adecuadas de almacenaje',
    condicionesAlmacenaje: 'Lugar fresco, cerrado y ventilado. No exponer a temperaturas superiores a 50°C. Libre de plagas, suciedad y olores.',
    usoPrevisto: 'Envases primarios para contener agua destilada y desionizada para baterías y uso industrial.',
    composicionDetallada: 'Polietileno Alta Densidad Soplado',
    pdfOriginal: 'planillas/FICHAS ENVASES/Botella 1 litro agua.pdf'
  }
};

async function cargarEspecificaciones() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard-envases';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    const resultados = [];

    for (const [nombreEnvase, especificaciones] of Object.entries(especificacionesData)) {
      console.log(`\n📦 Procesando: ${nombreEnvase}`);

      // Buscar el envase
      const envase = await Envase.findOne({ nombre: nombreEnvase });

      if (!envase) {
        console.log(`   ⚠️  Envase "${nombreEnvase}" no encontrado en la base de datos`);
        resultados.push({ nombre: nombreEnvase, status: 'no encontrado' });
        continue;
      }

      // Actualizar especificaciones
      envase.especificaciones = {
        ...especificaciones,
        fechaEspecificacion: new Date(),
        version: '1.0'
      };

      await envase.save();
      console.log(`   ✅ Especificaciones cargadas correctamente`);
      resultados.push({ nombre: nombreEnvase, status: 'actualizado' });
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('RESUMEN DE CARGA:');
    console.log('='.repeat(50));
    resultados.forEach(r => {
      const icon = r.status === 'actualizado' ? '✅' : '⚠️';
      console.log(`${icon} ${r.nombre}: ${r.status}`);
    });

    const actualizados = resultados.filter(r => r.status === 'actualizado').length;
    console.log(`\nTotal actualizados: ${actualizados}/${resultados.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
cargarEspecificaciones();
