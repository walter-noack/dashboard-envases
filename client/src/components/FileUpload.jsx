import { useState } from 'react';
import { uploadExcel } from '../services/ventasService';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      const result = await uploadExcel(file, (progress) => {
        setUploadProgress(progress);
      });
      setMessage({
        type: 'success',
        text: `${result.data.registrosInsertados} registros cargados correctamente`
      });
      setFile(null);
      document.getElementById('file-input').value = '';

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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FileSpreadsheet size={20} style={styles.headerIcon} />
        <h3 style={styles.title}>Cargar Datos de Ventas</h3>
      </div>

      <div style={styles.uploadArea}>
        <label htmlFor="file-input" style={styles.dropZone}>
          <Upload size={18} style={styles.dropIcon} />
          <span style={styles.dropText}>
            {file ? file.name : 'Seleccionar archivo Excel'}
          </span>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={styles.inputHidden}
            disabled={uploading}
          />
        </label>

        <button
          onClick={handleUpload}
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
              <span>Subir archivo</span>
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
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-bg)'
  },
  headerIcon: {
    color: 'var(--color-accent)'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
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
    backgroundColor: 'var(--color-accent)',
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
    backgroundColor: 'var(--color-accent)',
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
  }
};

export default FileUpload;
