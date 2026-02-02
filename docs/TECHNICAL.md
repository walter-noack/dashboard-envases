# Documentación Técnica - Dashboard Envases

## Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Base de Datos](#base-de-datos)
3. [API REST](#api-rest)
4. [Lógica de Negocio](#lógica-de-negocio)
5. [Frontend](#frontend)
6. [Despliegue](#despliegue)

---

## Arquitectura del Sistema

### Diagrama General

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API Gateway    │────▶│   MongoDB       │
│   (React/Vite)  │     │   (AWS Lambda)   │     │   (Atlas)       │
│   cPanel        │◀────│   Express.js     │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   LocalStorage  │     │   Archivos JSON  │
│   (JWT Token)   │     │   (Mapeos)       │
└─────────────────┘     └──────────────────┘
```

### Componentes

| Componente | Tecnología | Ubicación |
|------------|------------|-----------|
| Frontend | React 19 + Vite | cPanel (estático) |
| Backend | Express.js 5 | AWS Lambda |
| Base de Datos | MongoDB 7 | Atlas (cloud) |
| Autenticación | JWT | Stateless |

---

## Base de Datos

### Colecciones

#### ventas
Almacena datos de ventas importados desde Excel.

```javascript
// Índices
db.ventas.createIndex({ material: 1 })
db.ventas.createIndex({ año: 1, mes: 1, material: 1 })

// Documento ejemplo
{
  _id: ObjectId("..."),
  año: 2024,
  mes: 1,
  canal: "DISTRIBUIDORES",
  grupoLineas: "1. Lubricantes",
  material: "123456",
  materialNombre: "MOBIL 1 5W-30 1L",
  oficina: "Santiago",
  envase: "CAJA",
  volumen: 1000,
  unidades: 1000,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

#### envases
Catálogo de envases con sus componentes y clasificaciones.

```javascript
// Índice
db.envases.createIndex({ nombre: 1 }, { unique: true })

// Documento ejemplo
{
  _id: ObjectId("..."),
  nombre: "Lub 1 L",
  componentes: [
    {
      nombre: "Tapa",
      cantidad: 1,
      pesoGramos: 9,
      categoria: "Plásticos",
      material: "Envases de PEAD que NO contienen sustancias con grasa (2)",
      codigoClasificacion: "2",
      peligrosidad: "PELIGROSO",
      domiciliario: "NO DOMICILIARIO"
    },
    {
      nombre: "Botella",
      cantidad: 1,
      pesoGramos: 45,
      categoria: "Plásticos",
      material: "Envases de PEAD que NO contienen sustancias con grasa (2)",
      codigoClasificacion: "2",
      peligrosidad: "PELIGROSO",
      domiciliario: "NO DOMICILIARIO"
    }
  ]
}
```

#### blumax
Datos de producción planta Bluemax (agregados por año).

```javascript
// Índice
db.blumax.createIndex({ año: 1, envase: 1 })

// Documento ejemplo
{
  _id: ObjectId("..."),
  año: 2025,
  envase: "BIDONES",
  unidades: 50000
}
```

### Queries Frecuentes

```javascript
// Ventas por año/mes excluyendo Bluemax y granel
db.ventas.find({
  año: 2024,
  mes: 1,
  grupoLineas: { $ne: '8. Bluemax' },
  envase: { $ne: 'GRANEL' }
})

// Agregación: resumen mensual
db.ventas.aggregate([
  { $match: { año: 2024 } },
  { $group: {
    _id: { mes: "$mes", material: "$material" },
    totalUnidades: { $sum: "$unidades" },
    totalVolumen: { $sum: "$volumen" }
  }}
])
```

---

## API REST

### Autenticación

El sistema usa JWT (JSON Web Tokens) con expiración de 12 horas.

```javascript
// Flujo de autenticación
1. POST /api/auth/login { email, password }
2. Server valida contra variables de entorno (AUTH_USER, AUTH_PASSWORD)
3. Genera token: jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' })
4. Cliente guarda en localStorage
5. Todas las requests incluyen: Authorization: Bearer {token}
```

### Middleware de Autenticación

```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
```

### Endpoints Detallados

#### GET /api/ventas/resumen-clasificacion

Retorna residuos agrupados por material con clasificación.

**Query params:**
- `año` (required): Año a consultar
- `mes` (required): Mes (1-12) o 0 para todo el año

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "material": "Envases de PEAD que NO contienen sustancias con grasa (2)",
      "codigo": "2",
      "categoria": "Plásticos",
      "pesoTotal": 1141557.32,
      "peligroso": true,
      "domiciliario": "NO DOMICILIARIO"
    }
  ],
  "totales": {
    "pesoTotal": 1500000,
    "plasticos": 1200000,
    "papelCarton": 200000,
    "metales": 100000,
    "peligrosos": 1100000,
    "noPeligrosos": 400000
  }
}
```

#### GET /api/ventas/resumen-combinado

Combina datos de LUB y Bluemax.

**Lógica especial:**
- Si `mes > 0`: Blumax se divide por 12 (distribución mensual equitativa)
- Si `mes = 0`: Blumax se suma completo

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "material": "Envases de PEAD...",
      "pesoVentas": 28600,
      "pesoBlumax": 22420,
      "pesoTotal": 51020,
      "peligroso": false
    }
  ]
}
```

---

## Lógica de Negocio

### Mapeo de Ventas a Envases

El sistema usa una jerarquía de mapeos para determinar qué envase corresponde a cada venta:

```
1. mapeoSKU.json (prioridad máxima)
   └─ SKU directo → Envase

2. mapeoEnvases.json > reglasGenerales
   └─ Tipo envase → Envase (aplica a todos los grupos)

3. mapeoEnvases.json > excepcionesPorNombre
   └─ Patrones a excluir por grupo

4. mapeoEnvases.json > porGrupo
   └─ (grupoLineas + tipoEnvase) → Envase
```

**Código:** `server/utils/residuosMapper.js`

```javascript
exports.mapearVentaAEnvase = (venta) => {
  const sku = venta.material;
  const grupoLineas = venta.grupoLineas;
  const envase = venta.envase;

  // 1. Buscar por SKU
  if (mapeoSKU[sku]) return mapeoSKU[sku].categoria;

  // 2. Reglas generales
  if (reglasGenerales[envase]) return reglasGenerales[envase];

  // 3. Excepciones (excluir productos)
  if (esExcluido(grupoLineas, venta.materialNombre)) return null;

  // 4. Reglas por grupo
  return porGrupo[grupoLineas]?.[envase] || null;
};
```

### Cálculo de Residuos

Para cada venta mapeada a un envase:

```javascript
exports.calcularResiduos = (venta, envase) => {
  const unidades = venta.unidades;
  const residuosPorClasificacion = {};

  envase.componentes.forEach(comp => {
    const pesoKg = (comp.pesoGramos * comp.cantidad * unidades) / 1000;

    // Agrupar por material
    const key = comp.material;
    if (!residuosPorClasificacion[key]) {
      residuosPorClasificacion[key] = {
        material: comp.material,
        codigo: comp.codigoClasificacion,
        categoria: comp.categoria,
        pesoKg: 0,
        peligroso: comp.peligrosidad === 'PELIGROSO',
        domiciliario: comp.domiciliario
      };
    }
    residuosPorClasificacion[key].pesoKg += pesoKg;
  });

  return Object.values(residuosPorClasificacion);
};
```

### Separación PEAD Peligroso/No Peligroso

El mismo material "Envases de PEAD que NO contienen sustancias con grasa (2)" puede ser:
- **Peligroso**: Si proviene de envases de lubricantes
- **No peligroso**: Si proviene de envases de agua/anticongelante

La clave de agrupación incluye la peligrosidad:

```javascript
// Clave de agrupación
const key = `${normalizarMaterial(item.material)}|${item.peligroso ? 'P' : 'NP'}`;
```

Esto genera dos filas separadas en los reportes.

---

## Frontend

### Estructura de Componentes

```
App
└── Login (si no autenticado)
└── Dashboard (si autenticado)
    ├── Header (selector año, logout)
    ├── Tabs
    │   ├── LUB Tab
    │   │   ├── FileUpload
    │   │   ├── VentasPorMes
    │   │   ├── ResumenMensual (gráfico)
    │   │   ├── TopProductos (gráfico)
    │   │   ├── ClasificacionResiduos
    │   │   │   └── TablaResumen (pivot)
    │   │   └── LimpiarDatos
    │   │
    │   ├── Bluemax Tab
    │   │   ├── BlumaxUpload
    │   │   ├── ClasificacionBlumax
    │   │   │   └── TablaResumen (pivot)
    │   │   └── LimpiarDatos
    │   │
    │   └── Total Tab
    │       └── ResumenCombinado
    │           └── TablaResumen (pivot)
```

### Estado Global

No se usa Redux/Context. El estado se maneja localmente con props drilling:

```javascript
// Dashboard.jsx
const [selectedYear, setSelectedYear] = useState(2024);
const [refreshTrigger, setRefreshTrigger] = useState(0);

// Trigger recarga de componentes hijos
const handleUploadSuccess = () => {
  setRefreshTrigger(prev => prev + 1);
};

// Pasa a hijos
<VentasPorMes año={selectedYear} refreshTrigger={refreshTrigger} />
```

### Servicio API

```javascript
// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Interceptor: añade token a todas las requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: maneja errores 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Tabla Resumen (Pivot)

Genera una tabla cruzada: filas = clasificación, columnas = materiales.

```javascript
const generarTablaResumen = () => {
  const filas = [
    { key: 'noDomNoPel', label: 'No Domiciliario / No Peligroso' },
    { key: 'noDomPel', label: 'No Domiciliario / Peligroso' },
    { key: 'domNoPel', label: 'Domiciliario / No Peligroso' },
    { key: 'domPel', label: 'Domiciliario / Peligroso' }
  ];

  const materialesUnicos = [...new Set(clasificaciones.map(materialToShort))];

  // Llenar matriz
  clasificaciones.forEach(item => {
    const fila = determinarFila(item.domiciliario, item.peligroso);
    const col = materialToShort(item);
    datos[fila][col] += item.pesoTotal;
  });
};
```

---

## Despliegue

### Backend (AWS Lambda)

**Archivo:** `server/serverless.yml`

```yaml
service: dashboard-envases-api
provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  timeout: 30
  memorySize: 512
  environment:
    MONGODB_URI: ${env:MONGODB_URI}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  api:
    handler: handler.handler
    events:
      - http:
          path: /
          method: ANY
      - http:
          path: /{proxy+}
          method: ANY
```

**Comandos:**

```bash
# Desarrollo local
npm run dev

# Deploy producción
export $(cat .env | xargs)
npx serverless deploy

# Ver logs
npx serverless logs -f api -t

# Remover stack
npx serverless remove
```

### Frontend (Build + cPanel)

```bash
# Build
cd client
npm run build

# Genera:
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...

# Subir dist/ completo a cPanel vía FTP/File Manager
```

### Variables de Entorno en Producción

| Variable | Backend | Frontend |
|----------|---------|----------|
| MONGODB_URI | ✓ Lambda env | - |
| JWT_SECRET | ✓ Lambda env | - |
| AUTH_USER | ✓ Lambda env | - |
| AUTH_PASSWORD | ✓ Lambda env | - |
| CLIENT_URL | ✓ Lambda env | - |
| VITE_API_URL | - | ✓ Build time |

---

## Troubleshooting

### Error: "Token inválido"
- Verificar que JWT_SECRET sea el mismo en login y verificación
- Token puede estar expirado (24h)

### Datos no aparecen después de upload
- Verificar que el año del Excel coincida con el filtro
- Revisar logs de Lambda para errores de parseo

### Blumax muestra valores muy altos
- Verificar que se esté filtrando por mes (÷12) y no año completo

### CORS errors
- Verificar CLIENT_URL en variables de entorno del backend
- El backend permite: localhost:5173, localhost:5001, y CLIENT_URL

---

## Contacto

Proyecto desarrollado para COPEC por EnSustenta.
