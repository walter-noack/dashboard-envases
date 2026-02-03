import { useState } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { guardarRegistros } from '../services/monitoringService';

const SUBCATEGORIAS = [
  'Papel_y_Cartón',
  'Plásticos_Flexibles',
  'Plásticos_Rígidos',
  'Metales'
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonitoringEditModal = ({ datosExtraidos, origen, archivoOriginal, onClose, onSuccess }) => {
  // Datos del documento
  const [rutEmpresa, setRutEmpresa] = useState('99520000-7');
  const [idEstablecimientoEmpresa, setIdEstablecimientoEmpresa] = useState('');
  const [rutGestor, setRutGestor] = useState(datosExtraidos?.rutGestor || '');
  const [nombreGestor, setNombreGestor] = useState(datosExtraidos?.nombreGestor || '');
  const [idEstablecimientoGestor, setIdEstablecimientoGestor] = useState('');
  const [tipoDTE, setTipoDTE] = useState(datosExtraidos?.tipoDocumento || 'Factura Electrónica');
  const [numeroDTE, setNumeroDTE] = useState(datosExtraidos?.numeroDocumento || '');
  const [fechaDTE, setFechaDTE] = useState(
    datosExtraidos?.fechaEmision
      ? new Date(datosExtraidos.fechaEmision).toISOString().split('T')[0]
      : ''
  );

  // Items
  const [items, setItems] = useState(
    datosExtraidos?.items?.map((item, idx) => ({
      id: idx,
      subCategoria: item.subCategoria || 'Papel_y_Cartón',
      materialidad: item.descripcion || '',
      toneladas: item.toneladas || 0
    })) || []
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Calcular periodo y año desde la fecha
  const getPeriodoAnio = () => {
    if (!fechaDTE) return { periodo: '', anio: '' };
    const fecha = new Date(fechaDTE);
    return {
      periodo: MESES[fecha.getMonth()],
      anio: fecha.getFullYear()
    };
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      subCategoria: 'Papel_y_Cartón',
      materialidad: '',
      toneladas: 0
    }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleGuardar = async () => {
    setError(null);

    // Validaciones
    if (!rutGestor || !numeroDTE || !fechaDTE) {
      setError('Completa los campos obligatorios: RUT Gestor, N° Documento y Fecha');
      return;
    }

    if (items.length === 0) {
      setError('Debe haber al menos un item/material');
      return;
    }

    for (const item of items) {
      if (!item.materialidad || item.toneladas <= 0) {
        setError('Todos los items deben tener descripción y toneladas > 0');
        return;
      }
    }

    const { periodo, anio } = getPeriodoAnio();

    // Construir registros
    const registros = items.map(item => ({
      rutEmpresa,
      idEstablecimientoEmpresa: idEstablecimientoEmpresa ? parseInt(idEstablecimientoEmpresa) : null,
      periodo,
      anio,
      rutGestor,
      nombreGestor,
      idEstablecimientoGestor: idEstablecimientoGestor ? parseInt(idEstablecimientoGestor) : null,
      tipoDTE,
      numeroDTE: parseInt(numeroDTE),
      fechaDTE: new Date(fechaDTE),
      subCategoria: item.subCategoria,
      materialidad: item.materialidad,
      toneladas: parseFloat(item.toneladas),
      origen,
      archivoOriginal,
      guiasReferencia: datosExtraidos?.guiasReferencia || []
    }));

    setGuardando(true);
    try {
      const response = await guardarRegistros(registros);
      if (response.success) {
        onSuccess(response);
      } else {
        setError(response.message || 'Error al guardar');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los registros');
    } finally {
      setGuardando(false);
    }
  };

  const monitoringColor = '#059669';

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>Editar Datos Extraídos</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.content}>
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Datos de la Empresa */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos de la Empresa</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>RUT Empresa *</label>
                <input
                  type="text"
                  value={rutEmpresa}
                  onChange={(e) => setRutEmpresa(e.target.value)}
                  style={styles.input}
                  placeholder="99520000-7"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>ID Establecimiento</label>
                <input
                  type="number"
                  value={idEstablecimientoEmpresa}
                  onChange={(e) => setIdEstablecimientoEmpresa(e.target.value)}
                  style={styles.input}
                  placeholder="123456"
                />
              </div>
            </div>
          </div>

          {/* Datos del Gestor */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos del Gestor</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>RUT Gestor *</label>
                <input
                  type="text"
                  value={rutGestor}
                  onChange={(e) => setRutGestor(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nombre Gestor</label>
                <input
                  type="text"
                  value={nombreGestor}
                  onChange={(e) => setNombreGestor(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>ID Establecimiento</label>
                <input
                  type="number"
                  value={idEstablecimientoGestor}
                  onChange={(e) => setIdEstablecimientoGestor(e.target.value)}
                  style={styles.input}
                  placeholder="456789"
                />
              </div>
            </div>
          </div>

          {/* Datos del Documento */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos del Documento</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Tipo Documento</label>
                <select
                  value={tipoDTE}
                  onChange={(e) => setTipoDTE(e.target.value)}
                  style={styles.input}
                >
                  <option value="Factura Electrónica">Factura Electrónica</option>
                  <option value="Guía de Despacho">Guía de Despacho</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>N° Documento *</label>
                <input
                  type="number"
                  value={numeroDTE}
                  onChange={(e) => setNumeroDTE(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Fecha *</label>
                <input
                  type="date"
                  value={fechaDTE}
                  onChange={(e) => setFechaDTE(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Items/Materiales */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h4 style={styles.sectionTitle}>Materiales</h4>
              <button onClick={handleAddItem} style={styles.addButton}>
                <Plus size={16} />
                Agregar
              </button>
            </div>

            <div style={styles.itemsContainer}>
              {items.map((item, idx) => (
                <div key={item.id} style={styles.itemRow}>
                  <span style={styles.itemNumber}>{idx + 1}</span>
                  <div style={styles.field}>
                    <select
                      value={item.subCategoria}
                      onChange={(e) => handleItemChange(item.id, 'subCategoria', e.target.value)}
                      style={styles.input}
                    >
                      {SUBCATEGORIAS.map(cat => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ ...styles.field, flex: 2 }}>
                    <input
                      type="text"
                      value={item.materialidad}
                      onChange={(e) => handleItemChange(item.id, 'materialidad', e.target.value)}
                      style={styles.input}
                      placeholder="Descripción del material"
                    />
                  </div>
                  <div style={styles.field}>
                    <input
                      type="number"
                      step="0.001"
                      value={item.toneladas}
                      onChange={(e) => handleItemChange(item.id, 'toneladas', e.target.value)}
                      style={styles.input}
                      placeholder="Toneladas"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{ ...styles.saveButton, backgroundColor: monitoringColor }}
          >
            <Save size={16} />
            {guardando ? 'Guardando...' : 'Guardar Registros'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 'var(--spacing-lg)'
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border)'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--spacing-lg)'
  },
  errorBox: {
    marginBottom: 'var(--spacing-lg)',
    padding: 'var(--spacing-md)',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    color: '#dc2626',
    fontSize: 'var(--font-size-sm)'
  },
  section: {
    marginBottom: 'var(--spacing-lg)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--spacing-md)'
  },
  sectionTitle: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase'
  },
  row: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    flexWrap: 'wrap'
  },
  field: {
    flex: 1,
    minWidth: '150px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)'
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none'
  },
  addButton: {
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
    cursor: 'pointer'
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)'
  },
  itemNumber: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '600',
    backgroundColor: 'var(--color-bg)',
    borderRadius: '50%',
    color: 'var(--color-text-secondary)'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'transparent',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: '#dc2626'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    borderTop: '1px solid var(--color-border)'
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
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  }
};

export default MonitoringEditModal;
