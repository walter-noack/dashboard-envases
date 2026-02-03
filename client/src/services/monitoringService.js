import api from './api';

/**
 * Parsear PDF sin guardar (para preview/edición)
 */
export const parsePDF = async (file, origen = 'LUB') => {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('origen', origen);

  const response = await api.post('/monitoring/parse', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Guardar registros editados
 */
export const guardarRegistros = async (registros) => {
  const response = await api.post('/monitoring/guardar', { registros });
  return response.data;
};

/**
 * Subir PDF de factura para monitoring (legacy - guarda directo)
 */
export const uploadPDF = async (file, origen = 'LUB') => {
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('origen', origen);

  const response = await api.post('/monitoring/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Obtener registros de monitoring con filtros
 */
export const getRegistros = async (params = {}) => {
  const response = await api.get('/monitoring/registros', { params });
  return response.data;
};

/**
 * Obtener resumen agrupado
 */
export const getResumen = async (params = {}) => {
  const response = await api.get('/monitoring/resumen', { params });
  return response.data;
};

/**
 * Obtener años disponibles
 */
export const getAniosDisponibles = async (origen = null) => {
  const params = origen ? { origen } : {};
  const response = await api.get('/monitoring/anios', { params });
  return response.data;
};

/**
 * Exportar a Excel
 */
export const exportarExcel = async (params = {}) => {
  const response = await api.get('/monitoring/exportar', {
    params,
    responseType: 'blob'
  });

  // Crear enlace de descarga
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const filename = `Monitoring_${params.origen || 'Total'}_${params.anio || 'TodosAnios'}.xlsx`;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Eliminar un registro
 */
export const eliminarRegistro = async (id) => {
  const response = await api.delete(`/monitoring/registros/${id}`);
  return response.data;
};

/**
 * Limpiar datos de monitoring
 */
export const limpiarDatos = async (params = {}) => {
  const response = await api.delete('/monitoring/limpiar', { params });
  return response.data;
};
