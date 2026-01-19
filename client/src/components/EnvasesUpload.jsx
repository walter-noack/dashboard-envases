import { useState } from 'react';
import { uploadEnvases } from '../services/ventasService';

const EnvasesUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
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
    setMessage({ type: '', text: '' });

    try {
      const result = await uploadEnvases(file);
      setMessage({
        type: 'success',
        text: `${result.data?.mensaje || result.mensaje || 'Envases cargados correctamente'}`
      });
      setFile(null);

      // Limpiar input
      document.getElementById('envases-file-input').value = '';

      // Notificar al componente padre
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
      <h3 style={styles.title}>Cargar Datos de Envases</h3>
      <p style={styles.description}>
        Sube el archivo Excel con la información de envases y sus componentes para calcular residuos.
      </p>

      <div style={styles.uploadArea}>
        <input
          id="envases-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={styles.input}
          disabled={uploading}
        />

        {file && (
          <p style={styles.fileName}>
            Archivo seleccionado: <strong>{file.name}</strong>
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            ...styles.button,
            ...((!file || uploading) && styles.buttonDisabled)
          }}
        >
          {uploading ? 'Cargando...' : 'Subir Envases'}
        </button>
      </div>

      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff8e1',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffe082'
  },
  title: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#f57c00'
  },
  description: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px'
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  input: {
    padding: '10px',
    border: '2px dashed #ffb74d',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'white'
  },
  fileName: {
    margin: '5px 0',
    color: '#666',
    fontSize: '14px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  message: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  messageError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  }
};

export default EnvasesUpload;
