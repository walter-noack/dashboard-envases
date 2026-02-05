import { useState, useEffect } from 'react';
import { LogOut, Calendar, Recycle, Droplets, Factory, Layers, BarChart3, FileCheck, PieChart, FileText } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import BlumaxUpload from '../components/BlumaxUpload';
import LimpiarDatos from '../components/LimpiarDatos';
import LimpiarDatosBlumax from '../components/LimpiarDatosBlumax';
import VentasPorMes from '../components/VentasPorMes';
import ClasificacionResiduos from '../components/ClasificacionResiduos';
import ClasificacionBlumax from '../components/ClasificacionBlumax';
import ResumenCombinado from '../components/ResumenCombinado';
import MonitoringUpload from '../components/MonitoringUpload';
import MonitoringTable from '../components/MonitoringTable';
import DashboardStats from '../components/DashboardStats';
import FichasTecnicas from '../components/FichasTecnicas';
import { getAñosDisponibles } from '../services/ventasService';

const Dashboard = ({ user, onLogout }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [añosDisponibles, setAñosDisponibles] = useState([]);
  const [activeModule, setActiveModule] = useState('estadisticas');
  const [activeSubTab, setActiveSubTab] = useState('ventas');

  // Cargar años disponibles al iniciar
  useEffect(() => {
    const cargarAños = async () => {
      try {
        const response = await getAñosDisponibles();
        if (response.success && response.data.length > 0) {
          setAñosDisponibles(response.data);
          // Seleccionar el año más reciente
          const añoMasReciente = Math.max(...response.data);
          setSelectedYear(añoMasReciente);
        } else {
          // Si no hay datos, usar año actual
          const currentYear = new Date().getFullYear();
          setAñosDisponibles([currentYear - 1, currentYear, currentYear + 1]);
        }
      } catch (error) {
        console.error('Error cargando años:', error);
        const currentYear = new Date().getFullYear();
        setAñosDisponibles([currentYear - 1, currentYear, currentYear + 1]);
      }
    };
    cargarAños();
  }, []);

  const handleUploadSuccess = (result) => {
    console.log('Upload exitoso:', result);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLimpiezaExitosa = (result) => {
    console.log('Limpieza exitosa:', result);
    setRefreshTrigger(prev => prev + 1);
  };

  const modules = [
    { id: 'estadisticas', label: 'Estadísticas', icon: PieChart, color: '#8b5cf6' },
    { id: 'lineaBase', label: 'Línea Base', icon: BarChart3, color: '#f97316' },
    { id: 'monitoring', label: 'Monitoring', icon: FileCheck, color: '#059669' },
    { id: 'fichas', label: 'Fichas Técnicas', icon: FileText, color: '#7c3aed' }
  ];

  const lineaBaseTabs = [
    { id: 'ventas', label: 'LUB', icon: Droplets },
    { id: 'blumax', label: 'Bluemax', icon: Factory },
    { id: 'resumen', label: 'Total', icon: Layers }
  ];

  const currentTabs = activeModule === 'lineaBase' ? lineaBaseTabs : null;

  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    if (moduleId === 'lineaBase') {
      setActiveSubTab('ventas');
    }
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

      {/* Module Navigation */}
      <nav style={styles.moduleNav}>
        <div style={styles.moduleContainer}>
          <div style={styles.moduleButtons}>
            {modules.map(module => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleChange(module.id)}
                  style={{
                    ...styles.moduleButton,
                    ...(isActive ? {
                      backgroundColor: `${module.color}15`,
                      color: module.color,
                      borderColor: module.color
                    } : {})
                  }}
                >
                  <Icon size={18} />
                  <span>{module.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selector de año - solo para Estadísticas y Línea Base */}
          {(activeModule === 'estadisticas' || activeModule === 'lineaBase') && (
            <div style={styles.yearSelectorNav}>
              <Calendar size={16} style={styles.yearIcon} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={styles.selectNav}
              >
                {añosDisponibles.length > 0 ? (
                  añosDisponibles.map(año => (
                    <option key={año} value={año}>{año}</option>
                  ))
                ) : (
                  <option value={selectedYear}>{selectedYear}</option>
                )}
              </select>
            </div>
          )}
        </div>
      </nav>

      {/* Sub-tabs Navigation (solo para Línea Base) */}
      {currentTabs && (
        <nav style={styles.tabNav}>
          <div style={styles.tabContainer}>
            {currentTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              const moduleColor = tab.id === 'ventas' ? '#f97316' : tab.id === 'blumax' ? '#2563eb' : '#059669';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{
                    ...styles.tabButton,
                    ...(isActive ? {
                      color: moduleColor,
                      borderBottomColor: moduleColor
                    } : {})
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <main style={styles.main}>
        {/* ESTADÍSTICAS */}
        {activeModule === 'estadisticas' && (
          <DashboardStats año={selectedYear} />
        )}

        {/* LÍNEA BASE */}
        {activeModule === 'lineaBase' && (
          <>
            {activeSubTab === 'ventas' && (
              <>
                <div style={styles.uploadSection}>
                  <FileUpload onUploadSuccess={handleUploadSuccess} año={selectedYear} />
                  <LimpiarDatos onLimpiezaExitosa={handleLimpiezaExitosa} año={selectedYear} />
                </div>
                <ClasificacionResiduos año={selectedYear} refreshTrigger={refreshTrigger} />
                <VentasPorMes año={selectedYear} refreshTrigger={refreshTrigger} />
              </>
            )}

            {activeSubTab === 'blumax' && (
              <>
                <div style={styles.uploadSection}>
                  <BlumaxUpload onUploadSuccess={handleUploadSuccess} año={selectedYear} />
                  <LimpiarDatosBlumax onLimpiezaExitosa={handleLimpiezaExitosa} año={selectedYear} />
                </div>
                <ClasificacionBlumax año={selectedYear} refreshTrigger={refreshTrigger} />
              </>
            )}

            {activeSubTab === 'resumen' && (
              <ResumenCombinado año={selectedYear} refreshTrigger={refreshTrigger} />
            )}
          </>
        )}

        {/* MONITORING (módulo unificado) */}
        {activeModule === 'monitoring' && (
          <>
            <MonitoringUpload onUploadSuccess={handleUploadSuccess} />
            <MonitoringTable año={selectedYear} refreshTrigger={refreshTrigger} />
          </>
        )}

        {/* FICHAS TÉCNICAS */}
        {activeModule === 'fichas' && (
          <FichasTecnicas />
        )}
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
  moduleNav: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    padding: 'var(--spacing-sm) 0'
  },
  moduleContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 var(--spacing-lg)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  moduleButtons: {
    display: 'flex',
    gap: 'var(--spacing-md)'
  },
  yearSelectorNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)'
  },
  selectNav: {
    padding: '4px 8px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    outline: 'none'
  },
  moduleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '2px solid transparent',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  tabNav: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)'
  },
  tabContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 var(--spacing-lg)',
    display: 'flex',
    gap: 'var(--spacing-sm)'
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
    borderBottom: '2px solid transparent',
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
