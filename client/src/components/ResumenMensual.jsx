import { useState, useEffect } from 'react';
import { getResumenMensual } from '../services/ventasService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResumenMensual = ({ año = 2024, refreshTrigger }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSKU, setSelectedSKU] = useState(null);

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  useEffect(() => {
    fetchResumenMensual();
  }, [año, refreshTrigger]);

  const fetchResumenMensual = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getResumenMensual(año);
      
      // Procesar datos: agrupar por mes
      const dataByMonth = {};
      
      response.data.forEach(item => {
        const mes = item._id.mes;
        if (!dataByMonth[mes]) {
          dataByMonth[mes] = {
            mes: meses[mes - 1],
            mesNumero: mes,
            totalVolumen: 0,
            totalUnidades: 0
          };
        }
        dataByMonth[mes].totalVolumen += item.totalVolumen;
        dataByMonth[mes].totalUnidades += item.totalUnidades;
      });
      
      // Convertir a array y ordenar por mes
      const dataArray = Object.values(dataByMonth).sort((a, b) => a.mesNumero - b.mesNumero);
      
      setData(dataArray);
    } catch (err) {
      setError('Error cargando resumen mensual');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Cargando resumen mensual...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (data.length === 0) return <div style={styles.empty}>📭 No hay datos disponibles</div>;

  // Calcular totales anuales
  const totales = data.reduce((acc, item) => ({
    volumen: acc.volumen + item.totalVolumen,
    unidades: acc.unidades + item.totalUnidades
  }), { volumen: 0, unidades: 0 });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📈 Resumen Mensual de Ventas - {año}</h3>
      
      <div style={styles.totales}>
        <div style={styles.totalCard}>
          <div style={styles.totalLabel}>Total Volumen</div>
          <div style={styles.totalValue}>{Math.round(totales.volumen).toLocaleString()} L</div>
        </div>
        <div style={styles.totalCard}>
          <div style={styles.totalLabel}>Total Unidades</div>
          <div style={styles.totalValue}>{totales.unidades.toLocaleString()}</div>
        </div>
        <div style={styles.totalCard}>
          <div style={styles.totalLabel}>Promedio Mensual</div>
          <div style={styles.totalValue}>{Math.round(totales.volumen / data.length).toLocaleString()} L</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'Volumen (L)') return [Math.round(value).toLocaleString() + ' L', name];
              if (name === 'Unidades') return [value.toLocaleString(), name];
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="totalVolumen" 
            stroke="#8884d8" 
            strokeWidth={2}
            name="Volumen (L)"
            dot={{ r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="totalUnidades" 
            stroke="#82ca9d" 
            strokeWidth={2}
            name="Unidades"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={styles.table}>
        <table style={styles.tableElement}>
          <thead>
            <tr>
              <th style={styles.th}>Mes</th>
              <th style={styles.th}>Volumen (L)</th>
              <th style={styles.th}>Unidades</th>
              <th style={styles.th}>% del Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.mes} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>{item.mes}</td>
                <td style={styles.td}>{Math.round(item.totalVolumen).toLocaleString()}</td>
                <td style={styles.td}>{item.totalUnidades.toLocaleString()}</td>
                <td style={styles.td}>{((item.totalVolumen / totales.volumen) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#333'
  },
  totales: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
  },
  totalCard: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e0e0e0'
  },
  totalLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  totalValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  error: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    border: '1px solid #f5c6cb'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  table: {
    marginTop: '30px',
    overflowX: 'auto'
  },
  tableElement: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f4f4f4',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
    color: '#333'
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #eee',
    color: '#333'
  },
  trEven: {
    backgroundColor: '#fafafa'
  },
  trOdd: {
    backgroundColor: 'white'
  }
};

export default ResumenMensual;