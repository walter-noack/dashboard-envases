import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import VentasPorMes from '../components/VentasPorMes';
import ClasificacionResiduos from '../components/ClasificacionResiduos'; 
const Dashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2024);

  const handleUploadSuccess = (result) => {
    console.log('Upload exitoso:', result);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.mainTitle}>📊 Dashboard de Ventas - Lubricantes</h1>
        <p style={styles.subtitle}>Análisis y visualización de datos de ventas</p>
      </header>

      <div style={styles.controls}>
        <label style={styles.label}>
          Año:
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </label>
      </div>

      <FileUpload onUploadSuccess={handleUploadSuccess} />

<VentasPorMes año={selectedYear} refreshTrigger={refreshTrigger} />

<ClasificacionResiduos año={selectedYear} refreshTrigger={refreshTrigger} />
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e0e0e0'
  },
  mainTitle: {
    margin: 0,
    color: '#333',
    fontSize: '32px'
  },
  subtitle: {
    margin: '10px 0 0 0',
    color: '#666',
    fontSize: '16px'
  },
  controls: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer'
  }
};

export default Dashboard; 