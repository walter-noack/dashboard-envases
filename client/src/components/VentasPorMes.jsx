import { useState, useEffect } from 'react';
import { getVentasConResiduos } from '../services/ventasService';

// Formato: punto para miles, coma para decimales
const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('es-CL', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const VentasPorMes = ({ año = 2024, refreshTrigger }) => {
    const [mesSeleccionado, setMesSeleccionado] = useState(1);
    const [productos, setProductos] = useState([]);
    const [totales, setTotales] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    const meses = [
        { num: 1, nombre: 'Enero' },
        { num: 2, nombre: 'Febrero' },
        { num: 3, nombre: 'Marzo' },
        { num: 4, nombre: 'Abril' },
        { num: 5, nombre: 'Mayo' },
        { num: 6, nombre: 'Junio' },
        { num: 7, nombre: 'Julio' },
        { num: 8, nombre: 'Agosto' },
        { num: 9, nombre: 'Septiembre' },
        { num: 10, nombre: 'Octubre' },
        { num: 11, nombre: 'Noviembre' },
        { num: 12, nombre: 'Diciembre' }
    ];

    useEffect(() => {
        fetchVentasConResiduos();
    }, [año, mesSeleccionado, refreshTrigger]);

    const fetchVentasConResiduos = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getVentasConResiduos(año, mesSeleccionado);
            setProductos(response.data);
            setTotales(response.totales);
        } catch (err) {
            setError('Error cargando ventas del mes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar productos por búsqueda
    const productosFiltrados = productos.filter(producto =>
        producto.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>📋 Ventas Detalladas por Mes con Residuos</h3>

            <div style={styles.filters}>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>
                        Mes:
                        <select
                            value={mesSeleccionado}
                            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                            style={styles.select}
                        >
                            {meses.map(mes => (
                                <option key={mes.num} value={mes.num}>
                                    {mes.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.label}>
                        Buscar:
                        <input
                            type="text"
                            placeholder="SKU o nombre del producto..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={styles.searchInput}
                        />
                    </label>
                </div>
            </div>

            {loading && <div style={styles.loading}>⏳ Cargando ventas y calculando residuos...</div>}
            {error && <div style={styles.error}>{error}</div>}

            {!loading && !error && productos.length === 0 && (
                <div style={styles.empty}>📭 No hay ventas registradas para este mes</div>
            )}

            {!loading && !error && productos.length > 0 && totales && (
                <>
                    <div style={styles.summary}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Productos</div>
                            <div style={styles.summaryValue}>{formatNumber(totales.productos, 0)}</div>
                        </div>
                        <div style={{ ...styles.summaryCard, ...styles.summaryCardResiduos }}>
                            <div style={styles.summaryLabel}>Residuos Totales</div>
                            <div style={styles.summaryValue}>{formatNumber(totales.residuosTotales)} kg</div>
                            <div style={styles.summaryDetail}>
                                Plásticos: {formatNumber(totales.plasticos)} kg<br />
                                Papel/Cartón: {formatNumber(totales.papelCarton)} kg<br />
                                Metales: {formatNumber(totales.metales)} kg
                            </div>
                        </div>
                        {totales.productosSinMapeo > 0 && (
                            <div style={{ ...styles.summaryCard, ...styles.summaryCardWarning }}>
                                <div style={styles.summaryLabel}>Sin Mapeo</div>
                                <div style={styles.summaryValue}>{totales.productosSinMapeo}</div>
                                <div style={styles.summaryDetail}>productos sin datos de residuos</div>
                            </div>
                        )}
                    </div>

                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>#</th>
                                    <th style={styles.th}>SKU</th>
                                    <th style={styles.th}>Producto</th>
                                    <th style={styles.th}>Envase</th>
                                    <th style={styles.th}>Volumen (L)</th>
                                    <th style={styles.th}>Unidades</th>
                                    <th style={styles.th}>Tipo Envase</th>
                                    <th style={styles.th}>Residuos (kg)</th>
                                    <th style={styles.th}>Plásticos (kg)</th>
                                    <th style={styles.th}>Papel (kg)</th>
                                    <th style={styles.th}>Metales (kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosFiltrados.map((producto, index) => (
                                    <tr key={producto.sku} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                                        <td style={styles.td}>{index + 1}</td>
                                        <td style={styles.td}>{producto.sku}</td>
                                        <td style={styles.td}>{producto.nombre}</td>
                                        <td style={styles.td}>{producto.envase}</td>
                                        <td style={styles.td}>{formatNumber(producto.volumen)}</td>
                                        <td style={styles.td}>{formatNumber(producto.unidades, 0)}</td>
                                        <td style={styles.td}>
                                            {producto.tipoEnvaseMapeado || <span style={styles.sinDatos}>Sin mapeo</span>}
                                        </td>
                                        <td style={producto.residuos ? styles.td : styles.tdSinDatos}>
                                            {producto.residuos ? formatNumber(producto.residuos.totalKg) : '-'}
                                        </td>
                                        <td style={styles.td}>
                                            {producto.residuos ? formatNumber(producto.residuos.plasticos) : '-'}
                                        </td>
                                        <td style={styles.td}>
                                            {producto.residuos ? formatNumber(producto.residuos.papelCarton) : '-'}
                                        </td>
                                        <td style={styles.td}>
                                            {producto.residuos ? formatNumber(producto.residuos.metales) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        minHeight: '800px'
    },
    title: {
        marginTop: 0,
        marginBottom: '20px',
        color: '#333'
    },
    filters: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
        marginBottom: '5px'
    },
    select: {
        marginTop: '5px',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        cursor: 'pointer',
        color: '#333'
    },
    searchInput: {
        marginTop: '5px',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px'
    },
    summary: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
    },
    summaryCard: {
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #e0e0e0'
    },
    summaryCardResiduos: {
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50'
    },
    summaryCardWarning: {
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800'
    },
    summaryLabel: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '8px'
    },
    summaryValue: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '5px'
    },
    summaryDetail: {
        fontSize: '12px',
        color: '#666',
        marginTop: '8px',
        lineHeight: '1.4'
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
    tableContainer: {
        overflowX: 'auto',
        height: '600px',
        overflowY: 'auto'
    },
    table: {
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
        position: 'sticky',
        top: 0,
        zIndex: 1,
        color: '#333'
    },
    td: {
        padding: '10px 12px',
        borderBottom: '1px solid #eee',
        color: '#333'
    },
    tdSinDatos: {
        padding: '10px 12px',
        borderBottom: '1px solid #eee',
        color: '#999',
        fontStyle: 'italic'
    },
    sinDatos: {
        color: '#ff9800',
        fontStyle: 'italic',
        fontSize: '12px'
    },
    trEven: {
        backgroundColor: '#fafafa'
    },
    trOdd: {
        backgroundColor: 'white'
    }
};

export default VentasPorMes;