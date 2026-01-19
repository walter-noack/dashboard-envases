import { useState } from 'react';
import { uploadExcel } from '../services/ventasService';

const FileUpload = ({ onUploadSuccess }) => {
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
      const result = await uploadExcel(file);
      setMessage({ 
        type: 'success', 
        text: `✅ ${result.data.registrosInsertados} registros cargados correctamente` 
      });
      setFile(null);
      
      // Limpiar input
      document.getElementById('file-input').value = '';
      
      // Notificar al componente padre
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ Error: ${error.response?.data?.message || error.message}` 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📊 Cargar Datos de Ventas</h3>
      
      <div style={styles.uploadArea}>
        <input
          id="file-input"
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
          {uploading ? '⏳ Cargando...' : '📤 Subir Excel'}
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
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  title: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#333'
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  input: {
    padding: '10px',
    border: '2px dashed #ccc',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  fileName: {
    margin: '5px 0',
    color: '#666',
    fontSize: '14px'
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
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

export default FileUpload;