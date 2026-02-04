import { useState } from 'react';
import { PlusCircle, Trash2, Save, AlertCircle, CheckCircle, Loader, X } from 'lucide-react';
import { guardarRegistros } from '../services/monitoringService';

const CATEGORIAS = {
  'Papel_y_Cartón': ['Papel blanco', 'Revistas couche', 'Diario', 'Otros papeles', 'Cartón', 'Pulpa Moldeada', 'Duplex', 'CARTON OCC'],
  'Plásticos_Flexibles': ['LDPE (4)', 'PP (5)', 'OTROS (7)', 'PLASTICO MIXTO PE'],
  'Plásticos_Rígidos': ['PET (1)', 'HDPE (2)', 'PVC (3)', 'LDPE (4)', 'PP (5)', 'PS (6)', 'OTROS (7)', 'PLASTICO PET', 'PLASTICO HDPE'],
  'Metales': ['Hojalatas', 'Latas aluminio', 'Otros metales', 'METAL FERROSO', 'ALUMINIO']
};

const DEFAULT_RUT_EMPRESA = '99520000-7';

const MonitoringManualForm = ({ isOpen, onClose, onSuccess }) => {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [formData, setFormData] = useState({
    rutEmpresa: DEFAULT_RUT_EMPRESA,
    idEstablecimientoEmpresa: '',
    rutGestor: '',
    nombreGestor: '',
    idEstablecimientoGestor: '',
    tipoDTE: '33',
    numeroDTE: '',
    fechaDTE: new Date().toISOString().split('T')[0],
    items: [{ subCategoria: 'Papel_y_Cartón', materialidad: 'Cartón', toneladas: '' }]
  });

  const resetForm = () => {
    setFormData({
      rutEmpresa: DEFAULT_RUT_EMPRESA,
      idEstablecimientoEmpresa: '',
      rutGestor: '',
      nombreGestor: '',
      idEstablecimientoGestor: '',
      tipoDTE: '33',
      numeroDTE: '',
      fechaDTE: new Date().toISOString().split('T')[0],
      items: [{ subCategoria: 'Papel_y_Cartón', materialidad: 'Cartón', toneladas: '' }]
    });
    setError(null);
    setExito(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setExito(null);
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        if (field === 'subCategoria') {
          return { ...item, [field]: value, materialidad: CATEGORIAS[value][0] };
        }
        return { ...item, [field]: value };
      })
    }));
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { subCategoria: 'Papel_y_Cartón', materialidad: 'Cartón', toneladas: '' }]
    }));
  };

  const eliminarItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getMesFromDate = (dateStr) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const date = new Date(dateStr);
    return meses[date.getMonth()];
  };

  const handleSubmit = async () => {
    if (!formData.rutGestor.trim()) {
      setError('El RUT del gestor es requerido');
      return;
    }
    if (!formData.numeroDTE.trim()) {
      setError('El número de documento es requerido');
      return;
    }
    if (!formData.fechaDTE) {
      setError('La fecha es requerida');
      return;
    }

    const itemsValidos = formData.items.filter(item =>
      item.toneladas && parseFloat(item.toneladas) > 0
    );

    if (itemsValidos.length === 0) {
      setError('Debe agregar al menos un material con toneladas');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const fecha = new Date(formData.fechaDTE);
      const registros = itemsValidos.map(item => ({
        rutEmpresa: formData.rutEmpresa,
        idEstablecimientoEmpresa: formData.idEstablecimientoEmpresa,
        periodo: getMesFromDate(formData.fechaDTE),
        anio: fecha.getFullYear(),
        rutGestor: formData.rutGestor,
        nombreGestor: formData.nombreGestor,
        idEstablecimientoGestor: formData.idEstablecimientoGestor,
        tipoDTE: formData.tipoDTE,
        numeroDTE: formData.numeroDTE,
        fechaDTE: fecha.toISOString(),
        subCategoria: item.subCategoria,
        materialidad: item.materialidad,
        toneladas: parseFloat(item.toneladas),
        origen: 'MANUAL',
        archivoOriginal: 'Ingreso manual'
      }));

      const response = await guardarRegistros(registros);

      if (response.success) {
        setExito(`Se guardaron ${registros.length} registros correctamente`);
        resetForm();
        if (onSuccess) {
          onSuccess(response);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al guardar los registros');
    } finally {
      setGuardando(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const monitoringColor = '#059669';

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Ingreso Manual de Datos</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Datos de la empresa */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos de la Empresa</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>RUT Empresa</label>
                <input
                  type="text"
                  value={formData.rutEmpresa}
                  onChange={(e) => handleChange('rutEmpresa', e.target.value)}
                  placeholder="Ej: 99520000-7"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>ID Establecimiento</label>
                <input
                  type="text"
                  value={formData.idEstablecimientoEmpresa}
                  onChange={(e) => handleChange('idEstablecimientoEmpresa', e.target.value)}
                  placeholder="ID del establecimiento"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Datos del documento */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos del Documento</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Tipo DTE</label>
                <select
                  value={formData.tipoDTE}
                  onChange={(e) => handleChange('tipoDTE', e.target.value)}
                  style={styles.select}
                >
                  <option value="33">Factura Electrónica (33)</option>
                  <option value="34">Factura Exenta (34)</option>
                  <option value="52">Guía de Despacho (52)</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>N° Documento *</label>
                <input
                  type="text"
                  value={formData.numeroDTE}
                  onChange={(e) => handleChange('numeroDTE', e.target.value)}
                  placeholder="Ej: 12345"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Fecha *</label>
                <input
                  type="date"
                  value={formData.fechaDTE}
                  onChange={(e) => handleChange('fechaDTE', e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Datos del gestor */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Datos del Gestor</h4>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>RUT Gestor *</label>
                <input
                  type="text"
                  value={formData.rutGestor}
                  onChange={(e) => handleChange('rutGestor', e.target.value)}
                  placeholder="Ej: 76123456-7"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>ID Establecimiento</label>
                <input
                  type="text"
                  value={formData.idEstablecimientoGestor}
                  onChange={(e) => handleChange('idEstablecimientoGestor', e.target.value)}
                  placeholder="ID establecimiento gestor"
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.field, flex: 2 }}>
                <label style={styles.label}>Nombre Gestor</label>
                <input
                  type="text"
                  value={formData.nombreGestor}
                  onChange={(e) => handleChange('nombreGestor', e.target.value)}
                  placeholder="Nombre del gestor de residuos"
                  style={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Materiales */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h4 style={styles.sectionTitle}>Materiales</h4>
              <button onClick={agregarItem} style={styles.addButton}>
                <PlusCircle size={14} />
                Agregar
              </button>
            </div>

            <div style={styles.itemsContainer}>
              {formData.items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <div style={styles.itemField}>
                    <label style={styles.smallLabel}>Categoría</label>
                    <select
                      value={item.subCategoria}
                      onChange={(e) => handleItemChange(index, 'subCategoria', e.target.value)}
                      style={styles.selectSmall}
                    >
                      {Object.keys(CATEGORIAS).map(cat => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ ...styles.itemField, flex: 2 }}>
                    <label style={styles.smallLabel}>Material</label>
                    <select
                      value={item.materialidad}
                      onChange={(e) => handleItemChange(index, 'materialidad', e.target.value)}
                      style={styles.selectSmall}
                    >
                      {CATEGORIAS[item.subCategoria]?.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ ...styles.itemField, maxWidth: '100px' }}>
                    <label style={styles.smallLabel}>Toneladas</label>
                    <input
                      type="number"
                      step="0.001"
                      value={item.toneladas}
                      onChange={(e) => handleItemChange(index, 'toneladas', e.target.value)}
                      placeholder="0.000"
                      style={styles.inputSmall}
                    />
                  </div>
                  <button
                    onClick={() => eliminarItem(index)}
                    style={styles.deleteItemButton}
                    disabled={formData.items.length <= 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {exito && (
            <div style={styles.successBox}>
              <CheckCircle size={16} />
              <span>{exito}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={handleClose} style={styles.cancelButton}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={guardando}
            style={{
              ...styles.saveButton,
              backgroundColor: guardando ? '#9ca3af' : monitoringColor
            }}
          >
            {guardando ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Registro
              </>
            )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
    width: '32px',
    height: '32px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-text-muted)'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--spacing-lg)'
  },
  section: {
    marginBottom: 'var(--spacing-lg)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-sm)'
  },
  sectionTitle: {
    margin: '0 0 var(--spacing-sm) 0',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  row: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    flexWrap: 'wrap'
  },
  field: {
    flex: 1,
    minWidth: '140px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)'
  },
  smallLabel: {
    display: 'block',
    marginBottom: '2px',
    fontSize: '10px',
    color: 'var(--color-text-muted)'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  inputSmall: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 'var(--font-size-xs)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  selectSmall: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 'var(--font-size-xs)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer'
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)'
  },
  itemField: {
    flex: 1,
    minWidth: '80px'
  },
  deleteItemButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    backgroundColor: 'transparent',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: '#dc2626',
    flexShrink: 0
  },
  errorBox: {
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
  successBox: {
    padding: 'var(--spacing-md)',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    color: '#16a34a',
    fontSize: 'var(--font-size-sm)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-lg)',
    borderTop: '1px solid var(--color-border)'
  },
  cancelButton: {
    padding: '10px 20px',
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
    padding: '10px 20px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  }
};

export default MonitoringManualForm;
