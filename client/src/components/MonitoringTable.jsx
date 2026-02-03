import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Trash2, Loader, AlertCircle, Calendar } from 'lucide-react';
import { getResumen, exportarExcel, limpiarDatos } from '../services/monitoringService';

const MonitoringTable = ({ origen = null, año, refreshTrigger }) => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMes, setSelectedMes] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [limpiando, setLimpiando] = useState(false);
  const [showConfirmLimpiar, setShowConfirmLimpiar] = useState(false);

  const meses = [
    { value: 0, label: 'Todo el año' },
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  useEffect(() => {
    cargarDatos();
  }, [año, selectedMes, origen, refreshTrigger]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { anio: año };
      if (selectedMes > 0) params.mes = selectedMes;
      if (origen) params.origen = origen;

      const response = await getResumen(params);
      setDatos(response);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos de monitoring');
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      const params = { anio: año };
      if (selectedMes > 0) params.mes = selectedMes;
      if (origen) params.origen = origen;

      await exportarExcel(params);
    } catch (err) {
      console.error('Error exportando:', err);
      alert('Error al exportar el archivo');
    } finally {
      setExportando(false);
    }
  };

  const handleLimpiar = async () => {
    setLimpiando(true);
    try {
      const params = { anio: año };
      if (origen) params.origen = origen;

      await limpiarDatos(params);
      setShowConfirmLimpiar(false);
      cargarDatos();
    } catch (err) {
      console.error('Error limpiando:', err);
      alert('Error al limpiar los datos');
    } finally {
      setLimpiando(false);
    }
  };

  const monitoringColor = '#059669';

  // Agrupar datos por subcategoría
  const datosAgrupados = {};
  if (datos?.resumen) {
    datos.resumen.forEach(item => {
      if (!datosAgrupados[item.subCategoria]) {
        datosAgrupados[item.subCategoria] = [];
      }
      datosAgrupados[item.subCategoria].push(item);
    });
  }

  const categoriaColors = {
    'Papel_y_Cartón': '#854d0e',
    'Plásticos_Flexibles': '#9333ea',
    'Plásticos_Rígidos': '#2563eb',
    'Metales': '#475569'
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={{ ...styles.headerIcon, backgroundColor: `${monitoringColor}15`, color: monitoringColor }}>
          <FileSpreadsheet size={20} />
        </div>
        <div style={styles.headerText}>
          <h3 style={styles.title}>Monitoring</h3>
          <p style={styles.subtitle}>Residuos declarados a gestores</p>
        </div>

        <div style={styles.controls}>
          <div style={styles.mesSelector}>
            <Calendar size={16} color="var(--color-text-muted)" />
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(parseInt(e.target.value))}
              style={styles.select}
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportar}
            disabled={exportando || !datos?.resumen?.length}
            style={{
              ...styles.exportButton,
              opacity: exportando || !datos?.resumen?.length ? 0.5 : 1
            }}
          >
            {exportando ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
            Exportar Excel
          </button>

          <button
            onClick={() => setShowConfirmLimpiar(true)}
            disabled={!datos?.resumen?.length}
            style={{
              ...styles.deleteButton,
              opacity: !datos?.resumen?.length ? 0.5 : 1
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} color={monitoringColor} />
          <span>Cargando datos...</span>
        </div>
      ) : error ? (
        <div style={styles.errorState}>
          <AlertCircle size={24} color="#dc2626" />
          <span>{error}</span>
        </div>
      ) : !datos?.resumen?.length ? (
        <div style={styles.emptyState}>
          <FileSpreadsheet size={48} color="var(--color-text-muted)" />
          <p>No hay datos de monitoring para este período</p>
          <p style={styles.emptyHint}>Sube facturas PDF para comenzar</p>
        </div>
      ) : (
        <>
          {/* Totales */}
          <div style={styles.totalesRow}>
            {Object.entries(datos.totalesPorCategoria || {}).map(([cat, total]) => (
              <div key={cat} style={{ ...styles.totalCard, borderColor: categoriaColors[cat] || '#666' }}>
                <span style={{ ...styles.totalLabel, color: categoriaColors[cat] || '#666' }}>
                  {cat.replace(/_/g, ' ')}
                </span>
                <span style={styles.totalValue}>{total.toFixed(3)} ton</span>
              </div>
            ))}
            <div style={{ ...styles.totalCard, borderColor: monitoringColor, backgroundColor: `${monitoringColor}08` }}>
              <span style={{ ...styles.totalLabel, color: monitoringColor }}>Total General</span>
              <span style={{ ...styles.totalValue, color: monitoringColor }}>{datos.totalGeneral?.toFixed(3)} ton</span>
            </div>
          </div>

          {/* Tabla detallada */}
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Subcategoría</th>
                  <th style={styles.th}>Material</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Toneladas</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Documentos</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(datosAgrupados).map(([categoria, items]) => (
                  items.map((item, idx) => (
                    <tr key={`${categoria}-${idx}`} style={styles.tr}>
                      {idx === 0 && (
                        <td
                          style={{
                            ...styles.td,
                            ...styles.categoriaCell,
                            borderLeftColor: categoriaColors[categoria] || '#666'
                          }}
                          rowSpan={items.length}
                        >
                          {categoria.replace(/_/g, ' ')}
                        </td>
                      )}
                      <td style={styles.td}>{item.materialidad}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: '500' }}>
                        {item.toneladas.toFixed(3)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        {item.documentos}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de confirmación para limpiar */}
      {showConfirmLimpiar && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h4 style={styles.modalTitle}>¿Eliminar datos de monitoring?</h4>
            <p style={styles.modalText}>
              Se eliminarán todos los registros de Monitoring del año {año}.
              Esta acción no se puede deshacer.
            </p>
            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowConfirmLimpiar(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleLimpiar}
                disabled={limpiando}
                style={styles.confirmDeleteButton}
              >
                {limpiando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    border: '1px solid var(--color-border)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)',
    flexWrap: 'wrap'
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)'
  },
  headerText: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-md)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  subtitle: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)'
  },
  mesSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)'
  },
  select: {
    padding: '4px 8px',
    fontSize: 'var(--font-size-sm)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    outline: 'none'
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-xl)',
    color: 'var(--color-text-secondary)'
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-xl)',
    color: '#dc2626'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-xl)',
    textAlign: 'center'
  },
  emptyHint: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)'
  },
  totalesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  totalCard: {
    flex: '1 1 150px',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  totalLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    textTransform: 'uppercase'
  },
  totalValue: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-size-sm)'
  },
  th: {
    padding: 'var(--spacing-md)',
    textAlign: 'left',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    borderBottom: '2px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)'
  },
  tr: {
    borderBottom: '1px solid var(--color-border)'
  },
  td: {
    padding: 'var(--spacing-md)',
    color: 'var(--color-text-primary)'
  },
  categoriaCell: {
    fontWeight: '500',
    borderLeft: '3px solid',
    backgroundColor: 'var(--color-bg)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-xl)',
    maxWidth: '400px',
    width: '90%'
  },
  modalTitle: {
    margin: '0 0 var(--spacing-md) 0',
    fontSize: 'var(--font-size-md)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  modalText: {
    margin: '0 0 var(--spacing-lg) 0',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  modalButtons: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  },
  confirmDeleteButton: {
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  }
};

export default MonitoringTable;
