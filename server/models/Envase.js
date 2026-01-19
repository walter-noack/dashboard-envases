const mongoose = require('mongoose');

const componenteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  cantidad: Number,
  pesoGramos: {
    type: Number,
    required: true
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Plásticos', 'Papel y cartón', 'Metales']
  },
  material: String,
  codigoClasificacion: String,
  caracteristica: String,
  porcentajeReciclado: {
    type: Number,
    default: 0
  },
  retornable: {
    type: Boolean,
    default: false
  },
  peligrosidad: {
    type: String,
    enum: ['PELIGROSO', 'NO PELIGROSO']
  },
  domiciliario: {
    type: String,
    enum: ['DOMICILIARIO', 'NO DOMICILIARIO']
  }
}, { _id: false });

const envaseSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  componentes: [componenteSchema],
  unidadesVendidas: Number,
  businessUnit: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Envase', envaseSchema);