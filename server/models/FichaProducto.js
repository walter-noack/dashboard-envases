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
  imagen: {
    type: String, // URL o path relativo
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
