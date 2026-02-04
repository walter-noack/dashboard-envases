const mongoose = require('mongoose');

const blumaxSchema = new mongoose.Schema({
  año: {
    type: Number,
    required: true
  },
  mes: {
    type: Number,
    required: false, // Opcional para compatibilidad con datos anteriores
    default: null
  },
  envase: {
    type: String,
    required: true
  },
  unidades: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

blumaxSchema.index({ año: 1, mes: 1, envase: 1 });

module.exports = mongoose.model('Blumax', blumaxSchema);
