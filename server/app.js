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
const fichasRoutes = require('./routes/fichas');
const authMiddleware = require('./middleware/auth');

const app = express();

// Conectar a MongoDB
connectDB();

// Middlewares - CORS explícito para Lambda
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://envases.wnoack.cl',
  process.env.CLIENT_URL
].filter(Boolean);

// Middleware CORS manual para asegurar headers en todas las respuestas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://envases.wnoack.cl');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Endpoints de diagnóstico público
app.get('/api/stats/diagnostico', require('./controllers/statsController').getDiagnostico);
app.get('/api/stats/test-linea-base', require('./controllers/statsController').getLineaBaseResumen);

// Endpoint público para cargar especificaciones (temporal para setup inicial)
app.post('/api/envases/cargar-especificaciones', require('./controllers/envasesController').cargarEspecificacionesPredefinidas);

// Rutas protegidas (requieren autenticación)
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/envases', authMiddleware, envasesRoutes);
app.use('/api/blumax', authMiddleware, blumaxRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/fichas', authMiddleware, fichasRoutes);

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
