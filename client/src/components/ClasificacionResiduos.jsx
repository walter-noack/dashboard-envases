import { useState, useEffect } from 'react';
import { getResumenResiduosPorClasificacion } from '../services/ventasService';

// Formato: punto para miles, coma para decimales
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const ClasificacionResiduos = ({ año = 2024, refreshTrigger }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(1);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [totales, setTotales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' }
  ];

  useEffect(() => {
    fetchClasificacion();
  }, [año, mesSeleccionado, refreshTrigger]);

  const fetchClasificacion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getResumenResiduosPorClasificacion(año, mesSeleccionado);
      setClasificaciones(response.data);
      setTotales(response.totales);
    } catch (err) {
      setError('Error cargando clasificación de residuos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <h3 style={styles.title}>Clasificacion de Residuos (Empresa Recolectora)</h3>
      
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            Mes:
            <select 
              value={mesSeleccionado} 
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              style={styles.select}
            >
              {meses.map(mes => (
                <option key={mes.num} value={mes.num}>
                  {mes.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={styles.contentArea}>
        {loading && (
          <div style={styles.loadingContainer}>
            <div style={styles.skeletonSummary}>
              <div style={styles.skeletonCard}><div style={styles.shimmer}></div></div>
              <div style={styles.skeletonCard}><div style={styles.shimmer}></div></div>
              <div style={styles.skeletonCard}><div style={styles.shimmer}></div></div>
            </div>
            <div style={styles.loadingMessage}>
              <div style={styles.spinner}></div>
              <span>Cargando clasificacion de residuos...</span>
            </div>
            <div style={styles.skeletonTable}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={styles.skeletonRow}>
                  <div style={styles.shimmer}></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}

        {!loading && !error && clasificaciones.length === 0 && (
          <div style={styles.empty}>No hay datos de residuos para este mes</div>
        )}

      {!loading && !error && clasificaciones.length > 0 && totales && (
        <>
          <div style={styles.summary}>
            <div style={{...styles.summaryCard, ...styles.cardTotal}}>
              <div style={styles.summaryLabel}>Total Residuos</div>
              <div style={styles.summaryValue}>{formatNumber(totales.pesoTotal)} kg</div>
            </div>
            <div style={{...styles.summaryCard, ...styles.cardPeligroso}}>
              <div style={styles.summaryLabel}>Peligrosos</div>
              <div style={styles.summaryValue}>{formatNumber(totales.peligrosos)} kg</div>
            </div>
            <div style={{...styles.summaryCard, ...styles.cardNoPeligroso}}>
              <div style={styles.summaryLabel}>No Peligrosos</div>
              <div style={styles.summaryValue}>{formatNumber(totales.noPeligrosos)} kg</div>
            </div>
          </div>

          <div style={styles.categorias}>
            <div style={styles.categoriaCard}>
              <div style={styles.categoriaTitle}>♻️ Plásticos</div>
              <div style={styles.categoriaValue}>{formatNumber(totales.plasticos)} kg</div>
            </div>
            <div style={styles.categoriaCard}>
              <div style={styles.categoriaTitle}>📄 Papel y Cartón</div>
              <div style={styles.categoriaValue}>{formatNumber(totales.papelCarton)} kg</div>
            </div>
            <div style={styles.categoriaCard}>
              <div style={styles.categoriaTitle}>⚙️ Metales</div>
              <div style={styles.categoriaValue}>{formatNumber(totales.metales)} kg</div>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Material</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Peso Total (kg)</th>
                  <th style={styles.th}>Peligrosidad</th>
                  <th style={styles.th}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {clasificaciones.map((item, index) => (
                  <tr key={index} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={{...styles.td, ...styles.tdCodigo}}>
                      {item.codigo ? `(${item.codigo})` : '-'}
                    </td>
                    <td style={styles.td}>{item.material}</td>
                    <td style={styles.td}>{item.categoria}</td>
                    <td style={{...styles.td, ...styles.tdPeso}}>
                      {formatNumber(item.pesoTotal)}
                    </td>
                    <td style={styles.td}>
                      <span style={item.peligroso ? styles.badgePeligroso : styles.badgeNoPeligroso}>
                        {item.peligroso ? '⚠️ PELIGROSO' : '✅ NO PELIGROSO'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badgeDomiciliario}>
                        {item.domiciliario || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  contentArea: {
    minHeight: '500px'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#333'
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '5px'
  },
  select: {
    marginTop: '5px',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#333'
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  summaryCard: {
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '2px solid'
  },
  cardTotal: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  cardPeligroso: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336'
  },
  cardNoPeligroso: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: '500'
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  categorias: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  categoriaCard: {
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #ddd'
  },
  categoriaTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  categoriaValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  loadingContainer: {
    minHeight: '500px'
  },
  skeletonSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  skeletonCard: {
    height: '80px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative'
  },
  loadingMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px',
    color: '#666',
    fontSize: '16px'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid #e0e0e0',
    borderTop: '3px solid #2196f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  skeletonTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  skeletonRow: {
    height: '45px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative'
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  },
  error: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    border: '1px solid #f5c6cb'
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px'
  },
  tableContainer: {
    overflowX: 'auto',
    maxHeight: '500px',
    overflowY: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f4f4f4',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    color: '#333'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #eee',
    color: '#333'
  },
  tdCodigo: {
    fontWeight: 'bold',
    color: '#2196f3',
    fontSize: '16px'
  },
  tdPeso: {
    fontWeight: 'bold'
  },
  trEven: {
    backgroundColor: '#fafafa'
  },
  trOdd: {
    backgroundColor: 'white'
  },
  badgePeligroso: {
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeNoPeligroso: {
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  badgeDomiciliario: {
    padding: '4px 8px',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontSize: '12px'
  }
};

export default ClasificacionResiduos;