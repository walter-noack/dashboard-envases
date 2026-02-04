import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Resumen general del dashboard
export const getDashboardResumen = async (año) => {
  const response = await axios.get(`${API_URL}/stats/resumen`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};

// Línea Base - Resumen por categoría
export const getLineaBaseResumen = async (año) => {
  const response = await axios.get(`${API_URL}/stats/linea-base/resumen`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};

// Línea Base - Datos mensuales
export const getLineaBaseMensual = async (año) => {
  const response = await axios.get(`${API_URL}/stats/linea-base/mensual`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};

// Línea Base - Por planta
export const getLineaBasePorPlanta = async (año) => {
  const response = await axios.get(`${API_URL}/stats/linea-base/plantas`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};

// Monitoring - Resumen por categoría
export const getMonitoringResumen = async (año) => {
  const response = await axios.get(`${API_URL}/stats/monitoring/resumen`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};

// Monitoring - Datos mensuales
export const getMonitoringMensual = async (año) => {
  const response = await axios.get(`${API_URL}/stats/monitoring/mensual`, {
    ...getAuthHeaders(),
    params: { año }
  });
  return response.data;
};
