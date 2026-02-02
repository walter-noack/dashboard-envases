import { useState, useEffect } from 'react';
import { getVentasConResiduos } from '../services/ventasService';
import {
  Calendar,
  Search,
  Package,
  Recycle,
  AlertTriangle,
  Loader2,
  ShoppingCart
} from 'lucide-react';

const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const VentasPorMes = ({ año = 2024, refreshTrigger }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(1);
  const [productos, setProductos] = useState([]);
  const [totales, setTotales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

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
    fetchVentasConResiduos();
  }, [año, mesSeleccionado, refreshTrigger]);

  const fetchVentasConResiduos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getVentasConResiduos(año, mesSeleccionado);
      setProductos(response.data);
      setTotales(response.totales);
    } catch (err) {
      setError('Error cargando ventas del mes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(producto =>
    producto.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>LUB Detallado por Mes</h3>
        <p style={styles.description}>Productos con cálculo de residuos</p>
      </div>

      <div style={styles.filters}>
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
            <Search size={14} />
            <span>Buscar</span>
          </label>
          <input
            type="text"
            placeholder="SKU o nombre del producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingState}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Cargando datos y calculando residuos...</span>
          </div>
        )}

        {error && (
          <div style={styles.errorState}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && productos.length === 0 && (
          <div style={styles.emptyState}>
            <ShoppingCart size={32} strokeWidth={1.5} />
            <span>No hay datos registrados para este mes</span>
          </div>
        )}

        {!loading && !error && productos.length > 0 && totales && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <Package size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Productos</span>
                  <span style={styles.statValue}>{formatNumber(totales.productos, 0)}</span>
                </div>
              </div>

              <div style={{...styles.statCard, ...styles.statSuccess}}>
                <div style={{...styles.statIcon, ...styles.statIconSuccess}}>
                  <Recycle size={20} />
                </div>
                <div style={styles.statContent}>
                  <span style={styles.statLabel}>Residuos Totales</span>
                  <span style={styles.statValue}>{formatNumber(totales.residuosTotales)} kg</span>
                  <span style={styles.statDetail}>
                    Plásticos: {formatNumber(totales.plasticos)} kg | Papel: {formatNumber(totales.papelCarton)} kg | Metales: {formatNumber(totales.metales)} kg
                  </span>
                </div>
              </div>

              {totales.productosSinMapeo > 0 && (
                <div style={{...styles.statCard, ...styles.statWarning}}>
                  <div style={{...styles.statIcon, ...styles.statIconWarning}}>
                    <AlertTriangle size={20} />
                  </div>
                  <div style={styles.statContent}>
                    <span style={styles.statLabel}>Sin Mapeo</span>
                    <span style={styles.statValue}>{totales.productosSinMapeo}</span>
                    <span style={styles.statDetail}>productos sin datos de residuos</span>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.tableSection}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>SKU</th>
                      <th style={styles.th}>Producto</th>
                      <th style={styles.th}>Envase</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Volumen (L)</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Unidades</th>
                      <th style={styles.th}>Tipo Envase</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Residuos (kg)</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Plásticos</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Papel</th>
                      <th style={{...styles.th, textAlign: 'right'}}>Metales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map((producto, index) => (
                      <tr key={producto.sku} style={styles.tr}>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.tdCode}>{producto.sku}</td>
                        <td style={styles.td}>{producto.nombre}</td>
                        <td style={styles.td}>{producto.envase}</td>
                        <td style={styles.tdNumber}>{formatNumber(producto.volumen)}</td>
                        <td style={styles.tdNumber}>{formatNumber(producto.unidades, 0)}</td>
                        <td style={styles.td}>
                          {producto.tipoEnvaseMapeado || (
                            <span style={styles.sinMapeo}>Sin mapeo</span>
                          )}
                        </td>
                        <td style={producto.residuos ? styles.tdNumber : styles.tdEmpty}>
                          {producto.residuos ? formatNumber(producto.residuos.totalKg) : '-'}
                        </td>
                        <td style={styles.tdNumber}>
                          {producto.residuos ? formatNumber(producto.residuos.plasticos) : '-'}
                        </td>
                        <td style={styles.tdNumber}>
                          {producto.residuos ? formatNumber(producto.residuos.papelCarton) : '-'}
                        </td>
                        <td style={styles.tdNumber}>
                          {producto.residuos ? formatNumber(producto.residuos.metales) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
  searchInput: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    minWidth: '250px'
  },
  content: {
    padding: 'var(--spacing-lg)',
    minHeight: '500px'
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
    alignItems: 'flex-start',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-accent-light)',
    borderRadius: 'var(--radius-md)'
  },
  statSuccess: {
    backgroundColor: 'var(--color-success-light)'
  },
  statWarning: {
    backgroundColor: 'var(--color-warning-light)'
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent)',
    color: 'white',
    flexShrink: 0
  },
  statIconSuccess: {
    backgroundColor: 'var(--color-success)'
  },
  statIconWarning: {
    backgroundColor: 'var(--color-warning)'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
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
  statDetail: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)',
    marginTop: 'var(--spacing-xs)'
  },
  tableSection: {
    marginTop: 'var(--spacing-md)'
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '500px',
    overflowY: 'auto',
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
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1
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
    fontWeight: '500',
    color: 'var(--color-accent)'
  },
  tdNumber: {
    padding: 'var(--spacing-md)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--color-text-primary)'
  },
  tdEmpty: {
    padding: 'var(--spacing-md)',
    textAlign: 'right',
    color: 'var(--color-text-muted)'
  },
  sinMapeo: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-warning)',
    fontStyle: 'italic'
  }
};

export default VentasPorMes;
