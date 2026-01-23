import { useState, useEffect } from 'react';
import { getResumenResiduosPorClasificacion } from '../services/ventasService';
import {
  Scale,
  AlertTriangle,
  ShieldCheck,
  Package,
  FileText,
  Cog,
  Calendar,
  Loader2
} from 'lucide-react';

const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const ClasificacionResiduos = ({ año = 2024, refreshTrigger }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(0);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [totales, setTotales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unidad, setUnidad] = useState('kg');

  const convertirUnidad = (valorKg) => {
    if (valorKg === null || valorKg === undefined) return null;
    return unidad === 'ton' ? valorKg / 1000 : valorKg;
  };

  const getUnidadLabel = () => unidad === 'ton' ? 'ton' : 'kg';

  const generarTablaResumen = () => {
    if (!clasificaciones || clasificaciones.length === 0) return null;

    const materialesUnicos = [...new Set(clasificaciones.map(item => {
      const codigo = item.codigo ? `(${item.codigo})` : '';
      if (item.material.includes('Cartón')) return 'Cartón';
      if (item.material.includes('metal')) return 'Metales';
      if (item.material.includes('PEAD') && item.material.includes('NO contienen')) return `PEAD no ${codigo}`;
      if (item.material.includes('PEAD') && item.material.includes('contienen')) return `PEAD ${codigo}`;
      if (item.material.includes('PEBD') && item.material.includes('NO contienen')) return `PEBD no ${codigo}`;
      if (item.material.includes('PEBD') && item.material.includes('contienen')) return `PEBD ${codigo}`;
      if (item.material.includes('PP') && item.material.includes('NO contienen')) return `PP no ${codigo}`;
      if (item.material.includes('PP') && item.material.includes('contienen')) return `PP ${codigo}`;
      if (item.material.includes('PS') && item.material.includes('NO contienen')) return `PS no ${codigo}`;
      if (item.material.includes('PS') && item.material.includes('contienen')) return `PS ${codigo}`;
      if (item.material.includes('PET')) return `PET ${codigo}`;
      if (item.material.includes('Otros')) return `Otros ${codigo}`;
      return item.material.substring(0, 15) + (codigo ? ` ${codigo}` : '');
    }))].sort();

    const materialToShort = (item) => {
      const codigo = item.codigo ? `(${item.codigo})` : '';
      if (item.material.includes('Cartón')) return 'Cartón';
      if (item.material.includes('metal')) return 'Metales';
      if (item.material.includes('PEAD') && item.material.includes('NO contienen')) return `PEAD no ${codigo}`;
      if (item.material.includes('PEAD') && item.material.includes('contienen')) return `PEAD ${codigo}`;
      if (item.material.includes('PEBD') && item.material.includes('NO contienen')) return `PEBD no ${codigo}`;
      if (item.material.includes('PEBD') && item.material.includes('contienen')) return `PEBD ${codigo}`;
      if (item.material.includes('PP') && item.material.includes('NO contienen')) return `PP no ${codigo}`;
      if (item.material.includes('PP') && item.material.includes('contienen')) return `PP ${codigo}`;
      if (item.material.includes('PS') && item.material.includes('NO contienen')) return `PS no ${codigo}`;
      if (item.material.includes('PS') && item.material.includes('contienen')) return `PS ${codigo}`;
      if (item.material.includes('PET')) return `PET ${codigo}`;
      if (item.material.includes('Otros')) return `Otros ${codigo}`;
      return item.material.substring(0, 15) + (codigo ? ` ${codigo}` : '');
    };

    const filas = [
      { key: 'noDomNoPel', label: 'No Domiciliario / No Peligroso', domiciliario: 'NO DOMICILIARIO', peligroso: false },
      { key: 'noDomPel', label: 'No Domiciliario / Peligroso', domiciliario: 'NO DOMICILIARIO', peligroso: true },
      { key: 'domNoPel', label: 'Domiciliario / No Peligroso', domiciliario: 'DOMICILIARIO', peligroso: false },
      { key: 'domPel', label: 'Domiciliario / Peligroso', domiciliario: 'DOMICILIARIO', peligroso: true }
    ];

    const datos = {};
    filas.forEach(fila => {
      datos[fila.key] = {};
      materialesUnicos.forEach(mat => {
        datos[fila.key][mat] = 0;
      });
    });

    clasificaciones.forEach(item => {
      const materialCorto = materialToShort(item);
      const esDomiciliario = item.domiciliario === 'DOMICILIARIO';
      const esPeligroso = item.peligroso;

      let filaKey;
      if (!esDomiciliario && !esPeligroso) filaKey = 'noDomNoPel';
      else if (!esDomiciliario && esPeligroso) filaKey = 'noDomPel';
      else if (esDomiciliario && !esPeligroso) filaKey = 'domNoPel';
      else filaKey = 'domPel';

      if (datos[filaKey] && datos[filaKey][materialCorto] !== undefined) {
        datos[filaKey][materialCorto] += item.pesoTotal;
      }
    });

    return { materialesUnicos, filas, datos };
  };

  const tablaResumen = generarTablaResumen();

  const meses = [
    { num: 0, nombre: 'Total Año' },
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
      <div style={styles.header}>
        <h3 style={styles.title}>Clasificación de Residuos</h3>
        <p style={styles.description}>Resumen para empresa recolectora</p>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Calendar size={14} />
            <span>Período</span>
          </label>
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
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Scale size={14} />
            <span>Unidad</span>
          </label>
          <div style={styles.toggleGroup}>
            <button
              style={{
                ...styles.toggleButton,
                ...(unidad === 'kg' ? styles.toggleButtonActive : {})
              }}
              onClick={() => setUnidad('kg')}
            >
              kg
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(unidad === 'ton' ? styles.toggleButtonActive : {})
              }}
              onClick={() => setUnidad('ton')}
            >
              ton
            </button>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingState}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Cargando datos...</span>
          </div>
        )}

        {error && (
          <div style={styles.errorState}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && clasificaciones.length === 0 && (
          <div style={styles.emptyState}>
            <Package size={32} strokeWidth={1.5} />
            <span>No hay datos de residuos para este período</span>
          </div>
        )}

        {!loading && !error && clasificaciones.length > 0 && totales && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <Scale size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Total Residuos</span>
                  <span style={styles.statValue}>{formatNumber(convertirUnidad(totales.pesoTotal))} {getUnidadLabel()}</span>
                </div>
              </div>

              <div style={{...styles.statCard, ...styles.statDanger}}>
                <div style={{...styles.statIcon, ...styles.statIconDanger}}>
                  <AlertTriangle size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Peligrosos</span>
                  <span style={styles.statValue}>{formatNumber(convertirUnidad(totales.peligrosos))} {getUnidadLabel()}</span>
                </div>
              </div>

              <div style={{...styles.statCard, ...styles.statSuccess}}>
                <div style={{...styles.statIcon, ...styles.statIconSuccess}}>
                  <ShieldCheck size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>No Peligrosos</span>
                  <span style={styles.statValue}>{formatNumber(convertirUnidad(totales.noPeligrosos))} {getUnidadLabel()}</span>
                </div>
              </div>
            </div>

            <div style={styles.categoriesGrid}>
              <div style={styles.categoryCard}>
                <Package size={18} style={styles.categoryIcon} />
                <span style={styles.categoryLabel}>Plásticos</span>
                <span style={styles.categoryValue}>{formatNumber(convertirUnidad(totales.plasticos))} {getUnidadLabel()}</span>
              </div>
              <div style={styles.categoryCard}>
                <FileText size={18} style={styles.categoryIcon} />
                <span style={styles.categoryLabel}>Papel y Cartón</span>
                <span style={styles.categoryValue}>{formatNumber(convertirUnidad(totales.papelCarton))} {getUnidadLabel()}</span>
              </div>
              <div style={styles.categoryCard}>
                <Cog size={18} style={styles.categoryIcon} />
                <span style={styles.categoryLabel}>Metales</span>
                <span style={styles.categoryValue}>{formatNumber(convertirUnidad(totales.metales))} {getUnidadLabel()}</span>
              </div>
            </div>

            <div style={styles.tableSection}>
              <h4 style={styles.tableTitle}>Detalle por Material</h4>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Código</th>
                      <th style={styles.th}>Material</th>
                      <th style={styles.th}>Categoría</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Peso ({getUnidadLabel()})</th>
                      <th style={styles.th}>Peligrosidad</th>
                      <th style={styles.th}>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasificaciones.map((item, index) => (
                      <tr key={index} style={styles.tr}>
                        <td style={styles.tdCode}>
                          {item.codigo ? `(${item.codigo})` : '-'}
                        </td>
                        <td style={styles.td}>{item.material}</td>
                        <td style={styles.td}>{item.categoria}</td>
                        <td style={styles.tdNumber}>
                          {formatNumber(convertirUnidad(item.pesoTotal))}
                        </td>
                        <td style={styles.td}>
                          <span style={item.peligroso ? styles.badgeDanger : styles.badgeSuccess}>
                            {item.peligroso ? 'Peligroso' : 'No peligroso'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.badgeNeutral}>
                            {item.domiciliario || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {tablaResumen && (
              <div style={styles.tableSection}>
                <h4 style={styles.tableTitle}>Tabla Resumen ({getUnidadLabel()})</h4>
                <div style={styles.tableWrapper}>
                  <table style={styles.resumenTable}>
                    <thead>
                      <tr>
                        <th style={styles.resumenTh}>Clasificación</th>
                        {tablaResumen.materialesUnicos.map(mat => (
                          <th key={mat} style={styles.resumenThMaterial}>{mat}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tablaResumen.filas.map((fila) => (
                        <tr key={fila.key} style={styles.tr}>
                          <td style={styles.resumenTdLabel}>{fila.label}</td>
                          {tablaResumen.materialesUnicos.map(mat => {
                            const valor = tablaResumen.datos[fila.key][mat];
                            return (
                              <td key={mat} style={styles.resumenTdValue}>
                                {valor > 0 ? formatNumber(convertirUnidad(valor)) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)'
  },
  header: {
    padding: 'var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  description: {
    margin: 0,
    marginTop: 'var(--spacing-xs)',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  filters: {
    display: 'flex',
    gap: 'var(--spacing-lg)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-bg)'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)'
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  select: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '140px'
  },
  toggleGroup: {
    display: 'flex',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden'
  },
  toggleButton: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: 'none',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  toggleButtonActive: {
    backgroundColor: 'var(--color-accent)',
    color: 'white'
  },
  content: {
    padding: 'var(--spacing-lg)',
    minHeight: '400px'
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-2xl)',
    color: 'var(--color-text-secondary)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-md)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-2xl)',
    color: 'var(--color-text-muted)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-accent-light)',
    borderRadius: 'var(--radius-md)'
  },
  statDanger: {
    backgroundColor: 'var(--color-danger-light)'
  },
  statSuccess: {
    backgroundColor: 'var(--color-success-light)'
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent)',
    color: 'white'
  },
  statIconDanger: {
    backgroundColor: 'var(--color-danger)'
  },
  statIconSuccess: {
    backgroundColor: 'var(--color-success)'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  statLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  statValue: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  categoryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)'
  },
  categoryIcon: {
    color: 'var(--color-text-muted)'
  },
  categoryLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)'
  },
  categoryValue: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  tableSection: {
    marginTop: 'var(--spacing-lg)'
  },
  tableTitle: {
    margin: 0,
    marginBottom: 'var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-size-sm)'
  },
  th: {
    padding: 'var(--spacing-md)',
    textAlign: 'left',
    backgroundColor: 'var(--color-bg)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid var(--color-border-light)'
  },
  td: {
    padding: 'var(--spacing-md)',
    color: 'var(--color-text-primary)'
  },
  tdCode: {
    padding: 'var(--spacing-md)',
    fontWeight: '600',
    color: 'var(--color-accent)'
  },
  tdNumber: {
    padding: 'var(--spacing-md)',
    textAlign: 'right',
    fontWeight: '500',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--color-text-primary)'
  },
  badgeDanger: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-danger)',
    backgroundColor: 'var(--color-danger-light)',
    borderRadius: 'var(--radius-full)'
  },
  badgeSuccess: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-success)',
    backgroundColor: 'var(--color-success-light)',
    borderRadius: 'var(--radius-full)'
  },
  badgeNeutral: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-full)'
  },
  resumenTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-size-sm)'
  },
  resumenTh: {
    padding: 'var(--spacing-md)',
    textAlign: 'left',
    backgroundColor: 'var(--color-bg)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    minWidth: '180px'
  },
  resumenThMaterial: {
    padding: 'var(--spacing-md)',
    textAlign: 'center',
    backgroundColor: 'var(--color-bg)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)',
    whiteSpace: 'nowrap',
    minWidth: '90px'
  },
  resumenTdLabel: {
    padding: 'var(--spacing-md)',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-bg)'
  },
  resumenTdValue: {
    padding: 'var(--spacing-md)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--color-text-primary)'
  }
};

export default ClasificacionResiduos;
