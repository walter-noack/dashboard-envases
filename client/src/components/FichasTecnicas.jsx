import { useState, useEffect } from 'react';
import {
  FileText, Search, Download, Eye, Edit3, X, Check, Upload,
  Loader2, AlertCircle, Package, ChevronLeft, Filter, CheckSquare, Square
} from 'lucide-react';
import {
  getSKUsDisponibles, getFichaBySKU, upsertFicha,
  descargarPDF, descargarPDFLote, uploadImagen
} from '../services/fichasService';

const FichasTecnicas = () => {
  const [skus, setSKUs] = useState([]);
  const [filteredSKUs, setFilteredSKUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroFicha, setFiltroFicha] = useState('todos'); // todos, conFicha, sinFicha
  const [selectedSKU, setSelectedSKU] = useState(null);
  const [fichaDetalle, setFichaDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ nombreComercial: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState([]);
  const [mensaje, setMensaje] = useState({ type: '', text: '' });

  useEffect(() => {
    cargarSKUs();
  }, []);

  useEffect(() => {
    filtrarSKUs();
  }, [skus, search, filtroFicha]);

  const cargarSKUs = async () => {
    setLoading(true);
    try {
      const response = await getSKUsDisponibles();
      if (response.success) {
        setSKUs(response.data);
      }
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error cargando SKUs' });
    } finally {
      setLoading(false);
    }
  };

  const filtrarSKUs = () => {
    let filtered = [...skus];

    // Filtro por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.sku.toLowerCase().includes(searchLower) ||
        s.nombreProducto?.toLowerCase().includes(searchLower) ||
        s.categoria?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado de ficha
    if (filtroFicha === 'conFicha') {
      filtered = filtered.filter(s => s.tieneFicha);
    } else if (filtroFicha === 'sinFicha') {
      filtered = filtered.filter(s => !s.tieneFicha);
    }

    setFilteredSKUs(filtered);
  };

  const verDetalle = async (sku) => {
    setSelectedSKU(sku);
    setLoadingDetalle(true);
    setEditMode(false);
    try {
      const response = await getFichaBySKU(sku);
      if (response.success) {
        setFichaDetalle(response.data);
        setEditData({
          nombreComercial: response.data.nombreComercial || '',
          descripcion: response.data.descripcion || ''
        });
      }
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error cargando detalle' });
    } finally {
      setLoadingDetalle(false);
    }
  };

  const guardarFicha = async () => {
    setSaving(true);
    try {
      const response = await upsertFicha({
        sku: selectedSKU,
        nombreComercial: editData.nombreComercial,
        descripcion: editData.descripcion
      });
      if (response.success) {
        setMensaje({ type: 'success', text: 'Ficha guardada exitosamente' });
        setEditMode(false);
        cargarSKUs();
        verDetalle(selectedSKU);
      }
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error guardando ficha' });
    } finally {
      setSaving(false);
    }
  };

  const handleDescargarPDF = async (sku) => {
    setDownloading(true);
    try {
      await descargarPDF(sku);
      setMensaje({ type: 'success', text: 'PDF descargado' });
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error descargando PDF' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDescargarLote = async () => {
    if (selectedForBatch.length === 0) {
      setMensaje({ type: 'error', text: 'Selecciona al menos un SKU' });
      return;
    }
    setDownloading(true);
    try {
      await descargarPDFLote(selectedForBatch);
      setMensaje({ type: 'success', text: `${selectedForBatch.length} PDFs descargados` });
      setSelectedForBatch([]);
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error descargando PDFs' });
    } finally {
      setDownloading(false);
    }
  };

  const toggleSelectForBatch = (sku) => {
    setSelectedForBatch(prev =>
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
    );
  };

  const selectAllVisible = () => {
    const visibleSKUs = filteredSKUs.map(s => s.sku);
    setSelectedForBatch(visibleSKUs);
  };

  const handleImageUpload = async (e, tipo = 'producto') => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await uploadImagen(selectedSKU, file, tipo);
      if (response.success) {
        setMensaje({ type: 'success', text: `Imagen de ${tipo} subida` });
        verDetalle(selectedSKU);
        cargarSKUs();
      }
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error subiendo imagen' });
    }
  };

  // Limpiar mensaje después de 3 segundos
  useEffect(() => {
    if (mensaje.text) {
      const timer = setTimeout(() => setMensaje({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const stats = {
    total: skus.length,
    conFicha: skus.filter(s => s.tieneFicha).length,
    sinFicha: skus.filter(s => !s.tieneFicha).length
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <FileText size={24} style={styles.headerIcon} />
          <div>
            <h2 style={styles.title}>Fichas Técnicas de Productos</h2>
            <p style={styles.subtitle}>
              {stats.total} SKUs | {stats.conFicha} con ficha personalizada
            </p>
          </div>
        </div>
        {selectedForBatch.length > 0 && (
          <button
            onClick={handleDescargarLote}
            disabled={downloading}
            style={styles.batchButton}
          >
            {downloading ? <Loader2 size={16} style={styles.spinner} /> : <Download size={16} />}
            <span>Descargar {selectedForBatch.length} PDFs</span>
          </button>
        )}
      </div>

      {/* Mensaje */}
      {mensaje.text && (
        <div style={{
          ...styles.mensaje,
          ...(mensaje.type === 'error' ? styles.mensajeError : styles.mensajeSuccess)
        }}>
          {mensaje.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{mensaje.text}</span>
        </div>
      )}

      <div style={styles.content}>
        {/* Panel izquierdo: Lista de SKUs */}
        <div style={styles.listPanel}>
          {/* Búsqueda y filtros */}
          <div style={styles.searchBar}>
            <div style={styles.searchInput}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar por SKU o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.filterButtons}>
              <button
                onClick={() => setFiltroFicha('todos')}
                style={{
                  ...styles.filterBtn,
                  ...(filtroFicha === 'todos' ? styles.filterBtnActive : {})
                }}
              >
                Todos
              </button>
              <button
                onClick={() => setFiltroFicha('conFicha')}
                style={{
                  ...styles.filterBtn,
                  ...(filtroFicha === 'conFicha' ? styles.filterBtnActive : {})
                }}
              >
                Con ficha
              </button>
            </div>
          </div>

          {/* Acciones de selección */}
          <div style={styles.selectionBar}>
            <button onClick={selectAllVisible} style={styles.selectAllBtn}>
              <CheckSquare size={14} />
              <span>Seleccionar visibles ({filteredSKUs.length})</span>
            </button>
            {selectedForBatch.length > 0 && (
              <button onClick={() => setSelectedForBatch([])} style={styles.clearBtn}>
                <X size={14} />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Lista de SKUs */}
          <div style={styles.skuList}>
            {loading ? (
              <div style={styles.loadingState}>
                <Loader2 size={24} style={styles.spinner} />
                <span>Cargando productos...</span>
              </div>
            ) : filteredSKUs.length === 0 ? (
              <div style={styles.emptyState}>
                <Package size={32} strokeWidth={1.5} />
                <span>No se encontraron productos</span>
              </div>
            ) : (
              filteredSKUs.map((item) => (
                <div
                  key={item.sku}
                  style={{
                    ...styles.skuItem,
                    ...(selectedSKU === item.sku ? styles.skuItemSelected : {})
                  }}
                >
                  <div
                    style={styles.checkbox}
                    onClick={(e) => { e.stopPropagation(); toggleSelectForBatch(item.sku); }}
                  >
                    {selectedForBatch.includes(item.sku) ? (
                      <CheckSquare size={18} style={{ color: '#2563eb' }} />
                    ) : (
                      <Square size={18} style={{ color: '#94a3b8' }} />
                    )}
                  </div>
                  <div style={styles.skuContent} onClick={() => verDetalle(item.sku)}>
                    <div style={styles.skuHeader}>
                      <span style={styles.skuCode}>{item.sku}</span>
                      {item.tieneFicha && (
                        <span style={{...styles.badge, ...styles.badgeSuccess}}>
                          Ficha
                        </span>
                      )}
                    </div>
                    <div style={styles.skuName}>{item.nombreProducto}</div>
                    <div style={styles.skuMeta}>
                      <span>{item.categoria}</span>
                      {item.capacidad && <span>• {item.capacidad}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDescargarPDF(item.sku); }}
                    style={styles.downloadBtn}
                    title="Descargar PDF"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho: Detalle de ficha */}
        <div style={styles.detailPanel}>
          {!selectedSKU ? (
            <div style={styles.emptyDetail}>
              <Eye size={48} strokeWidth={1} />
              <span>Selecciona un producto para ver su ficha</span>
            </div>
          ) : loadingDetalle ? (
            <div style={styles.loadingState}>
              <Loader2 size={24} style={styles.spinner} />
              <span>Cargando ficha...</span>
            </div>
          ) : fichaDetalle ? (
            <div style={styles.fichaPreview}>
              {/* Header de ficha */}
              <div style={styles.fichaHeader}>
                <button onClick={() => setSelectedSKU(null)} style={styles.backBtn}>
                  <ChevronLeft size={20} />
                </button>
                <h3 style={styles.fichaTitulo}>Ficha Técnica</h3>
                <div style={styles.fichaActions}>
                  {!editMode && (
                    <button onClick={() => setEditMode(true)} style={styles.editBtn}>
                      <Edit3 size={16} />
                      <span>Editar</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDescargarPDF(selectedSKU)}
                    disabled={downloading}
                    style={styles.pdfBtn}
                  >
                    {downloading ? <Loader2 size={16} style={styles.spinner} /> : <Download size={16} />}
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Contenido de ficha */}
              <div style={styles.fichaContent}>
                {/* Info básica */}
                <div style={styles.fichaSection}>
                  <div style={styles.fichaRow}>
                    <span style={styles.fichaLabel}>SKU</span>
                    <span style={styles.fichaValue}>{fichaDetalle.sku}</span>
                  </div>
                  <div style={styles.fichaRow}>
                    <span style={styles.fichaLabel}>Nombre Comercial</span>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.nombreComercial}
                        onChange={(e) => setEditData({ ...editData, nombreComercial: e.target.value })}
                        style={styles.editInput}
                      />
                    ) : (
                      <span style={styles.fichaValue}>{fichaDetalle.nombreComercial}</span>
                    )}
                  </div>
                  <div style={styles.fichaRow}>
                    <span style={styles.fichaLabel}>Categoría</span>
                    <span style={styles.fichaValue}>{fichaDetalle.categoria}</span>
                  </div>
                  <div style={styles.fichaRow}>
                    <span style={styles.fichaLabel}>Capacidad</span>
                    <span style={styles.fichaValue}>{fichaDetalle.capacidad || 'N/A'}</span>
                  </div>
                </div>

                {/* Imágenes: Producto y Envase */}
                <div style={styles.imagenesContainer}>
                  {/* Imagen de Producto */}
                  <div style={styles.imagenBox}>
                    <span style={styles.imagenLabel}>Producto</span>
                    {fichaDetalle.imagenProducto || fichaDetalle.imagen ? (
                      <img
                        src={fichaDetalle.imagenProducto || fichaDetalle.imagen}
                        alt="Producto"
                        style={styles.productoImg}
                      />
                    ) : (
                      <div style={styles.imgPlaceholder}>
                        <Package size={32} strokeWidth={1} />
                        <span>Sin imagen</span>
                      </div>
                    )}
                    {editMode && (
                      <label style={styles.uploadLabel}>
                        <Upload size={14} />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'producto')}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Imagen de Envase */}
                  <div style={styles.imagenBox}>
                    <span style={styles.imagenLabel}>Envase</span>
                    {fichaDetalle.imagenEnvase ? (
                      <img
                        src={fichaDetalle.imagenEnvase}
                        alt="Envase"
                        style={styles.productoImg}
                      />
                    ) : (
                      <div style={styles.imgPlaceholder}>
                        <Package size={32} strokeWidth={1} />
                        <span>Sin imagen</span>
                      </div>
                    )}
                    {editMode && (
                      <label style={styles.uploadLabel}>
                        <Upload size={14} />
                        <span>Subir</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'envase')}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Composición de residuos */}
                <div style={styles.fichaSection}>
                  <h4 style={styles.sectionTitle}>Composición de Residuos</h4>
                  {fichaDetalle.componentes?.length > 0 ? (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Componente</th>
                          <th style={styles.th}>Material</th>
                          <th style={styles.th}>Peso (g)</th>
                          <th style={styles.th}>Código</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fichaDetalle.componentes.map((comp, idx) => (
                          <tr key={idx}>
                            <td style={styles.td}>{comp.nombre}</td>
                            <td style={styles.td}>{comp.material}</td>
                            <td style={styles.td}>{comp.pesoGramos}</td>
                            <td style={styles.td}>{comp.codigoClasificacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={styles.noData}>Sin información de composición</p>
                  )}
                </div>

                {/* Clasificación */}
                <div style={styles.fichaSection}>
                  <h4 style={styles.sectionTitle}>Clasificación</h4>
                  <div style={styles.badges}>
                    <span style={{
                      ...styles.classificationBadge,
                      ...(fichaDetalle.resumen?.esPeligroso ? styles.badgeDanger : styles.badgeSafe)
                    }}>
                      {fichaDetalle.resumen?.esPeligroso ? 'PELIGROSO' : 'NO PELIGROSO'}
                    </span>
                    <span style={{
                      ...styles.classificationBadge,
                      ...(fichaDetalle.resumen?.domiciliario === 'DOMICILIARIO' ? styles.badgeDom : styles.badgeNoDom)
                    }}>
                      {fichaDetalle.resumen?.domiciliario || 'NO DOMICILIARIO'}
                    </span>
                  </div>
                  <div style={styles.pesoTotal}>
                    Peso Total: <strong>{fichaDetalle.resumen?.pesoTotalGramos || 0} g</strong>
                    ({((fichaDetalle.resumen?.pesoTotalGramos || 0) / 1000).toFixed(3)} kg)
                  </div>
                </div>

                {/* Especificaciones técnicas del envase */}
                {fichaDetalle.especificacionesEnvase && (
                  <div style={styles.fichaSection}>
                    <h4 style={styles.sectionTitle}>Especificaciones Técnicas del Envase</h4>
                    <div style={styles.especificacionesGrid}>
                      {/* Imagen técnica */}
                      {fichaDetalle.especificacionesEnvase.imagenTecnica && (
                        <div style={styles.especImagen}>
                          <img
                            src={fichaDetalle.especificacionesEnvase.imagenTecnica}
                            alt="Envase"
                            style={styles.imagenTecnica}
                          />
                        </div>
                      )}

                      {/* Datos de especificaciones */}
                      <div style={styles.especDatos}>
                        {fichaDetalle.especificacionesEnvase.materialPrincipal && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Material:</span>
                            <span style={styles.especValue}>{fichaDetalle.especificacionesEnvase.materialPrincipal}</span>
                          </div>
                        )}
                        {fichaDetalle.especificacionesEnvase.proveedor && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Proveedor:</span>
                            <span style={styles.especValue}>{fichaDetalle.especificacionesEnvase.proveedor}</span>
                          </div>
                        )}
                        {fichaDetalle.especificacionesEnvase.codigoProveedor && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Código:</span>
                            <span style={styles.especValue}>{fichaDetalle.especificacionesEnvase.codigoProveedor}</span>
                          </div>
                        )}

                        {/* Dimensiones */}
                        {fichaDetalle.especificacionesEnvase.dimensiones && (
                          <>
                            {fichaDetalle.especificacionesEnvase.dimensiones.altura?.valor && (
                              <div style={styles.especItem}>
                                <span style={styles.especLabel}>Altura:</span>
                                <span style={styles.especValue}>
                                  {fichaDetalle.especificacionesEnvase.dimensiones.altura.valor}
                                  {fichaDetalle.especificacionesEnvase.dimensiones.altura.tolerancia && ` ± ${fichaDetalle.especificacionesEnvase.dimensiones.altura.tolerancia}`} mm
                                </span>
                              </div>
                            )}
                            {fichaDetalle.especificacionesEnvase.dimensiones.diametro?.valor && (
                              <div style={styles.especItem}>
                                <span style={styles.especLabel}>Diámetro:</span>
                                <span style={styles.especValue}>
                                  {fichaDetalle.especificacionesEnvase.dimensiones.diametro.valor}
                                  {fichaDetalle.especificacionesEnvase.dimensiones.diametro.tolerancia && ` ± ${fichaDetalle.especificacionesEnvase.dimensiones.diametro.tolerancia}`} mm
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Peso del envase */}
                        {fichaDetalle.especificacionesEnvase.pesoEnvase?.total?.valor && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Peso envase:</span>
                            <span style={styles.especValue}>
                              {fichaDetalle.especificacionesEnvase.pesoEnvase.total.valor}
                              {fichaDetalle.especificacionesEnvase.pesoEnvase.total.tolerancia && ` ± ${fichaDetalle.especificacionesEnvase.pesoEnvase.total.tolerancia}`} g
                            </span>
                          </div>
                        )}

                        {/* Capacidad */}
                        {fichaDetalle.especificacionesEnvase.capacidadEnvase?.nominal && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Capacidad:</span>
                            <span style={styles.especValue}>
                              {fichaDetalle.especificacionesEnvase.capacidadEnvase.nominal} L
                              {fichaDetalle.especificacionesEnvase.capacidadEnvase.rebalse && ` (rebalse: ${fichaDetalle.especificacionesEnvase.capacidadEnvase.rebalse} L)`}
                            </span>
                          </div>
                        )}

                        {fichaDetalle.especificacionesEnvase.vidaUtil && (
                          <div style={styles.especItem}>
                            <span style={styles.especLabel}>Vida útil:</span>
                            <span style={styles.especValue}>{fichaDetalle.especificacionesEnvase.vidaUtil}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Condiciones de almacenaje */}
                    {fichaDetalle.especificacionesEnvase.condicionesAlmacenaje && (
                      <div style={styles.almacenajeBox}>
                        <strong>Condiciones de almacenaje:</strong> {fichaDetalle.especificacionesEnvase.condicionesAlmacenaje}
                      </div>
                    )}
                  </div>
                )}

                {/* Nota al pie con última modificación */}
                {fichaDetalle.updatedAt && (
                  <div style={styles.footerNote}>
                    Última modificación: {new Date(fichaDetalle.updatedAt).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}

                {/* Botones de edición */}
                {editMode && (
                  <div style={styles.editActions}>
                    <button onClick={() => setEditMode(false)} style={styles.cancelBtn}>
                      Cancelar
                    </button>
                    <button onClick={guardarFicha} disabled={saving} style={styles.saveBtn}>
                      {saving ? <Loader2 size={16} style={styles.spinner} /> : <Check size={16} />}
                      <span>Guardar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    height: 'calc(100vh - 220px)',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-lg)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: '#7c3aed'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)'
  },
  headerIcon: {
    color: '#c4b5fd'
  },
  title: {
    margin: 0,
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: 'white'
  },
  subtitle: {
    margin: 0,
    marginTop: '2px',
    fontSize: 'var(--font-size-sm)',
    color: '#c4b5fd'
  },
  batchButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'white',
    color: '#7c3aed',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
    cursor: 'pointer'
  },
  mensaje: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
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
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  listPanel: {
    width: '400px',
    borderRight: '1px solid var(--color-border-light)',
    display: 'flex',
    flexDirection: 'column'
  },
  searchBar: {
    padding: 'var(--spacing-md)',
    borderBottom: '1px solid var(--color-border-light)'
  },
  searchInput: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)'
  },
  searchIcon: {
    color: 'var(--color-text-muted)'
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: 'var(--font-size-sm)',
    outline: 'none'
  },
  filterButtons: {
    display: 'flex',
    gap: 'var(--spacing-xs)',
    marginTop: 'var(--spacing-sm)'
  },
  filterBtn: {
    flex: 1,
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    fontSize: 'var(--font-size-xs)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  },
  filterBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
    color: 'white'
  },
  selectionBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderBottom: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-bg)'
  },
  selectAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: '4px 8px',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer'
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: '4px 8px',
    fontSize: 'var(--font-size-xs)',
    backgroundColor: 'var(--color-danger-light)',
    border: 'none',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer'
  },
  skuList: {
    flex: 1,
    overflowY: 'auto'
  },
  skuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderBottom: '1px solid var(--color-border-light)',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },
  skuItemSelected: {
    backgroundColor: '#f5f3ff'
  },
  checkbox: {
    cursor: 'pointer'
  },
  skuContent: {
    flex: 1,
    minWidth: 0
  },
  skuHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)'
  },
  skuCode: {
    fontWeight: '600',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)'
  },
  badge: {
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: '500',
    borderRadius: 'var(--radius-full)'
  },
  badgeSuccess: {
    backgroundColor: 'var(--color-success-light)',
    color: 'var(--color-success)'
  },
  badgePending: {
    backgroundColor: 'var(--color-warning-light)',
    color: 'var(--color-warning)'
  },
  skuName: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  skuMeta: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    display: 'flex',
    gap: 'var(--spacing-xs)'
  },
  downloadBtn: {
    padding: 'var(--spacing-xs)',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)'
  },
  detailPanel: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: 'var(--color-bg)'
  },
  emptyDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--color-text-muted)',
    gap: 'var(--spacing-md)'
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 'var(--spacing-md)',
    color: 'var(--color-text-secondary)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-2xl)',
    color: 'var(--color-text-muted)',
    gap: 'var(--spacing-md)'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  fichaPreview: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  fichaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)',
    padding: 'var(--spacing-md) var(--spacing-lg)',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border-light)'
  },
  backBtn: {
    padding: 'var(--spacing-xs)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)'
  },
  fichaTitulo: {
    flex: 1,
    margin: 0,
    fontSize: 'var(--font-size-md)',
    fontWeight: '600'
  },
  fichaActions: {
    display: 'flex',
    gap: 'var(--spacing-sm)'
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)'
  },
  pdfBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)'
  },
  fichaContent: {
    flex: 1,
    overflow: 'auto',
    padding: 'var(--spacing-lg)'
  },
  fichaSection: {
    marginBottom: 'var(--spacing-lg)',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--spacing-md)',
    border: '1px solid var(--color-border-light)'
  },
  fichaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--spacing-sm) 0',
    borderBottom: '1px solid var(--color-border-light)'
  },
  fichaLabel: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    fontWeight: '500'
  },
  fichaValue: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-primary)',
    fontWeight: '500'
  },
  editInput: {
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)',
    width: '60%'
  },
  imagenSection: {
    marginBottom: 'var(--spacing-lg)',
    textAlign: 'center'
  },
  imagenesContainer: {
    display: 'flex',
    gap: 'var(--spacing-lg)',
    justifyContent: 'center',
    marginBottom: 'var(--spacing-lg)',
    flexWrap: 'wrap'
  },
  imagenBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-sm)'
  },
  imagenLabel: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  productoImg: {
    maxWidth: '180px',
    maxHeight: '180px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)',
    objectFit: 'contain',
    backgroundColor: 'white'
  },
  imgPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '200px',
    height: '200px',
    margin: '0 auto',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--color-border)',
    color: 'var(--color-text-muted)',
    gap: 'var(--spacing-sm)'
  },
  uploadLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    marginTop: 'var(--spacing-sm)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)'
  },
  sectionTitle: {
    margin: '0 0 var(--spacing-md) 0',
    fontSize: 'var(--font-size-sm)',
    fontWeight: '600',
    color: 'var(--color-text-primary)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-size-sm)'
  },
  th: {
    padding: 'var(--spacing-sm)',
    textAlign: 'left',
    backgroundColor: 'var(--color-bg)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border-light)'
  },
  td: {
    padding: 'var(--spacing-sm)',
    borderBottom: '1px solid var(--color-border-light)'
  },
  noData: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
    fontStyle: 'italic'
  },
  badges: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    marginBottom: 'var(--spacing-md)'
  },
  classificationBadge: {
    padding: 'var(--spacing-xs) var(--spacing-md)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: '600'
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  badgeSafe: {
    backgroundColor: '#dcfce7',
    color: '#16a34a'
  },
  badgeDom: {
    backgroundColor: '#fef3c7',
    color: '#d97706'
  },
  badgeNoDom: {
    backgroundColor: '#e0e7ff',
    color: '#4f46e5'
  },
  pesoTotal: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)'
  },
  footerNote: {
    marginTop: 'var(--spacing-lg)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    borderTop: '1px solid var(--color-border-light)'
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--spacing-sm)',
    marginTop: 'var(--spacing-lg)'
  },
  cancelBtn: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)'
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    backgroundColor: 'var(--color-success)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: 'var(--font-size-sm)'
  },
  // Estilos para especificaciones técnicas del envase
  especificacionesGrid: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: 'var(--spacing-md)',
    alignItems: 'start'
  },
  especImagen: {
    textAlign: 'center'
  },
  imagenTecnica: {
    maxWidth: '150px',
    maxHeight: '150px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)'
  },
  especDatos: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  },
  especItem: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-xs) 0',
    borderBottom: '1px solid var(--color-border-light)'
  },
  especLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    fontWeight: '500',
    minWidth: '100px'
  },
  especValue: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-primary)',
    fontWeight: '500'
  },
  almacenajeBox: {
    marginTop: 'var(--spacing-md)',
    padding: 'var(--spacing-sm)',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-secondary)'
  }
};

export default FichasTecnicas;
