import { useState } from 'react';
import { limpiarPorPeriodo, limpiarTodo } from '../services/ventasService';
import { Trash2, Calendar, AlertTriangle, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

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
      return 'Esto eliminará TODOS los datos de ventas de la base de datos. Esta acción no se puede deshacer.';
    }
    if (mesSeleccionado) {
      const mesNombre = meses.find(m => m.num === parseInt(mesSeleccionado))?.nombre;
      return `Esto eliminará todos los datos de ${mesNombre} ${añoSeleccionado}. Esta acción no se puede deshacer.`;
    }
    return `Esto eliminará todos los datos del año ${añoSeleccionado}. Esta acción no se puede deshacer.`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Trash2 size={20} style={styles.headerIcon} />
        <h3 style={styles.title}>Limpiar Datos</h3>
      </div>

      <div style={styles.content}>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => abrirModal('periodo')}
            style={styles.buttonPeriodo}
          >
            <Calendar size={16} />
            <span>Por período</span>
          </button>
          <button
            onClick={() => abrirModal('todo')}
            style={styles.buttonTodo}
          >
            <Trash2 size={16} />
            <span>Todo</span>
          </button>
        </div>
      </div>

      {mensaje.text && !mostrarModal && (
        <div style={{
          ...styles.mensaje,
          ...(mensaje.type === 'error' ? styles.mensajeError : styles.mensajeSuccess)
        }}>
          {mensaje.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          <span>{mensaje.text}</span>
        </div>
      )}

      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>
                {tipoLimpieza === 'todo' ? 'Eliminar todos los datos' : 'Eliminar por período'}
              </h4>
              <button onClick={cerrarModal} style={styles.closeButton} disabled={limpiando}>
                <X size={20} />
              </button>
            </div>

            {tipoLimpieza === 'periodo' && (
              <div style={styles.selectGroup}>
                <div style={styles.selectWrapper}>
                  <label style={styles.label}>Año</label>
                  <select
                    value={añoSeleccionado}
                    onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                    style={styles.select}
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div style={styles.selectWrapper}>
                  <label style={styles.label}>Mes</label>
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
                </div>
              </div>
            )}

            <div style={styles.warning}>
              <AlertTriangle size={20} style={styles.warningIcon} />
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
                {limpiando ? (
                  <>
                    <Loader2 size={16} style={styles.spinner} />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Confirmar eliminación</span>
                )}
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
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-bg)'
  },
  headerIcon: {
    color: 'var(--color-warning)'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  content: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60px'
  },
  buttonGroup: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    width: '100%'
  },
  buttonPeriodo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    flex: 1,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'var(--color-warning-light)',
    color: 'var(--color-warning)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  buttonTodo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    flex: 1,
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  mensaje: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    borderTop: '1px solid var(--color-border-light)',
    fontSize: 'var(--font-size-sm)'
  },
  mensajeSuccess: {
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)'
  },
  mensajeError: {
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    maxWidth: '420px',
    width: '90%',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideUp 0.2s ease'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--spacing-lg)'
  },
  modalTitle: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-xs)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-muted)',
    cursor: 'pointer'
  },
  selectGroup: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  selectWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)'
  },
  label: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  select: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    outline: 'none'
  },
  warning: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-warning-light)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--spacing-lg)'
  },
  warningIcon: {
    flexShrink: 0,
    color: 'var(--color-warning)'
  },
  warningText: {
    margin: 0,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    lineHeight: '1.5'
  },
  modalButtons: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    justifyContent: 'flex-end'
  },
  buttonCancelar: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  },
  buttonConfirmar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    backgroundColor: 'var(--color-danger)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

export default LimpiarDatos;
