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
      <h3 style={styles.title}>🏭 Clasificación de Residuos (Empresa Recolectora)</h3>
      
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

      {loading && <div style={styles.loading}>⏳ Cargando clasificación de residuos...</div>}
      {error && <div style={styles.error}>{error}</div>}
      
      {!loading && !error && clasificaciones.length === 0 && (
        <div style={styles.empty}>📭 No hay datos de residuos para este mes</div>
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
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    minHeight: '600px'
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
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  error: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    border: '1px solid #f5c6cb'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
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