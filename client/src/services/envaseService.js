import api from './api';

// Obtener todos los envases
export const getEnvases = async () => {
  try {
    const response = await api.get('/envases');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo envases:', error);
    throw error;
  }
};

// Obtener envases con estado de especificaciones
export const getEnvasesConEstado = async () => {
  try {
    const response = await api.get('/envases/estado');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estado de envases:', error);
    throw error;
  }
};

// Obtener envase por nombre
export const getEnvaseByNombre = async (nombre) => {
  try {
    const response = await api.get(`/envases/${encodeURIComponent(nombre)}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo envase:', error);
    throw error;
  }
};

// Obtener especificaciones de un envase
export const getEspecificaciones = async (nombre) => {
  try {
    const response = await api.get(`/envases/${encodeURIComponent(nombre)}/especificaciones`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo especificaciones:', error);
    throw error;
  }
};

// Actualizar especificaciones de un envase
export const updateEspecificaciones = async (nombre, especificaciones) => {
  try {
    const response = await api.put(
      `/envases/${encodeURIComponent(nombre)}/especificaciones`,
      especificaciones
    );
    return response.data;
  } catch (error) {
    console.error('Error actualizando especificaciones:', error);
    throw error;
  }
};

// Subir imagen técnica de un envase
export const uploadImagenTecnica = async (nombre, file, onUploadProgress) => {
  try {
    const formData = new FormData();
    formData.append('imagen', file);

    const response = await api.post(
      `/envases/${encodeURIComponent(nombre)}/especificaciones/imagen`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: onUploadProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        } : undefined
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error subiendo imagen técnica:', error);
    throw error;
  }
};
