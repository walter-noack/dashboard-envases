import { useState } from 'react';
import { LogOut, Calendar, Recycle } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import LimpiarDatos from '../components/LimpiarDatos';
import VentasPorMes from '../components/VentasPorMes';
import ClasificacionResiduos from '../components/ClasificacionResiduos';

const Dashboard = ({ user, onLogout }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedYear, setSelectedYear] = useState(2024);

  const handleUploadSuccess = (result) => {
    console.log('Upload exitoso:', result);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLimpiezaExitosa = (result) => {
    console.log('Limpieza exitosa:', result);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <Recycle size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h1 style={styles.mainTitle}>Dashboard de Residuos</h1>
              <p style={styles.subtitle}>Análisis de ventas y envases</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <div style={styles.yearSelector}>
              <Calendar size={16} style={styles.yearIcon} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={styles.select}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <div style={styles.userSection}>
              <span style={styles.userEmail}>{user?.email}</span>
              <button onClick={onLogout} style={styles.logoutButton}>
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.uploadSection}>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <LimpiarDatos onLimpiezaExitosa={handleLimpiezaExitosa} />
        </div>

        <ClasificacionResiduos año={selectedYear} refreshTrigger={refreshTrigger} />
        <VentasPorMes año={selectedYear} refreshTrigger={refreshTrigger} />
        
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--color-bg)'
  },
  header: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--spacing-lg)'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)'
  },
  brandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-accent)'
  },
  mainTitle: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-lg)'
  },
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)'
  },
  yearIcon: {
    color: 'var(--color-text-muted)'
  },
  select: {
    padding: '4px 8px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    outline: 'none'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)'
  },
  userEmail: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'var(--spacing-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)'
  },
  uploadSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'var(--spacing-lg)'
  }
};

export default Dashboard;
