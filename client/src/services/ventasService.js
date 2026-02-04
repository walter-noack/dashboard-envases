import api from './api';

// Obtener todas las ventas con filtros opcionales
export const getVentas = async (filtros = {}) => {
  try {
    const params = new URLSearchParams(filtros).toString();
    const response = await api.get(`/ventas?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    throw error;
  }
};

// Obtener resumen mensual por SKU
export const getResumenMensual = async (año = 2024) => {
  try {
    const response = await api.get(`/ventas/resumen-mensual?año=${año}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen mensual:', error);
    throw error;
  }
};

// Obtener top productos
export const getTopProductos = async (año = 2024, limite = 10) => {
  try {
    const response = await api.get(`/ventas/top-productos?año=${año}&limite=${limite}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo top productos:', error);
    throw error;
  }
};

// Subir archivo Excel
export const uploadExcel = async (file, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      } : undefined
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    throw error;
  }
};

// Obtener ventas con cálculo de residuos
export const getVentasConResiduos = async (año = 2024, mes = 1) => {
  try {
    const response = await api.get(`/ventas/con-residuos?año=${año}&mes=${mes}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo ventas con residuos:', error);
    throw error;
  }
};

// Subir archivo de envases/residuos
export const uploadEnvases = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/envases/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo de envases:', error);
    throw error;
  }
};

// Obtener resumen de residuos por clasificación de empresa recolectora
export const getResumenResiduosPorClasificacion = async (año = 2024, mes = 1) => {
  try {
    const response = await api.get(`/ventas/residuos-clasificacion?año=${año}&mes=${mes}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen por clasificación:', error);
    throw error;
  }
};

// Limpiar ventas por período (año y opcionalmente mes)
export const limpiarPorPeriodo = async (año, mes = null) => {
  try {
    const body = { año };
    if (mes) body.mes = mes;

    const response = await api.delete('/ventas/limpiar-periodo', { data: body });
    return response.data;
  } catch (error) {
    console.error('Error limpiando datos por período:', error);
    throw error;
  }
};

// Limpiar todos los datos de ventas
export const limpiarTodo = async () => {
  try {
    const response = await api.delete('/ventas/limpiar-todo');
    return response.data;
  } catch (error) {
    console.error('Error limpiando todos los datos:', error);
    throw error;
  }
};

// ============ BLUMAX ============

// Subir archivo Excel de Blumax
export const uploadExcelBlumax = async (file, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/blumax', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      } : undefined
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo Blumax:', error);
    throw error;
  }
};

// Obtener resumen de residuos de Blumax por clasificación
export const getResumenResiduosBlumax = async (año = 2024, mes = 0) => {
  try {
    const response = await api.get(`/blumax/residuos-clasificacion?año=${año}&mes=${mes}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen Blumax:', error);
    throw error;
  }
};

// Limpiar datos de Blumax por año
export const limpiarBlumaxPorAño = async (año) => {
  try {
    const response = await api.delete('/blumax/limpiar-año', { data: { año } });
    return response.data;
  } catch (error) {
    console.error('Error limpiando datos Blumax:', error);
    throw error;
  }
};

// Limpiar datos de Blumax por período (año y mes)
export const limpiarBlumaxPorPeriodo = async (año, mes = null) => {
  try {
    const body = { año };
    if (mes) body.mes = mes;
    const response = await api.delete('/blumax/limpiar-periodo', { data: body });
    return response.data;
  } catch (error) {
    console.error('Error limpiando datos Blumax por período:', error);
    throw error;
  }
};

// Limpiar todos los datos de Blumax
export const limpiarBlumaxTodo = async () => {
  try {
    const response = await api.delete('/blumax/limpiar-todo');
    return response.data;
  } catch (error) {
    console.error('Error limpiando todos los datos Blumax:', error);
    throw error;
  }
};

// Obtener años disponibles de Blumax
export const getAñosDisponiblesBlumax = async () => {
  try {
    const response = await api.get('/blumax/años');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo años disponibles Blumax:', error);
    throw error;
  }
};

// Exportar Blumax en formato REP
export const exportarBlumaxREP = async (año, mes = null) => {
  try {
    const params = mes ? `año=${año}&mes=${mes}` : `año=${año}`;
    const response = await api.get(`/blumax/exportar-rep?${params}`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const nombreArchivo = mes
      ? `Bluemax_${año}-${String(mes).padStart(2, '0')}.xlsx`
      : `Bluemax_${año}.xlsx`;

    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Archivo descargado correctamente' };
  } catch (error) {
    console.error('Error exportando Blumax:', error);
    throw error;
  }
};

// Subir archivo Excel de Blumax mensual
export const uploadExcelBlumaxMensual = async (file, año, mes, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('anio', año);
    formData.append('mes', mes);

    const response = await api.post('/upload/blumax-mensual', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      } : undefined
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo Blumax mensual:', error);
    throw error;
  }
};

// Obtener estado de meses cargados para Blumax
export const getEstadoMesesBlumax = async (año) => {
  try {
    const response = await api.get(`/blumax/estado-meses?año=${año}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estado de meses Blumax:', error);
    throw error;
  }
};

// ============ RESUMEN COMBINADO ============

// Obtener resumen combinado de residuos (Ventas + Blumax)
export const getResumenCombinado = async (año = 2024, mes = 0) => {
  try {
    const response = await api.get(`/ventas/resumen-combinado?año=${año}&mes=${mes}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo resumen combinado:', error);
    throw error;
  }
};

// ============ LÍNEA BASE - CARGA MENSUAL Y ESTADO ============

// Subir archivo Excel de ventas mensual
export const uploadExcelMensual = async (file, año, mes, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('anio', año);
    formData.append('mes', mes);

    const response = await api.post('/upload/mensual', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      } : undefined
    });

    return response.data;
  } catch (error) {
    console.error('Error subiendo archivo mensual:', error);
    throw error;
  }
};

// Obtener estado de meses cargados
export const getEstadoMeses = async (año) => {
  try {
    const response = await api.get(`/ventas/estado-meses?año=${año}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estado de meses:', error);
    throw error;
  }
};

// Obtener años disponibles
export const getAñosDisponibles = async () => {
  try {
    const response = await api.get('/ventas/anos-disponibles');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo años disponibles:', error);
    throw error;
  }
};

// Exportar línea base en formato REP
export const exportarLineaBaseREP = async (año, mes = null) => {
  try {
    const params = mes ? `año=${año}&mes=${mes}` : `año=${año}`;
    const response = await api.get(`/ventas/exportar-rep?${params}`, {
      responseType: 'blob'
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const nombreArchivo = mes
      ? `LineaBase_COPEC_${año}-${String(mes).padStart(2, '0')}.xlsx`
      : `LineaBase_COPEC_${año}.xlsx`;

    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Archivo descargado correctamente' };
  } catch (error) {
    console.error('Error exportando línea base:', error);
    throw error;
  }
};