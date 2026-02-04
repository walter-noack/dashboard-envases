import { useState, useEffect } from 'react';
import { getResumenCombinado, exportarLineaBaseREP, exportarBlumaxREP, getAñosDisponibles } from '../services/ventasService';
import {
  Scale,
  AlertTriangle,
  ShieldCheck,
  Package,
  FileText,
  Cog,
  Calendar,
  Loader2,
  Layers,
  Home,
  Building2,
  Download
} from 'lucide-react';

const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const ResumenCombinado = ({ año: añoProp = 2024, refreshTrigger }) => {
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoProp);
  const [añosDisponibles, setAñosDisponibles] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(0);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [totales, setTotales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unidad, setUnidad] = useState('kg');
  const [exporting, setExporting] = useState(null); // 'lub', 'blumax', or null

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

  // Cargar años disponibles
  useEffect(() => {
    const cargarAños = async () => {
      try {
        const response = await getAñosDisponibles();
        if (response.success && response.data.length > 0) {
          setAñosDisponibles(response.data);
        } else {
          const currentYear = new Date().getFullYear();
          setAñosDisponibles([currentYear - 1, currentYear, currentYear + 1]);
        }
      } catch (error) {
        console.error('Error cargando años:', error);
        const currentYear = new Date().getFullYear();
        setAñosDisponibles([currentYear - 1, currentYear, currentYear + 1]);
      }
    };
    cargarAños();
  }, []);

  // Actualizar año seleccionado cuando cambia el prop
  useEffect(() => {
    setAñoSeleccionado(añoProp);
  }, [añoProp]);

  useEffect(() => {
    fetchResumen();
  }, [añoSeleccionado, mesSeleccionado, refreshTrigger]);

  const fetchResumen = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getResumenCombinado(añoSeleccionado, mesSeleccionado);
      setClasificaciones(response.data);
      setTotales(response.totales);
    } catch (err) {
      setError('Error cargando resumen combinado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarLUB = async () => {
    setExporting('lub');
    try {
      await exportarLineaBaseREP(añoSeleccionado, mesSeleccionado > 0 ? mesSeleccionado : null);
    } catch (error) {
      console.error('Error exportando LUB:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportarBlumax = async () => {
    setExporting('blumax');
    try {
      await exportarBlumaxREP(añoSeleccionado, mesSeleccionado > 0 ? mesSeleccionado : null);
    } catch (error) {
      console.error('Error exportando Blumax:', error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Layers size={20} style={styles.headerIcon} />
        <div>
          <h3 style={styles.title}>Resumen Total de Residuos</h3>
          <p style={styles.description}>LUB + Planta Bluemax</p>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Calendar size={14} />
            <span>Año</span>
          </label>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            style={styles.select}
          >
            {añosDisponibles.map(año => (
              <option key={año} value={año}>
                {año}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>
            <Calendar size={14} />
            <span>Mes</span>
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

        <div style={styles.filterGroupExport}>
          <label style={styles.filterLabel}>
            <Download size={14} />
            <span>Exportar</span>
          </label>
          <div style={styles.exportButtons}>
            <button
              onClick={handleExportarLUB}
              disabled={exporting !== null || loading}
              style={{...styles.exportButton, ...styles.exportButtonLUB}}
            >
              {exporting === 'lub' ? (
                <Loader2 size={14} style={styles.spinner} />
              ) : (
                <Download size={14} />
              )}
              <span>LUB</span>
            </button>
            <button
              onClick={handleExportarBlumax}
              disabled={exporting !== null || loading}
              style={{...styles.exportButton, ...styles.exportButtonBlumax}}
            >
              {exporting === 'blumax' ? (
                <Loader2 size={14} style={styles.spinner} />
              ) : (
                <Download size={14} />
              )}
              <span>Bluemax</span>
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
            <Layers size={32} strokeWidth={1.5} />
            <span>No hay datos para este período</span>
          </div>
        )}

        {!loading && !error && clasificaciones.length > 0 && totales && (
          <>
            {/* Totales por fuente */}
            <div style={styles.sourceGrid}>
              <div style={styles.sourceCard}>
                <span style={styles.sourceLabel}>Total LUB</span>
                <span style={styles.sourceValue}>{formatNumber(convertirUnidad(totales.pesoVentas))} {getUnidadLabel()}</span>
              </div>
              <div style={{...styles.sourceCard, ...styles.sourceCardBlumax}}>
                <span style={styles.sourceLabel}>Total Bluemax</span>
                <span style={styles.sourceValue}>{formatNumber(convertirUnidad(totales.pesoBlumax))} {getUnidadLabel()}</span>
              </div>
              <div style={{...styles.sourceCard, ...styles.sourceCardTotal}}>
                <span style={styles.sourceLabel}>TOTAL COMBINADO</span>
                <span style={styles.sourceValueLarge}>{formatNumber(convertirUnidad(totales.pesoTotal))} {getUnidadLabel()}</span>
              </div>
            </div>

            <div style={styles.statsGrid}>
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

              <div style={{...styles.statCard, ...styles.statDomiciliario}}>
                <div style={{...styles.statIcon, ...styles.statIconDomiciliario}}>
                  <Home size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Domiciliario</span>
                  <span style={styles.statValue}>{formatNumber(convertirUnidad(totales.domiciliarios))} {getUnidadLabel()}</span>
                </div>
              </div>

              <div style={{...styles.statCard, ...styles.statNoDomiciliario}}>
                <div style={{...styles.statIcon, ...styles.statIconNoDomiciliario}}>
                  <Building2 size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>No Domiciliario</span>
                  <span style={styles.statValue}>{formatNumber(convertirUnidad(totales.noDomiciliarios))} {getUnidadLabel()}</span>
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
              <h4 style={styles.tableTitle}>Detalle por Material (LUB + Bluemax)</h4>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Material</th>
                      <th style={styles.th}>Categoría</th>
                      <th style={{...styles.th, textAlign: 'right'}}>LUB ({getUnidadLabel()})</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Bluemax ({getUnidadLabel()})</th>
                      <th style={{...styles.th, textAlign: 'right', fontWeight: '600'}}>Total ({getUnidadLabel()})</th>
                      <th style={styles.th}>Peligrosidad</th>
                      <th style={styles.th}>Domiciliario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasificaciones.map((item, index) => (
                      <tr key={index} style={styles.tr}>
                        <td style={styles.td}>{item.material}</td>
                        <td style={styles.td}>{item.categoria}</td>
                        <td style={styles.tdNumber}>
                          {formatNumber(convertirUnidad(item.pesoVentas))}
                        </td>
                        <td style={{...styles.tdNumber, color: '#2563eb'}}>
                          {formatNumber(convertirUnidad(item.pesoBlumax))}
                        </td>
                        <td style={{...styles.tdNumber, fontWeight: '600'}}>
                          {formatNumber(convertirUnidad(item.pesoTotal))}
                        </td>
                        <td style={styles.td}>
                          <span style={item.peligroso ? styles.badgeDanger : styles.badgeSuccess}>
                            {item.peligroso ? 'Peligroso' : 'No peligroso'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={item.domiciliario === 'DOMICILIARIO' ? styles.badgeDomiciliario : styles.badgeNoDomiciliario}>
                            {item.domiciliario === 'DOMICILIARIO' ? 'Domiciliario' : 'No domiciliario'}
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
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: '#065f46'
  },
  headerIcon: {
    color: '#6ee7b7'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'white'
  },
  description: {
    margin: 0,
    marginTop: 'var(--spacing-xs)',
    fontSize: 'var(--font-size-sm)',
    color: '#a7f3d0'
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
  filterGroupExport: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
    marginLeft: 'auto'
  },
  exportButtons: {
    display: 'flex',
    gap: 'var(--spacing-sm)'
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  exportButtonLUB: {
    backgroundColor: '#f97316',
    color: 'white'
  },
  exportButtonBlumax: {
    backgroundColor: '#2563eb',
    color: 'white'
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
    backgroundColor: '#059669',
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
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  sourceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-accent-light)',
    borderRadius: 'var(--radius-md)',
    border: '2px solid transparent'
  },
  sourceCardBlumax: {
    backgroundColor: '#dbeafe'
  },
  sourceCardTotal: {
    backgroundColor: '#d1fae5',
    border: '2px solid #059669'
  },
  sourceLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  sourceValue: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  sourceValueLarge: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: '700',
    color: '#059669'
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
  statDomiciliario: {
    backgroundColor: '#fef3c7'
  },
  statIconDomiciliario: {
    backgroundColor: '#d97706'
  },
  statNoDomiciliario: {
    backgroundColor: '#e0e7ff'
  },
  statIconNoDomiciliario: {
    backgroundColor: '#4f46e5'
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
  badgeDomiciliario: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    borderRadius: 'var(--radius-full)'
  },
  badgeNoDomiciliario: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
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

export default ResumenCombinado;
