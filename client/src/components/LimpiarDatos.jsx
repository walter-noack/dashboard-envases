import { useState } from 'react';
import { limpiarPorPeriodo, limpiarTodo } from '../services/ventasService';

const LimpiarDatos = ({ onLimpiezaExitosa }) => {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [tipoLimpieza, setTipoLimpieza] = useState(null);
  const [añoSeleccionado, setAñoSeleccionado] = useState(2024);
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [limpiando, setLimpiando] = useState(false);
  const [mensaje, setMensaje] = useState({ type: '', text: '' });

  const meses = [
    { num: '', nombre: 'Todos los meses' },
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

  const abrirModal = (tipo) => {
    setTipoLimpieza(tipo);
    setMostrarModal(true);
    setMensaje({ type: '', text: '' });
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setTipoLimpieza(null);
  };

  const ejecutarLimpieza = async () => {
    setLimpiando(true);
    setMensaje({ type: '', text: '' });

    try {
      let resultado;

      if (tipoLimpieza === 'todo') {
        resultado = await limpiarTodo();
      } else {
        resultado = await limpiarPorPeriodo(
          añoSeleccionado,
          mesSeleccionado ? parseInt(mesSeleccionado) : null
        );
      }

      setMensaje({
        type: 'success',
        text: resultado.message
      });

      cerrarModal();

      if (onLimpiezaExitosa) {
        onLimpiezaExitosa(resultado);
      }
    } catch (error) {
      setMensaje({
        type: 'error',
        text: `Error: ${error.response?.data?.message || error.message}`
      });
    } finally {
      setLimpiando(false);
    }
  };

  const getMensajeConfirmacion = () => {
    if (tipoLimpieza === 'todo') {
      return 'Esto eliminara TODOS los datos de ventas de la base de datos. Esta accion no se puede deshacer.';
    }
    if (mesSeleccionado) {
      const mesNombre = meses.find(m => m.num === parseInt(mesSeleccionado))?.nombre;
      return `Esto eliminara todos los datos de ${mesNombre} ${añoSeleccionado}. Esta accion no se puede deshacer.`;
    }
    return `Esto eliminara todos los datos del año ${añoSeleccionado}. Esta accion no se puede deshacer.`;
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Limpiar Datos</h3>

      <div style={styles.buttonGroup}>
        <button
          onClick={() => abrirModal('periodo')}
          style={styles.buttonPeriodo}
        >
          Limpiar por Periodo
        </button>
        <button
          onClick={() => abrirModal('todo')}
          style={styles.buttonTodo}
        >
          Limpiar Todo
        </button>
      </div>

      {mensaje.text && !mostrarModal && (
        <div style={{
          ...styles.mensaje,
          ...(mensaje.type === 'error' ? styles.mensajeError : styles.mensajeSuccess)
        }}>
          {mensaje.text}
        </div>
      )}

      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h4 style={styles.modalTitle}>
              {tipoLimpieza === 'todo' ? 'Limpiar Todos los Datos' : 'Limpiar por Periodo'}
            </h4>

            {tipoLimpieza === 'periodo' && (
              <div style={styles.selectGroup}>
                <label style={styles.label}>
                  Año:
                  <select
                    value={añoSeleccionado}
                    onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                    style={styles.select}
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Mes:
                  <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
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
            )}

            <div style={styles.warning}>
              <span style={styles.warningIcon}>!</span>
              <p style={styles.warningText}>{getMensajeConfirmacion()}</p>
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={cerrarModal}
                style={styles.buttonCancelar}
                disabled={limpiando}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarLimpieza}
                style={styles.buttonConfirmar}
                disabled={limpiando}
              >
                {limpiando ? 'Eliminando...' : 'Confirmar Eliminacion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e0e0e0'
  },
  title: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#333',
    fontSize: '16px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  buttonPeriodo: {
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  buttonTodo: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  mensaje: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  mensajeSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  mensajeError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '450px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '18px'
  },
  selectGroup: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
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
    color: '#333',
    cursor: 'pointer'
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    border: '1px solid #ffc107',
    marginBottom: '20px'
  },
  warningIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    backgroundColor: '#ffc107',
    color: '#333',
    borderRadius: '50%',
    fontWeight: 'bold',
    flexShrink: 0
  },
  warningText: {
    margin: 0,
    color: '#856404',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  buttonCancelar: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonConfirmar: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default LimpiarDatos;
