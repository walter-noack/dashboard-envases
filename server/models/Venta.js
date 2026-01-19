const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  año: {
    type: Number,
    required: true
  },
  mes: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  canal: String,
  grupoLineas: String,
  material: {
    type: String,
    required: true,
    index: true
  },
  materialNombre: {
    type: String,
    required: true
  },
  oficina: String,
  envase: String,
  volumen: {
    type: Number,
    default: 0
  },
  unidades: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas rápidas
ventaSchema.index({ año: 1, mes: 1, material: 1 });

module.exports = mongoose.model('Venta', ventaSchema);