const mongoose = require('mongoose');

const fichaProductoSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nombreComercial: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  // Campo legacy - mantener por compatibilidad
  imagen: {
    type: String,
    default: null
  },
  // Imagen del producto (foto del lubricante, agua, etc.)
  imagenProducto: {
    type: String, // URL de S3
    default: null
  },
  // Imagen del envase (botella, balde, bin, etc.)
  imagenEnvase: {
    type: String, // URL de S3
    default: null
  },
  // Datos del producto (pueden venir de mapeoSKU o ingresarse manualmente)
  categoria: {
    type: String,
    required: true
  },
  capacidad: {
    type: String
  },
  // Referencia al tipo de envase para obtener composición
  tipoEnvase: {
    type: String
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FichaProducto', fichaProductoSchema);
