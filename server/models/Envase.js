const mongoose = require('mongoose');

// Esquema para dimensiones con tolerancias
const dimensionSchema = new mongoose.Schema({
  valor: Number,
  tolerancia: Number
}, { _id: false });

// Esquema para pesos de componentes del envase
const pesoComponenteSchema = new mongoose.Schema({
  nombre: String,
  peso: dimensionSchema
}, { _id: false });

// Esquema para especificaciones técnicas del envase
const especificacionSchema = new mongoose.Schema({
  // Información general
  codigoProveedor: String,
  proveedor: String,
  descripcion: String,

  // Dimensiones (en mm)
  dimensiones: {
    altura: dimensionSchema,
    diametro: dimensionSchema,
    ancho: dimensionSchema,
    largo: dimensionSchema
  },

  // Peso del envase (en gramos)
  pesoEnvase: {
    total: dimensionSchema,
    componentes: [pesoComponenteSchema]
  },

  // Capacidad (en litros)
  capacidadEnvase: {
    nominal: Number,
    rebalse: Number
  },

  // Material y composición
  materialPrincipal: String,
  composicionDetallada: String,

  // Información de uso
  vidaUtil: String,
  condicionesAlmacenaje: String,
  usoPrevisto: String,

  // Archivos
  imagenTecnica: String,
  pdfOriginal: String,

  // Control
  version: String,
  fechaEspecificacion: Date
}, { _id: false });

// Esquema para componentes de residuos
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
  especificaciones: especificacionSchema,
  unidadesVendidas: Number,
  businessUnit: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Envase', envaseSchema);