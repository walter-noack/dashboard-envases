# Dashboard de Envases - COPEC

Sistema de gestión y análisis de residuos de envases para plantas de lubricantes (LUB) y Bluemax.

## Descripción

Este dashboard permite cargar datos de ventas desde archivos Excel, calcular automáticamente los residuos generados por tipo de material, y visualizar la información clasificada según normativas de gestión de residuos (peligrosidad, domiciliario/no domiciliario).

## Arquitectura

```
dashboard-envases/
├── client/          # Frontend React + Vite
├── server/          # Backend Express + MongoDB
└── planillas/       # Archivos de referencia
```

### Stack Tecnológico

**Backend:**
- Node.js 22.x
- Express.js 5.x
- MongoDB Atlas + Mongoose
- AWS Lambda (Serverless Framework)
- JWT para autenticación

**Frontend:**
- React 19.x
- Vite
- Recharts (gráficos)
- Axios

## Instalación

### Requisitos
- Node.js 20+
- MongoDB Atlas o instancia local
- AWS CLI (para deploy)

### Backend

```bash
cd server
npm install
cp .env.example .env  # Configurar variables
npm run dev           # Desarrollo local (puerto 5001)
```

### Frontend

```bash
cd client
npm install
cp .env.example .env  # Configurar API URL
npm run dev           # Desarrollo local (puerto 5173)
npm run build         # Build producción
```



## API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/verificar` | Verificar token |

### Ventas (LUB)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ventas` | Listar ventas |
| GET | `/api/ventas/con-residuos` | Ventas con cálculo de residuos |
| GET | `/api/ventas/resumen-clasificacion` | Residuos agrupados por material |
| GET | `/api/ventas/resumen-combinado` | Total LUB + Bluemax |
| POST | `/api/upload` | Cargar archivo Excel |
| DELETE | `/api/ventas/limpiar-periodo` | Limpiar por año/mes |

### Bluemax
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/blumax` | Listar datos Bluemax |
| GET | `/api/blumax/residuos-clasificacion` | Residuos clasificados |
| POST | `/api/upload/blumax` | Cargar archivo Excel |
| DELETE | `/api/blumax/limpiar-año` | Limpiar por año |

### Envases
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/envases` | Catálogo de envases |
| POST | `/api/envases/upload` | Cargar catálogo Excel |

## Modelos de Datos

### Venta
```javascript
{
  año: Number,
  mes: Number,           // 1-12
  grupoLineas: String,   // "1. Lubricantes", "3. Refrigerantes", etc.
  material: String,      // SKU
  materialNombre: String,
  envase: String,        // BALDE, TAMBOR, CAJA, etc.
  volumen: Number,
  unidades: Number
}
```

### Envase
```javascript
{
  nombre: String,        // "Lub 1 L", "Anticongelante 4 L"
  componentes: [{
    nombre: String,      // "Tapa", "Botella", "Caja"
    cantidad: Number,
    pesoGramos: Number,
    categoria: String,   // "Plásticos", "Papel y cartón", "Metales"
    material: String,    // Clasificación empresa recolectora
    peligrosidad: String,   // "PELIGROSO" | "NO PELIGROSO"
    domiciliario: String    // "DOMICILIARIO" | "NO DOMICILIARIO"
  }]
}
```

### Blumax
```javascript
{
  año: Number,
  envase: String,    // BIDONES, TAMBOR, BINS
  unidades: Number
}
```

## Flujo de Cálculo de Residuos

1. **Carga de datos**: Excel de ventas → MongoDB
2. **Mapeo de envase**: `(grupoLineas + tipoEnvase)` → nombre de envase
3. **Búsqueda de componentes**: Envase → lista de componentes con pesos
4. **Cálculo**: `peso = pesoGramos × cantidad × unidades`
5. **Clasificación**: Agrupa por material, peligrosidad, domiciliario

### Ejemplo
```
Venta: 1000 unidades de Lub 1 L
  └─ Envase "Lub 1 L" tiene:
      ├─ Tapa (9g) → PEAD Peligroso: 9 kg
      ├─ Botella (45g) → PEAD Peligroso: 45 kg
      └─ Etiqueta (2g) → Papel: 2 kg
  └─ Total: 56 kg residuos
```

## Archivos de Configuración

### mapeoEnvases.json
Define cómo mapear ventas a envases según grupo de líneas:
```json
{
  "porGrupo": {
    "1. Lubricantes": {
      "BALDE": "Lub Balde",
      "TAMBOR": "LUB Tambor"
    },
    "3. Refrigerantes": {
      "BALDE": "Anticongelante balde"
    }
  }
}
```

### mapeoEnvasesBlumax.json
Define componentes de envases Bluemax:
```json
{
  "envases": {
    "Bídon 10 L": {
      "componentes": [
        { "nombre": "Bidón", "pesoGr": 302, "categoria": "Plásticos" }
      ]
    }
  }
}
```

### mapeoSKU.json
Mapeo directo SKU → categoría (prioridad máxima):
```json
{
  "mapeoSKU": {
    "123456": { "categoria": "Lub 1 L" }
  }
}
```

## Deploy

### Backend (AWS Lambda)
```bash
cd server
export $(cat .env | xargs)
npx serverless deploy
```

### Frontend (cPanel/Hosting estático)
```bash
cd client
npm run build
# Subir contenido de dist/ al hosting
```

## Características Principales

- **Carga masiva**: Importa miles de registros desde Excel
- **Cálculo automático**: Convierte ventas en residuos clasificados
- **Clasificación normativa**: Peligroso/No peligroso, Domiciliario/No domiciliario
- **Visualización**: Gráficos y tablas interactivas
- **Filtros**: Por año, mes, tipo de producto
- **Exportación**: Datos en kg o toneladas
- **Multi-fuente**: Combina datos LUB y Bluemax

## Notas Técnicas

### Distribución mensual Blumax
Los datos de Bluemax se cargan por año completo. Cuando se filtra por un mes específico, el sistema divide automáticamente el total por 12 para mostrar una distribución equitativa mensual.

### Separación PEAD Peligroso/No Peligroso
Los envases de PEAD que NO contienen grasa pueden ser:
- **Peligrosos**: Envases de lubricantes
- **No Peligrosos**: Envases de agua/anticongelante

El sistema separa automáticamente estas clasificaciones basándose en el tipo de producto original.

## Estructura del Frontend

| Pestaña | Componentes | Descripción |
|---------|-------------|-------------|
| **LUB** | FileUpload, VentasPorMes, ClasificacionResiduos | Datos planta lubricantes |
| **Bluemax** | BlumaxUpload, ClasificacionBlumax | Datos planta Bluemax |
| **Total** | ResumenCombinado | Suma de ambas fuentes |

## Licencia

Proyecto privado - COPEC / EnSustenta
