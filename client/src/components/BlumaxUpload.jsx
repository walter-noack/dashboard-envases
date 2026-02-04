import { useState, useEffect } from 'react';
import { uploadExcelBlumax, uploadExcelBlumaxMensual, getEstadoMesesBlumax } from '../services/ventasService';
import {
  Upload,
  Factory,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

const BlumaxUpload = ({ onUploadSuccess, año = 2025 }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tipoCarga, setTipoCarga] = useState('anual');
  const [mesDestino, setMesDestino] = useState(1);
  const [añoDestino, setAñoDestino] = useState(año);
  const [estadoMeses, setEstadoMeses] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

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
    setAñoDestino(año);
    cargarEstadoMeses(año);
  }, [año]);

  const cargarEstadoMeses = async (añoParam) => {
    try {
      const response = await getEstadoMesesBlumax(añoParam);
      if (response.success) {
        setEstadoMeses(response.data.meses);
      }
    } catch (error) {
      console.error('Error cargando estado de meses Blumax:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage({ type: '', text: '' });
    }
  };

  const verificarYSubir = () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
      return;
    }

    if (tipoCarga === 'mensual' && estadoMeses) {
      const mesInfo = estadoMeses.find(m => m.mes === mesDestino);
      if (mesInfo?.cargado) {
        const mesNombre = meses.find(m => m.num === mesDestino)?.nombre;
        setConfirmacion({
          mes: mesNombre,
          año: añoDestino,
          registros: mesInfo.registros
        });
        return;
      }
    }

    ejecutarUpload();
  };

  const ejecutarUpload = async () => {
    setConfirmacion(null);
    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      let result;

      if (tipoCarga === 'mensual') {
        result = await uploadExcelBlumaxMensual(file, añoDestino, mesDestino, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        result = await uploadExcelBlumax(file, (progress) => {
          setUploadProgress(progress);
        });
      }

      const mesNombre = tipoCarga === 'mensual' ? meses.find(m => m.num === mesDestino)?.nombre : '';
      setMessage({
        type: 'success',
        text: tipoCarga === 'mensual'
          ? `${result.data.registrosInsertados} registros cargados para ${mesNombre} ${añoDestino}`
          : `${result.data.registrosInsertados} registros Bluemax cargados`
      });

      setFile(null);
      document.getElementById('blumax-file-input').value = '';

      cargarEstadoMeses(añoDestino);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Error: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTipoCargaChange = (tipo) => {
    setTipoCarga(tipo);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Factory size={20} style={styles.headerIcon} />
        <h3 style={styles.title}>Cargar Datos Bluemax</h3>
      </div>

      {/* Selector de tipo de carga */}
      <div style={styles.tipoSelector}>
        <button
          onClick={() => handleTipoCargaChange('anual')}
          style={{
            ...styles.tipoButton,
            ...(tipoCarga === 'anual' ? styles.tipoButtonActive : {})
          }}
        >
          Carga Anual
        </button>
        <button
          onClick={() => handleTipoCargaChange('mensual')}
          style={{
            ...styles.tipoButton,
            ...(tipoCarga === 'mensual' ? styles.tipoButtonActive : {})
          }}
        >
          Carga Mensual
        </button>
      </div>

      {/* Selectores de período para carga mensual */}
      {tipoCarga === 'mensual' && (
        <div style={styles.periodoSection}>
          <div style={styles.periodoSelectors}>
            <div style={styles.selectorGroup}>
              <label style={styles.selectorLabel}>Año destino</label>
              <select
                value={añoDestino}
                onChange={(e) => {
                  const nuevoAño = parseInt(e.target.value);
                  setAñoDestino(nuevoAño);
                  cargarEstadoMeses(nuevoAño);
                }}
                style={styles.select}
              >
                {[año - 1, año, año + 1].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div style={styles.selectorGroup}>
              <label style={styles.selectorLabel}>Mes destino</label>
              <select
                value={mesDestino}
                onChange={(e) => setMesDestino(parseInt(e.target.value))}
                style={styles.select}
              >
                {meses.map(mes => (
                  <option key={mes.num} value={mes.num}>
                    {mes.nombre} {estadoMeses?.find(m => m.mes === mes.num)?.cargado ? '✓' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para sobreescribir */}
      {confirmacion && (
        <div style={styles.confirmacionOverlay}>
          <div style={styles.confirmacionBox}>
            <div style={styles.confirmacionHeader}>
              <AlertCircle size={20} color="#f59e0b" />
              <span>Confirmar sobreescritura</span>
              <button
                onClick={() => setConfirmacion(null)}
                style={styles.closeButton}
              >
                <X size={16} />
              </button>
            </div>
            <p style={styles.confirmacionText}>
              <strong>{confirmacion.mes} {confirmacion.año}</strong> ya tiene{' '}
              <strong>{confirmacion.registros.toLocaleString('es-CL')}</strong> registros cargados.
              <br />
              ¿Desea sobreescribir la información?
            </p>
            <div style={styles.confirmacionButtons}>
              <button
                onClick={() => setConfirmacion(null)}
                style={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarUpload}
                style={styles.confirmButton}
              >
                Sobreescribir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Área de upload */}
      <div style={styles.uploadArea}>
        <label htmlFor="blumax-file-input" style={styles.dropZone}>
          <Upload size={18} style={styles.dropIcon} />
          <span style={styles.dropText}>
            {file ? file.name : 'Seleccionar archivo Excel'}
          </span>
          <input
            id="blumax-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={styles.inputHidden}
            disabled={uploading}
          />
        </label>

        <button
          onClick={verificarYSubir}
          disabled={!file || uploading}
          style={{
            ...styles.button,
            ...((!file || uploading) && styles.buttonDisabled)
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={18} style={styles.spinner} />
              <span>Cargando...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Subir</span>
            </>
          )}
        </button>
      </div>

      {uploading && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${uploadProgress}%`
              }}
            />
          </div>
          <span style={styles.progressText}>{uploadProgress}%</span>
        </div>
      )}

      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
        }}>
          {message.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    position: 'relative'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: '#1e3a5f'
  },
  headerIcon: {
    color: '#60a5fa'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'white'
  },
  tipoSelector: {
    display: 'flex',
    gap: '2px',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    backgroundColor: 'var(--color-bg)'
  },
  tipoButton: {
    flex: 1,
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    borderRadius: 'var(--radius-md)'
  },
  tipoButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb'
  },
  periodoSection: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-bg)'
  },
  periodoSelectors: {
    display: 'flex',
    gap: 'var(--spacing-md)'
  },
  selectorGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  },
  selectorLabel: {
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
    minWidth: '120px'
  },
  uploadArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    minHeight: '60px'
  },
  dropZone: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-bg)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    flex: 1
  },
  dropIcon: {
    color: 'var(--color-text-muted)',
    flexShrink: 0
  },
  dropText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  inputHidden: {
    display: 'none'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)'
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-border)',
    cursor: 'not-allowed'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border-light)'
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: 'var(--color-border-light)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    transition: 'width 0.3s ease',
    borderRadius: 'var(--radius-full)'
  },
  progressText: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    minWidth: '36px'
  },
  message: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border-light)',
    fontSize: 'var(--font-size-sm)'
  },
  messageSuccess: {
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)'
  },
  messageError: {
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)'
  },
  confirmacionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 'var(--radius-lg)'
  },
  confirmacionBox: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    margin: 'var(--spacing-md)',
    maxWidth: '320px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  confirmacionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-md)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  closeButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmacionText: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 'var(--spacing-lg)'
  },
  confirmacionButtons: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  },
  confirmButton: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  }
};

export default BlumaxUpload;
