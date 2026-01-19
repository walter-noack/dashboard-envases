require('dotenv').config();

console.log('🔍 Variables de entorno cargadas:');
console.log('   PORT:', process.env.PORT);
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Cargado' : '❌ No encontrado');
console.log('   CLIENT_URL:', process.env.CLIENT_URL);

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Importar rutas
const ventasRoutes = require('./routes/ventas');
const uploadRoutes = require('./routes/upload');
const envasesRoutes = require('./routes/envases');

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/ventas', ventasRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/envases', envasesRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Dashboard Envases funcionando',
    version: '1.0.0'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Modo: ${process.env.NODE_ENV || 'development'}`);
});