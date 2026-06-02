// src/screens/inventario/HistorialProductoScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function HistorialProductoScreen({ route, navigation }) {
  const { producto } = route.params || {};

  // Estados
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [modalTipoVisible, setModalTipoVisible] = useState(false);

  // Estados para modo offline
  const [isOnline, setIsOnline] = useState(true);

  // Opciones de filtro
  const opcionesFiltro = [
    { value: 'todos', label: 'Todos' },
    { value: 'ventas', label: 'Ventas' },
    { value: 'compras', label: 'Compras' },
    { value: 'ajustes', label: 'Ajustes Manuales' },
  ];

  // Cargar datos al montar el componente
  useEffect(() => {
    if (producto && producto.idProducto) {
      initializeScreen();
    }
  }, [producto]);

  const initializeScreen = async () => {
    // Verificar conexión
    try {
      const response = await fetch(`${API_BASE_URL}/productos/`, { timeout: 2000 });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }

    cargarHistorial();
    cargarEstadisticas();
  };

  // Función para cargar historial
  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${API_BASE_URL}/productos/${producto.idProducto}/historial`
      );
      if (!resp.ok) throw new Error('Error al cargar historial');
      const data = await resp.json();
      setHistorial(data.historial || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      
      if (!isOnline) {
        Alert.alert(
          'Modo Offline',
          'No se puede cargar el historial sin conexión. Los datos del historial requieren conexión en tiempo real.'
        );
      } else {
        Alert.alert('Error', 'No se pudo cargar el historial del producto');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const resp = await fetch(
        `${API_BASE_URL}/productos/${producto.idProducto}/estadisticas`
      );
      if (!resp.ok) throw new Error('Error al cargar estadísticas');
      const data = await resp.json();
      setEstadisticas(data.estadisticas || null);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarHistorial();
    cargarEstadisticas();
  };

  // Filtrar historial según tipo
  const historialFiltrado = historial.filter((mov) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'ventas') return mov.tipo === 'Venta';
    if (filtroTipo === 'compras') return mov.tipo === 'Compra';
    if (filtroTipo === 'ajustes') return mov.tipo === 'Ajuste Manual';
    return true;
  });

  // Obtener texto del filtro seleccionado
  const getTextoFiltroSeleccionado = () => {
    const opcion = opcionesFiltro.find((op) => op.value === filtroTipo);
    return opcion ? opcion.label : 'Todos';
  };

  // Obtener color según tipo de movimiento
  const obtenerColorTipo = (tipo) => {
    switch (tipo) {
      case 'Venta':
        return '#dc3545';
      case 'Compra':
        return '#28a745';
      case 'Ajuste Manual':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  // Obtener icono según tipo de movimiento
  const obtenerIconoTipo = (tipoMovimiento) => {
    if (tipoMovimiento === 'entrada') {
      return 'arrow-up-circle';
    } else if (tipoMovimiento === 'salida') {
      return 'arrow-down-circle';
    }
    return 'swap-horizontal';
  };

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return fechaStr;
    }
  };

  // Renderizar item de historial
  const renderHistorialItem = ({ item }) => (
    <View style={styles.historialCard}>
      <View style={styles.historialHeader}>
        <View style={styles.tipoContainer}>
          <Ionicons
            name={obtenerIconoTipo(item.tipoMovimiento)}
            size={20}
            color={obtenerColorTipo(item.tipo)}
          />
          <View
            style={[
              styles.tipoBadge,
              { backgroundColor: obtenerColorTipo(item.tipo) },
            ]}
          >
            <Text style={styles.tipoText}>{item.tipo}</Text>
          </View>
        </View>
        <Text style={styles.cantidadText}>
          {item.tipoMovimiento === 'entrada' ? '+' : '-'}
          {item.cantidad}
        </Text>
      </View>

      <View style={styles.historialDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{formatearFecha(item.fecha)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.usuario}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={14} color="#666" />
          <Text style={styles.detailText}>{item.referencia}</Text>
        </View>

        {item.precioUnitario && (
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={14} color="#666" />
            <Text style={styles.detailText}>
              Precio Unit: ${item.precioUnitario.toFixed(2)} | Total: $
              {item.total.toFixed(2)}
            </Text>
          </View>
        )}

        {item.comentario && (
          <View style={styles.comentarioContainer}>
            <Text style={styles.comentarioText}>{item.comentario}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2f4f7a" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Historial</Text>
            <Text style={styles.headerSubtitle}>{producto?.nombre}</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        {/* Indicador de estado de conexión */}
        <View style={[styles.connectionBar, !isOnline && styles.connectionBarOffline]}>
          <Ionicons
            name={isOnline ? 'cloud-done' : 'cloud-offline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.connectionText}>
            {isOnline ? 'Conectado' : 'Modo Offline - Historial no disponible'}
          </Text>
        </View>

        {/* Información del producto */}
        <View style={styles.productoInfo}>
          <View style={styles.productoInfoRow}>
            <Text style={styles.productoInfoLabel}>Código:</Text>
            <Text style={styles.productoInfoValue}>{producto?.codigo}</Text>
          </View>
          <View style={styles.productoInfoRow}>
            <Text style={styles.productoInfoLabel}>Stock Actual:</Text>
            <Text style={styles.productoInfoValue}>{producto?.stockActual}</Text>
          </View>
        </View>

        {/* Estadísticas */}
        {estadisticas && (
          <View style={styles.estadisticasContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.estadisticasContent}
            >
              <View style={[styles.estadisticaCard, { backgroundColor: '#28a745' }]}>
                <Text style={styles.estadisticaValue}>
                  {estadisticas.total_comprado}
                </Text>
                <Text style={styles.estadisticaLabel}>Comprado</Text>
              </View>

              <View style={[styles.estadisticaCard, { backgroundColor: '#dc3545' }]}>
                <Text style={styles.estadisticaValue}>
                  {estadisticas.total_vendido}
                </Text>
                <Text style={styles.estadisticaLabel}>Vendido</Text>
              </View>

              <View style={[styles.estadisticaCard, { backgroundColor: '#3477eb' }]}>
                <Text style={styles.estadisticaValue}>
                  ${estadisticas.ingresos_por_ventas?.toFixed(2)}
                </Text>
                <Text style={styles.estadisticaLabel}>Ingresos</Text>
              </View>

              <View style={[styles.estadisticaCard, { backgroundColor: '#ff6b6b' }]}>
                <Text style={styles.estadisticaValue}>
                  ${estadisticas.gastos_por_compras?.toFixed(2)}
                </Text>
                <Text style={styles.estadisticaLabel}>Gastos</Text>
              </View>

              <View style={[styles.estadisticaCard, { backgroundColor: '#ffc107' }]}>
                <Text style={styles.estadisticaValue}>
                  ${estadisticas.margen_bruto?.toFixed(2)}
                </Text>
                <Text style={styles.estadisticaLabel}>Margen</Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Filtro de tipo */}
        <View style={styles.filtroContainer}>
          <Text style={styles.filtroLabel}>Filtrar por tipo:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setModalTipoVisible(true)}
          >
            <Text style={styles.selectorText}>
              {getTextoFiltroSeleccionado()}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#3477eb" />
          </TouchableOpacity>
        </View>

        {/* Lista de historial */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : historialFiltrado.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {historial.length === 0
                ? 'No hay movimientos registrados'
                : 'No hay movimientos del tipo seleccionado'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={historialFiltrado}
            renderItem={renderHistorialItem}
            keyExtractor={(item, index) => `${item.idMovimiento}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3477eb']}
              />
            }
          />
        )}

        {/* Modal Tipo de Movimiento */}
        <Modal
          visible={modalTipoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalTipoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalTipoVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tipo de Movimiento</Text>
                <View style={{ width: 28 }} />
              </View>
              <ScrollView style={styles.modalContent}>
                {opcionesFiltro.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.value}
                    style={styles.modalItem}
                    onPress={() => {
                      setFiltroTipo(opcion.value);
                      setModalTipoVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{opcion.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f1f7ff',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  connectionBar: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  connectionBarOffline: {
    backgroundColor: '#fa3a3a',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productoInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  productoInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productoInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  productoInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  estadisticasContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  estadisticasContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  estadisticaCard: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  estadisticaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  filtroContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  filtroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  historialCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cantidadText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  historialDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  comentarioContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  comentarioText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#3477eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
