import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, X, File, ClipboardEdit } from 'lucide-react';
import { parsePDF } from '../services/monitoringService';
import MonitoringEditModal from './MonitoringEditModal';
import MonitoringManualForm from './MonitoringManualForm';

const MonitoringUpload = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [archivoActualIndex, setArchivoActualIndex] = useState(-1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [datosParaEditar, setDatosParaEditar] = useState(null);
  const fileInputRef = useRef(null);
  const processingRef = useRef(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      agregarArchivos(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      agregarArchivos(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const agregarArchivos = (files) => {
    const nuevosArchivos = files.map(file => ({
      file,
      nombre: file.name,
      estado: 'pendiente',
      error: null,
      datosExtraidos: null
    }));

    setArchivos(prev => [...prev, ...nuevosArchivos]);
  };

  const procesarSiguienteArchivo = async () => {
    if (processingRef.current) return;

    const indexPendiente = archivos.findIndex(a => a.estado === 'pendiente');
    if (indexPendiente === -1) return;

    processingRef.current = true;
    setArchivoActualIndex(indexPendiente);

    setArchivos(prev => prev.map((a, i) =>
      i === indexPendiente ? { ...a, estado: 'procesando' } : a
    ));

    try {
      const response = await parsePDF(archivos[indexPendiente].file, 'LUB');

      if (response.success) {
        setArchivos(prev => prev.map((a, i) =>
          i === indexPendiente ? {
            ...a,
            estado: 'editando',
            datosExtraidos: response.datosExtraidos,
            documentoExistente: response.documentoExistente
          } : a
        ));

        setDatosParaEditar({
          datosExtraidos: response.datosExtraidos,
          origen: response.origen,
          archivoOriginal: response.archivoOriginal,
          documentoExistente: response.documentoExistente
        });
        setShowEditModal(true);
      } else {
        setArchivos(prev => prev.map((a, i) =>
          i === indexPendiente ? { ...a, estado: 'error', error: response.message } : a
        ));
        processingRef.current = false;
        setTimeout(() => procesarSiguienteArchivo(), 100);
      }
    } catch (err) {
      console.error('Error:', err);
      setArchivos(prev => prev.map((a, i) =>
        i === indexPendiente ? {
          ...a,
          estado: 'error',
          error: err.response?.data?.message || 'Error al procesar'
        } : a
      ));
      processingRef.current = false;
      setTimeout(() => procesarSiguienteArchivo(), 100);
    }
  };

  const iniciarProcesamiento = () => {
    if (!processingRef.current && archivos.some(a => a.estado === 'pendiente')) {
      procesarSiguienteArchivo();
    }
  };

  const handleEditSuccess = (response) => {
    setShowEditModal(false);
    setDatosParaEditar(null);

    setArchivos(prev => prev.map((a, i) =>
      i === archivoActualIndex ? { ...a, estado: 'completado' } : a
    ));

    if (onUploadSuccess) {
      onUploadSuccess(response);
    }

    processingRef.current = false;
    setTimeout(() => procesarSiguienteArchivo(), 100);
  };

  const handleEditClose = () => {
    setShowEditModal(false);
    setDatosParaEditar(null);

    setArchivos(prev => prev.map((a, i) =>
      i === archivoActualIndex ? { ...a, estado: 'error', error: 'Cancelado por usuario' } : a
    ));

    processingRef.current = false;
    setTimeout(() => procesarSiguienteArchivo(), 100);
  };

  const handleManualSuccess = (response) => {
    if (onUploadSuccess) {
      onUploadSuccess(response);
    }
  };

  const removerArchivo = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const limpiarCompletados = () => {
    setArchivos(prev => prev.filter(a => a.estado !== 'completado' && a.estado !== 'error'));
  };

  const monitoringColor = '#059669';

  const totalArchivos = archivos.length;
  const completados = archivos.filter(a => a.estado === 'completado').length;
  const errores = archivos.filter(a => a.estado === 'error').length;
  const progreso = totalArchivos > 0 ? ((completados + errores) / totalArchivos) * 100 : 0;
  const hayPendientes = archivos.some(a => a.estado === 'pendiente');
  const hayProcesando = archivos.some(a => a.estado === 'procesando' || a.estado === 'editando');

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={{ ...styles.headerIcon, backgroundColor: `${monitoringColor}15`, color: monitoringColor }}>
            <FileText size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={styles.title}>Cargar Datos de Monitoring</h3>
            <p style={styles.subtitle}>Facturas PDF o ingreso manual</p>
          </div>
          <button
            onClick={() => setShowManualModal(true)}
            style={styles.manualButton}
          >
            <ClipboardEdit size={16} />
            Ingreso Manual
          </button>
        </div>

        <div
          style={{
            ...styles.dropzone,
            ...(isDragging ? styles.dropzoneDragging : {}),
            borderColor: isDragging ? monitoringColor : 'var(--color-border)'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <Upload size={32} color="var(--color-text-muted)" />
          <p style={styles.dropzoneText}>
            Arrastra PDFs aquí o <span style={{ color: monitoringColor, fontWeight: 500 }}>selecciona</span>
          </p>
          <p style={styles.dropzoneHint}>Puedes seleccionar múltiples archivos</p>
        </div>

        {archivos.length > 0 && (
          <div style={styles.fileList}>
            <div style={styles.fileListHeader}>
              <span style={styles.fileListTitle}>
                Archivos ({completados}/{totalArchivos} completados)
              </span>
              <div style={styles.fileListActions}>
                {hayPendientes && !hayProcesando && (
                  <button onClick={iniciarProcesamiento} style={styles.startButton}>
                    Procesar
                  </button>
                )}
                {(completados > 0 || errores > 0) && (
                  <button onClick={limpiarCompletados} style={styles.clearButton}>
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {totalArchivos > 0 && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progreso}%`,
                      backgroundColor: errores > 0 && completados === 0 ? '#dc2626' : monitoringColor
                    }}
                  />
                </div>
                <span style={styles.progressText}>{Math.round(progreso)}%</span>
              </div>
            )}

            <div style={styles.fileItems}>
              {archivos.map((archivo, index) => (
                <div key={index} style={styles.fileItem}>
                  <File size={16} color="var(--color-text-muted)" />
                  <span style={styles.fileName}>{archivo.nombre}</span>
                  <div style={styles.fileStatus}>
                    {archivo.estado === 'pendiente' && (
                      <span style={styles.statusPending}>Pendiente</span>
                    )}
                    {archivo.estado === 'procesando' && (
                      <span style={styles.statusProcessing}>
                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Procesando
                      </span>
                    )}
                    {archivo.estado === 'editando' && (
                      <span style={styles.statusEditing}>Editando...</span>
                    )}
                    {archivo.estado === 'completado' && (
                      <span style={styles.statusCompleted}>
                        <CheckCircle size={14} />
                        Completado
                      </span>
                    )}
                    {archivo.estado === 'error' && (
                      <span style={styles.statusError} title={archivo.error}>
                        <AlertCircle size={14} />
                        Error
                      </span>
                    )}
                  </div>
                  {(archivo.estado === 'pendiente' || archivo.estado === 'error') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removerArchivo(index); }}
                      style={styles.removeButton}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditModal && datosParaEditar && (
        <MonitoringEditModal
          datosExtraidos={datosParaEditar.datosExtraidos}
          origen={datosParaEditar.origen}
          archivoOriginal={datosParaEditar.archivoOriginal}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}

      <MonitoringManualForm
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={handleManualSuccess}
      />
    </>
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
    marginBottom: 'var(--spacing-lg)'
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
  manualButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap'
  },
  dropzone: {
    border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-xl)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-sm)'
  },
  dropzoneDragging: {
    backgroundColor: 'var(--color-accent-light)'
  },
  dropzoneText: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  dropzoneHint: {
    margin: 0,
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)'
  },
  fileList: {
    marginTop: 'var(--spacing-lg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden'
  },
  fileListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)'
  },
  fileListTitle: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'var(--color-text-primary)'
  },
  fileListActions: {
    display: 'flex',
    gap: 'var(--spacing-sm)'
  },
  startButton: {
    padding: '4px 12px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer'
  },
  clearButton: {
    padding: '4px 12px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    backgroundColor: 'var(--color-border)',
    color: 'var(--color-text-secondary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)'
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: 'var(--color-border)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    minWidth: '35px',
    textAlign: 'right'
  },
  fileItems: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderBottom: '1px solid var(--color-border)'
  },
  fileName: {
    flex: 1,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fileStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--font-size-xs)'
  },
  statusPending: {
    color: 'var(--color-text-muted)'
  },
  statusProcessing: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#f59e0b'
  },
  statusEditing: {
    color: '#3b82f6'
  },
  statusCompleted: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#059669'
  },
  statusError: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#dc2626'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    borderRadius: '4px'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default MonitoringUpload;
