const mongoose = require('mongoose');

const monitoringSchema = new mongoose.Schema({
  // Datos empresa productora
  rutEmpresa: {
    type: String,
    required: true
  },
  idEstablecimientoEmpresa: {
    type: Number,
    default: null
  },

  // Período
  periodo: {
    type: String,
    required: true,
    enum: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  },
  anio: {
    type: Number,
    required: true
  },

  // Datos gestor
  rutGestor: {
    type: String,
    required: true
  },
  nombreGestor: {
    type: String,
    default: null
  },
  idEstablecimientoGestor: {
    type: Number,
    default: null
  },

  // Documento tributario
  tipoDTE: {
    type: String,
    required: true,
    enum: ['Factura Electrónica', 'Guía de Despacho']
  },
  numeroDTE: {
    type: Number,
    required: true
  },
  fechaDTE: {
    type: Date,
    required: true
  },

  // Clasificación residuo
  subCategoria: {
    type: String,
    required: true,
    enum: ['Papel_y_Cartón', 'Plásticos_Flexibles', 'Plásticos_Rígidos', 'Metales']
  },
  materialidad: {
    type: String,
    required: true
  },

  // Cantidad
  toneladas: {
    type: Number,
    required: true
  },

  // Origen del registro (LUB o Bluemax)
  origen: {
    type: String,
    required: true,
    enum: ['LUB', 'Bluemax'],
    default: 'LUB'
  },

  // Metadatos
  archivoOriginal: {
    type: String,
    default: null
  },
  guiasReferencia: [{
    type: String
  }]
}, {
  timestamps: true
});

// Índices para consultas eficientes
monitoringSchema.index({ anio: 1, periodo: 1 });
monitoringSchema.index({ rutGestor: 1 });
monitoringSchema.index({ origen: 1 });
monitoringSchema.index({ subCategoria: 1, materialidad: 1 });

module.exports = mongoose.model('Monitoring', monitoringSchema);
