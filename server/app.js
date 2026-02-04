require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Importar rutas
const ventasRoutes = require('./routes/ventas');
const uploadRoutes = require('./routes/upload');
const envasesRoutes = require('./routes/envases');
const authRoutes = require('./routes/auth');
const blumaxRoutes = require('./routes/blumax');
const monitoringRoutes = require('./routes/monitoring');
const statsRoutes = require('./routes/stats');
const authMiddleware = require('./middleware/auth');

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://envases.wnoack.cl',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      callback(null, allowedOrigins[0]);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Manejar preflight requests explícitamente
app.options('/{*path}', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Endpoints de diagnóstico público
app.get('/api/stats/diagnostico', require('./controllers/statsController').getDiagnostico);
app.get('/api/stats/test-linea-base', require('./controllers/statsController').getLineaBaseResumen);

// Rutas protegidas (requieren autenticación)
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/envases', authMiddleware, envasesRoutes);
app.use('/api/blumax', authMiddleware, blumaxRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/stats', statsRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API Dashboard Envases funcionando',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
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

module.exports = app;
