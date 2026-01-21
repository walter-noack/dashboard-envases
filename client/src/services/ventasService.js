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