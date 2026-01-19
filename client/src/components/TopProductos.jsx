import { useState, useEffect } from 'react';
import { getTopProductos } from '../services/ventasService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TopProductos = ({ año = 2024, limite = 10, refreshTrigger }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTopProductos();
  }, [año, limite, refreshTrigger]);

  const fetchTopProductos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTopProductos(año, limite);
      
      // Formatear datos para el gráfico
      const formattedData = response.data.map(item => ({
        nombre: item._id.materialNombre.substring(0, 30) + '...',
        sku: item._id.material,
        volumen: Math.round(item.totalVolumen),
        unidades: item.totalUnidades
      }));
      
      setProductos(formattedData);
    } catch (err) {
      setError('Error cargando top productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>⏳ Cargando top productos...</div>;
  if (error) return <div style={styles.error}>{error}</div>;
  if (productos.length === 0) return <div style={styles.empty}>📭 No hay datos disponibles</div>;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🏆 Top {limite} Productos por Volumen - {año}</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={productos} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="sku" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'volumen') return [value.toLocaleString() + ' L', 'Volumen'];
              if (name === 'unidades') return [value.toLocaleString(), 'Unidades'];
            }}
          />
          <Legend />
          <Bar dataKey="volumen" fill="#8884d8" name="Volumen (L)" />
          <Bar dataKey="unidades" fill="#82ca9d" name="Unidades" />
        </BarChart>
      </ResponsiveContainer>

      <div style={styles.table}>
        <table style={styles.tableElement}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Producto</th>
              <th style={styles.th}>Volumen (L)</th>
              <th style={styles.th}>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto, index) => (
              <tr key={producto.sku} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>{producto.sku}</td>
                <td style={styles.td}>{producto.nombre}</td>
                <td style={styles.td}>{producto.volumen.toLocaleString()}</td>
                <td style={styles.td}>{producto.unidades.toLocaleString()}</td>
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
    marginTop: '20px',
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

export default TopProductos;