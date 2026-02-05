import api from './api';

// Obtener todos los SKUs disponibles con estado de ficha
export const getSKUsDisponibles = async () => {
  try {
    const response = await api.get('/fichas/skus');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo SKUs:', error);
    throw error;
  }
};

// Obtener fichas creadas (con paginación)
export const getFichas = async (page = 1, limit = 50, search = '') => {
  try {
    const params = new URLSearchParams({ page, limit, search }).toString();
    const response = await api.get(`/fichas?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo fichas:', error);
    throw error;
  }
};

// Obtener ficha completa por SKU
export const getFichaBySKU = async (sku) => {
  try {
    const response = await api.get(`/fichas/${sku}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo ficha:', error);
    throw error;
  }
};

// Crear o actualizar ficha
export const upsertFicha = async (data) => {
  try {
    const response = await api.post('/fichas', data);
    return response.data;
  } catch (error) {
    console.error('Error guardando ficha:', error);
    throw error;
  }
};

// Eliminar ficha
export const deleteFicha = async (sku) => {
  try {
    const response = await api.delete(`/fichas/${sku}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando ficha:', error);
    throw error;
  }
};

// Descargar PDF de ficha
export const descargarPDF = async (sku) => {
  try {
    const response = await api.get(`/fichas/${sku}/pdf`, {
      responseType: 'blob'
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ficha_${sku}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error descargando PDF:', error);
    throw error;
  }
};

// Descargar ZIP con múltiples PDFs
export const descargarPDFLote = async (skus) => {
  try {
    const response = await api.post('/fichas/pdf-lote', { skus }, {
      responseType: 'blob'
    });

    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fichas_tecnicas.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Error descargando lote de PDFs:', error);
    throw error;
  }
};

// Subir imagen de producto
export const uploadImagen = async (sku, file, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('imagen', file);

    const response = await api.post(`/fichas/${sku}/imagen`, formData, {
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
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};
