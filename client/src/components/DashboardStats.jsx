import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Package, Scale, Users, FileText, Loader, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  getDashboardResumen,
  getLineaBaseResumen,
  getLineaBaseMensual,
  getLineaBasePorPlanta,
  getMonitoringResumen,
  getMonitoringMensual
} from '../services/statsService';

const COLORS = {
  plasticos: '#3b82f6',
  papel: '#f59e0b',
  metales: '#10b981',
  otros: '#6b7280',
  actual: '#059669',
  anterior: '#9ca3af',
  lub: '#f97316',
  blumax: '#2563eb'
};

const DashboardStats = ({ año }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [lineaBase, setLineaBase] = useState(null);
  const [mensual, setMensual] = useState(null);
  const [plantas, setPlantas] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [monitoringMensual, setMonitoringMensual] = useState(null);

  // Selectores de año para comparativas
  const [añoComparativoLB, setAñoComparativoLB] = useState(año - 1);
  const [añoComparativoMon, setAñoComparativoMon] = useState(año - 1);

  const chartRefs = {
    resumen: useRef(null),
    categorias: useRef(null),
    mensual: useRef(null),
    plantas: useRef(null),
    monitoring: useRef(null),
    monitoringMensual: useRef(null)
  };

  useEffect(() => {
    cargarDatos();
  }, [año]);

  useEffect(() => {
    setAñoComparativoLB(año - 1);
    setAñoComparativoMon(año - 1);
  }, [año]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const [resumenData, lineaBaseData, mensualData, plantasData, monitoringData, monitoringMensualData] = await Promise.all([
        getDashboardResumen(año),
        getLineaBaseResumen(año),
        getLineaBaseMensual(año),
        getLineaBasePorPlanta(año),
        getMonitoringResumen(año),
        getMonitoringMensual(año)
      ]);

      setResumen(resumenData.data);
      setLineaBase(lineaBaseData.data);
      setMensual(mensualData.data);
      setPlantas(plantasData.data);
      setMonitoring(monitoringData.data);
      setMonitoringMensual(monitoringMensualData.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const exportarGrafico = async (ref, nombre) => {
    if (!ref.current) return;

    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });

      const link = document.createElement('a');
      link.download = `${nombre}-${año}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exportando gráfico:', err);
    }
  };

  // Formato chileno: punto como separador de miles, coma para decimales
  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Formato abreviado para ejes (35M, 1.2K, etc)
  const formatNumberShort = (num) => {
    if (num >= 1000000) return (num / 1000000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'M';
    if (num >= 1000) return (num / 1000).toLocaleString('es-CL', { maximumFractionDigits: 1 }) + 'K';
    return formatNumber(num);
  };

  // Generar opciones de años para comparar
  const getAñosDisponibles = () => {
    const años = [];
    for (let i = año - 5; i < año; i++) {
      if (i > 2020) años.push(i);
    }
    return años;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} color="#059669" />
        <span>Cargando estadísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span>{error}</span>
        <button onClick={cargarDatos} style={styles.retryButton}>Reintentar</button>
      </div>
    );
  }

  // Preparar datos para gráficos
  const datosCategorias = lineaBase ? [
    { name: 'Plásticos', actual: lineaBase.actual.total['Plásticos']?.unidades || 0, anterior: lineaBase.anterior.total['Plásticos']?.unidades || 0 },
    { name: 'Papel/Cartón', actual: lineaBase.actual.total['Papel y cartón']?.unidades || 0, anterior: lineaBase.anterior.total['Papel y cartón']?.unidades || 0 },
    { name: 'Metales', actual: lineaBase.actual.total['Metales']?.unidades || 0, anterior: lineaBase.anterior.total['Metales']?.unidades || 0 }
  ] : [];

  const datosPie = plantas?.plantas || [];
  const totalPie = datosPie.reduce((sum, item) => sum + (item.unidades || 0), 0);

  const datosComparativaMensual = mensual ? mensual.actual.map((item, i) => ({
    mes: item.mes,
    [año]: item.unidades,
    [añoComparativoLB]: mensual.anterior[i]?.unidades || 0
  })) : [];

  const datosMonitoringCategorias = monitoring ? [
    { name: 'Papel y Cartón', value: monitoring.actual['Papel_y_Cartón'] || 0 },
    { name: 'Plásticos Flexibles', value: monitoring.actual['Plásticos_Flexibles'] || 0 },
    { name: 'Plásticos Rígidos', value: monitoring.actual['Plásticos_Rígidos'] || 0 },
    { name: 'Metales', value: monitoring.actual['Metales'] || 0 }
  ].filter(d => d.value > 0) : [];

  // Datos comparativos de monitoring
  const datosMonitoringComparativo = monitoring ? [
    {
      name: 'Papel/Cartón',
      actual: monitoring.actual['Papel_y_Cartón'] || 0,
      anterior: monitoring.anterior['Papel_y_Cartón'] || 0
    },
    {
      name: 'Plást. Flex.',
      actual: monitoring.actual['Plásticos_Flexibles'] || 0,
      anterior: monitoring.anterior['Plásticos_Flexibles'] || 0
    },
    {
      name: 'Plást. Rígidos',
      actual: monitoring.actual['Plásticos_Rígidos'] || 0,
      anterior: monitoring.anterior['Plásticos_Rígidos'] || 0
    },
    {
      name: 'Metales',
      actual: monitoring.actual['Metales'] || 0,
      anterior: monitoring.anterior['Metales'] || 0
    }
  ] : [];

  const datosMonitoringMensualData = monitoringMensual?.mensual || [];

  const PIE_COLORS = [COLORS.lub, COLORS.blumax];
  const MONITORING_PIE_COLORS = [COLORS.papel, COLORS.plasticos, '#8b5cf6', COLORS.metales];

  // Custom label para pie chart
  const renderCustomLabel = ({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '13px', fontWeight: '500' }}
      >
        {`${name} (${formatNumber(percent * 100)}%)`}
      </text>
    );
  };

  return (
    <div style={styles.container}>
      {/* KPIs principales */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Package size={20} color={COLORS.lub} />
            <span style={styles.kpiLabel}>Línea Base {año}</span>
          </div>
          <div style={styles.kpiValue}>{formatNumber(resumen?.lineaBase?.actual)}</div>
          <div style={styles.kpiSubtext}>unidades vendidas</div>
          <div style={{
            ...styles.kpiVariation,
            color: parseFloat(resumen?.lineaBase?.variacion) >= 0 ? COLORS.actual : '#dc2626'
          }}>
            {parseFloat(resumen?.lineaBase?.variacion) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {resumen?.lineaBase?.variacion}% vs {año - 1}
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Scale size={20} color={COLORS.actual} />
            <span style={styles.kpiLabel}>Monitoring {año}</span>
          </div>
          <div style={styles.kpiValue}>{formatNumber(resumen?.monitoring?.actual || 0, 2)}</div>
          <div style={styles.kpiSubtext}>toneladas gestionadas</div>
          <div style={{
            ...styles.kpiVariation,
            color: parseFloat(resumen?.monitoring?.variacion) >= 0 ? COLORS.actual : '#dc2626'
          }}>
            {parseFloat(resumen?.monitoring?.variacion) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {resumen?.monitoring?.variacion}% vs {año - 1}
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <Users size={20} color={COLORS.plasticos} />
            <span style={styles.kpiLabel}>Gestores Activos</span>
          </div>
          <div style={styles.kpiValue}>{resumen?.gestoresActivos || 0}</div>
          <div style={styles.kpiSubtext}>gestores de residuos</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <FileText size={20} color={COLORS.papel} />
            <span style={styles.kpiLabel}>Documentos</span>
          </div>
          <div style={styles.kpiValue}>{resumen?.documentosProcesados || 0}</div>
          <div style={styles.kpiSubtext}>facturas procesadas</div>
        </div>
      </div>

      {/* Sección Línea Base */}
      <h2 style={styles.sectionTitle}>Línea Base - Envases Vendidos</h2>

      {/* Primera fila: Categorías + Distribución por planta */}
      <div style={styles.chartRow}>
        <div style={styles.halfChart} ref={chartRefs.categorias}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Comparativa por Categoría de Material</h3>
            <button
              onClick={() => exportarGrafico(chartRefs.categorias, 'linea-base-categorias')}
              style={styles.exportButton}
            >
              <Download size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={datosCategorias} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumberShort} />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="actual" name={`Año ${año}`} fill={COLORS.actual} radius={[4, 4, 0, 0]} />
              <Bar dataKey="anterior" name={`Año ${año - 1}`} fill={COLORS.anterior} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.halfChart} ref={chartRefs.plantas}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Distribución por Planta</h3>
            <div style={styles.chartControls}>
              <div style={styles.yearSelector}>
                <Calendar size={14} />
                <select
                  value={año}
                  disabled
                  style={styles.yearSelect}
                >
                  <option value={año}>{año}</option>
                </select>
              </div>
              <button
                onClick={() => exportarGrafico(chartRefs.plantas, 'distribucion-plantas')}
                style={styles.exportButton}
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          <div style={styles.pieContainer}>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={datosPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  dataKey="unidades"
                  nameKey="nombre"
                  labelLine={true}
                  label={renderCustomLabel}
                >
                  {datosPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [formatNumber(value) + ' unidades', name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ fontSize: '13px', color: '#374151' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segunda fila: Evolución mensual - Full Width */}
      <div style={styles.fullWidthChart} ref={chartRefs.mensual}>
        <div style={styles.chartHeader}>
          <h3 style={styles.chartTitle}>Evolución Mensual</h3>
          <div style={styles.chartControls}>
            <div style={styles.yearSelector}>
              <Calendar size={14} />
              <span style={styles.yearSelectorLabel}>Comparar con:</span>
              <select
                value={añoComparativoLB}
                onChange={(e) => setAñoComparativoLB(parseInt(e.target.value))}
                style={styles.yearSelect}
              >
                {getAñosDisponibles().map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => exportarGrafico(chartRefs.mensual, 'evolucion-mensual')}
              style={styles.exportButton}
            >
              <Download size={14} />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={datosComparativaMensual} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatNumberShort} />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend
              wrapperStyle={{ fontSize: '13px' }}
              formatter={(value) => `Año ${value}`}
            />
            <Line
              type="monotone"
              dataKey={año}
              name={año}
              stroke={COLORS.actual}
              strokeWidth={2}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey={añoComparativoLB}
              name={añoComparativoLB}
              stroke={COLORS.anterior}
              strokeWidth={2}
              dot={{ r: 5 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos de Monitoring */}
      <h2 style={styles.sectionTitle}>Monitoring - Residuos Gestionados</h2>

      {/* Tercera fila: Toneladas por categoría + Evolución mensual */}
      <div style={styles.chartRow}>
        <div style={styles.halfChart} ref={chartRefs.monitoring}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Toneladas por Categoría</h3>
            <button
              onClick={() => exportarGrafico(chartRefs.monitoring, 'monitoring-categorias')}
              style={styles.exportButton}
            >
              <Download size={14} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={datosMonitoringComparativo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, 2)} />
              <Tooltip formatter={(value) => `${formatNumber(value, 3)} ton`} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="actual" name={`Año ${año}`} fill={COLORS.actual} radius={[4, 4, 0, 0]} />
              <Bar dataKey="anterior" name={`Año ${año - 1}`} fill={COLORS.anterior} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.halfChart} ref={chartRefs.monitoringMensual}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Evolución Mensual de Toneladas</h3>
            <div style={styles.chartControls}>
              <div style={styles.yearSelector}>
                <Calendar size={14} />
                <span style={styles.yearSelectorLabel}>Comparar con:</span>
                <select
                  value={añoComparativoMon}
                  onChange={(e) => setAñoComparativoMon(parseInt(e.target.value))}
                  style={styles.yearSelect}
                >
                  {getAñosDisponibles().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => exportarGrafico(chartRefs.monitoringMensual, 'monitoring-mensual')}
                style={styles.exportButton}
              >
                <Download size={14} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={datosMonitoringMensualData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v, 2)} />
              <Tooltip formatter={(value) => `${formatNumber(value, 3)} ton`} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Line
                type="monotone"
                dataKey="toneladas"
                name={`Año ${año}`}
                stroke={COLORS.actual}
                strokeWidth={2}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top gestores - Full Width */}
      {monitoring?.porGestor?.length > 0 && (
        <div style={styles.fullWidthChart}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Top 10 Gestores por Toneladas - Año {año}</h3>
          </div>
          <div style={styles.gestoresTable}>
            <div style={styles.gestoresHeader}>
              <span style={styles.gestorCol}>Gestor</span>
              <span style={styles.toneladasCol}>Toneladas</span>
              <span style={styles.barraCol}>Distribución</span>
            </div>
            {monitoring.porGestor.map((gestor, index) => {
              const maxToneladas = monitoring.porGestor[0]?.toneladas || 1;
              const porcentaje = (gestor.toneladas / maxToneladas) * 100;
              return (
                <div key={index} style={styles.gestorRow}>
                  <span style={styles.gestorCol}>{gestor.nombre}</span>
                  <span style={styles.toneladasCol}>{formatNumber(gestor.toneladas, 3)}</span>
                  <div style={styles.barraCol}>
                    <div style={styles.barraContainer}>
                      <div style={{ ...styles.barraFill, width: `${porcentaje}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-xl)',
    color: 'var(--color-text-secondary)'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-xl)',
    color: '#dc2626'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--spacing-md)'
  },
  kpiCard: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    border: '1px solid var(--color-border)'
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-sm)'
  },
  kpiLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    lineHeight: 1.2
  },
  kpiSubtext: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '2px'
  },
  kpiVariation: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    marginTop: 'var(--spacing-sm)'
  },
  sectionTitle: {
    margin: 'var(--spacing-md) 0 0 0',
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'var(--spacing-lg)'
  },
  halfChart: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    border: '1px solid var(--color-border)'
  },
  fullWidthChart: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    border: '1px solid var(--color-border)'
  },
  pieContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-md)',
    flexWrap: 'wrap',
    gap: 'var(--spacing-sm)'
  },
  chartTitle: {
    margin: 0,
    fontSize: 'var(--font-size-md)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  chartControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)'
  },
  yearSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)'
  },
  yearSelectorLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)'
  },
  yearSelect: {
    padding: '2px 6px',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    outline: 'none'
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  },
  gestoresTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  gestoresHeader: {
    display: 'flex',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    fontWeight: '600',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  gestorRow: {
    display: 'flex',
    padding: 'var(--spacing-sm)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--font-size-sm)'
  },
  gestorCol: {
    flex: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  toneladasCol: {
    width: '100px',
    textAlign: 'right',
    fontWeight: '500'
  },
  barraCol: {
    flex: 1,
    paddingLeft: 'var(--spacing-md)'
  },
  barraContainer: {
    height: '8px',
    backgroundColor: 'var(--color-border)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  barraFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  }
};

export default DashboardStats;
