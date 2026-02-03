import { useState } from 'react';
import { PlusCircle, Trash2, Save, AlertCircle, CheckCircle, Loader, ClipboardEdit } from 'lucide-react';
import { guardarRegistros } from '../services/monitoringService';

const CATEGORIAS = {
  'Papel_y_Cartón': ['Papel blanco', 'Revistas couche', 'Diario', 'Otros papeles', 'Cartón', 'Pulpa Moldeada', 'Duplex', 'CARTON OCC'],
  'Plásticos_Flexibles': ['LDPE (4)', 'PP (5)', 'OTROS (7)', 'PLASTICO MIXTO PE'],
  'Plásticos_Rígidos': ['PET (1)', 'HDPE (2)', 'PVC (3)', 'LDPE (4)', 'PP (5)', 'PS (6)', 'OTROS (7)', 'PLASTICO PET', 'PLASTICO HDPE'],
  'Metales': ['Hojalatas', 'Latas aluminio', 'Otros metales', 'METAL FERROSO', 'ALUMINIO']
};

const DEFAULT_RUT_EMPRESA = '99520000-7';

const MonitoringManualForm = ({ onSuccess }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const [formData, setFormData] = useState({
    rutEmpresa: DEFAULT_RUT_EMPRESA,
    rutGestor: '',
    nombreGestor: '',
    tipoDTE: '33',
    numeroDTE: '',
    fechaDTE: new Date().toISOString().split('T')[0],
    items: [{ subCategoria: 'Papel_y_Cartón', materialidad: 'Cartón', toneladas: '' }]
  });

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
          // Al cambiar categoría, resetear materialidad al primer valor
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
    // Validaciones
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
        idEstablecimientoEmpresa: '',
        periodo: getMesFromDate(formData.fechaDTE),
        anio: fecha.getFullYear(),
        rutGestor: formData.rutGestor,
        nombreGestor: formData.nombreGestor,
        idEstablecimientoGestor: '',
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
        // Limpiar formulario
        setFormData({
          rutEmpresa: DEFAULT_RUT_EMPRESA,
          rutGestor: '',
          nombreGestor: '',
          tipoDTE: '33',
          numeroDTE: '',
          fechaDTE: new Date().toISOString().split('T')[0],
          items: [{ subCategoria: 'Papel_y_Cartón', materialidad: 'Cartón', toneladas: '' }]
        });
        if (onSuccess) {
          onSuccess(response);
        }
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

  const monitoringColor = '#059669';

  return (
    <div style={styles.card}>
      <div
        style={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ ...styles.headerIcon, backgroundColor: `${monitoringColor}15`, color: monitoringColor }}>
          <ClipboardEdit size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={styles.title}>Ingreso Manual</h3>
          <p style={styles.subtitle}>Registrar datos sin factura PDF</p>
        </div>
        <button style={styles.expandButton}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div style={styles.formContainer}>
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
                <PlusCircle size={16} />
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
                      style={styles.select}
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
                      style={styles.select}
                    >
                      {CATEGORIAS[item.subCategoria]?.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.itemField}>
                    <label style={styles.smallLabel}>Toneladas</label>
                    <input
                      type="number"
                      step="0.001"
                      value={item.toneladas}
                      onChange={(e) => handleItemChange(index, 'toneladas', e.target.value)}
                      placeholder="0.000"
                      style={styles.input}
                    />
                  </div>
                  <button
                    onClick={() => eliminarItem(index)}
                    style={styles.deleteItemButton}
                    disabled={formData.items.length <= 1}
                  >
                    <Trash2 size={16} />
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

          {/* Botón guardar */}
          <div style={styles.actions}>
            <button
              onClick={handleSubmit}
              disabled={guardando}
              style={styles.saveButton}
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
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-lg)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  headerIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)'
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
  expandButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  },
  formContainer: {
    padding: '0 var(--spacing-lg) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border)'
  },
  section: {
    marginTop: 'var(--spacing-lg)'
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
    minWidth: '150px'
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
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
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
    gap: 'var(--spacing-sm)'
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
    minWidth: '100px'
  },
  deleteItemButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    backgroundColor: 'transparent',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    color: '#dc2626'
  },
  errorBox: {
    marginTop: 'var(--spacing-md)',
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
    marginTop: 'var(--spacing-md)',
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
  actions: {
    marginTop: 'var(--spacing-lg)',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: '10px 20px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  }
};

export default MonitoringManualForm;
