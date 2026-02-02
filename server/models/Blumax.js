const mongoose = require('mongoose');

const blumaxSchema = new mongoose.Schema({
  año: {
    type: Number,
    required: true
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

blumaxSchema.index({ año: 1, envase: 1 });

module.exports = mongoose.model('Blumax', blumaxSchema);
