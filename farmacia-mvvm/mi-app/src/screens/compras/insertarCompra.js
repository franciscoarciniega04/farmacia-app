// src/screens/compras/InsertarCompraScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatabaseService from '../../services/dataService';
import { API_BASE_URL } from '../../constants/config';

export default function InsertarCompraScreen({ route, navigation }) {
  const { usuario, compra } = route.params || {};
  const esEdicion = Boolean(compra && compra.idCompra);

  // Estados principales
  const [idProveedor, setIdProveedor] = useState('');
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [estatus, setEstatus] = useState('Pendiente');

  // Estados de datos
  const [proveedores, setProveedores] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [modalProveedorVisible, setModalProveedorVisible] = useState(false);
  const [modalEstatusVisible, setModalEstatusVisible] = useState(false);

  // Estados offline
  const [isOnline, setIsOnline] = useState(true);

  // Opciones de estatus
  const opcionesEstatus = ['Pendiente', 'Realizada', 'Cancelada'];

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    
    cargarProveedores();
    cargarProductos();
    if (esEdicion) {
      cargarCompra();
    }
  };

  const cargarProveedores = async () => {
    try {
      const result = await DatabaseService.fetchProveedores({ soloActivos: true });
      setProveedores(result.data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    }
  };

  const cargarProductos = async () => {
    try {
      const result = await DatabaseService.fetchProductos({ soloActivos: true });
      setProductos(result.data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    }
  };

  const cargarCompra = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/compras/${compra.idCompra}`);
      if (!resp.ok) throw new Error('Error al cargar compra');
      const data = await resp.json();

      setIdProveedor(data.idProveedor?.toString() || '');
      setNombreProveedor(data.nombreProveedor || '');
      setFechaCompra(new Date(data.fechaCompra));
      setEstatus(data.estatus || 'Pendiente');
      setDetalles(data.detalles || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la compra');
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarProducto = (producto) => {
    const productoExiste = detalles.find(
      (d) => d.idProducto === producto.idProducto
    );

    if (productoExiste) {
      Alert.alert('Aviso', 'Este producto ya está agregado');
      return;
    }

    const precioCompra = Number(producto.precioCompra || producto.precio || 0);

    const nuevoDetalle = {
      idProducto: producto.idProducto,
      codigoProducto: producto.codigo || '',
      nombreProducto: producto.nombre || '',
      cantidad: 1,
      precioCompra: precioCompra,
    };

    setDetalles([...detalles, nuevoDetalle]);
    setModalProductosVisible(false);
    setBusqueda('');
  };

  const eliminarProducto = (index) => {
    Alert.alert('Confirmar', '¿Eliminar este producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        onPress: () => {
          const nuevosDetalles = detalles.filter((_, i) => i !== index);
          setDetalles(nuevosDetalles);
        },
        style: 'destructive',
      },
    ]);
  };

  const actualizarCantidad = (index, cantidad) => {
    const nuevosDetalles = [...detalles];
    const cantidadNum = parseInt(cantidad) || 0;

    if (cantidadNum < 0) {
      Alert.alert('Error', 'La cantidad no puede ser negativa');
      return;
    }

    nuevosDetalles[index].cantidad = cantidadNum;
    setDetalles(nuevosDetalles);
  };

  const actualizarPrecio = (index, precio) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index].precioCompra = parseFloat(precio) || 0;
    setDetalles(nuevosDetalles);
  };

  const calcularSubtotal = () => {
    return detalles.reduce((sum, d) => {
      const cantidad = Number(d.cantidad) || 0;
      const precio = Number(d.precioCompra) || 0;
      return sum + cantidad * precio;
    }, 0);
  };

  const calcularImpuestos = () => {
    const subtotal = calcularSubtotal();
    return subtotal * 0.16;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularImpuestos();
  };

  const getTextoProveedorSeleccionado = () => {
    if (!idProveedor) return 'Seleccionar proveedor';
    const prov = proveedores.find((p) => p.idProveedor === parseInt(idProveedor));
    return prov ? prov.nombre : 'Seleccionar proveedor';
  };

  const getColorEstatus = (est) => {
    switch (est) {
      case 'Realizada':
        return '#28a745';
      case 'Pendiente':
        return '#FDC13B';
      case 'Cancelada':
        return '#fa3a3a';
      default:
        return '#6c757d';
    }
  };

  const handleGuardar = async () => {
    if (!idProveedor) {
      Alert.alert('Error', 'Debe seleccionar un proveedor');
      return;
    }

    if (detalles.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return;
    }

    for (const detalle of detalles) {
      if (detalle.cantidad <= 0) {
        Alert.alert(
          'Error',
          `El producto "${detalle.nombreProducto}" debe tener cantidad mayor a 0`
        );
        return;
      }
    }

    const compraData = {
      idProveedor: parseInt(idProveedor),
      fechaCompra: fechaCompra.toISOString().split('T')[0],
      estatus: estatus,
      detalles: detalles.map((d) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precioCompra: d.precioCompra,
      })),
    };

    setLoading(true);
    try {
      const online = await DatabaseService.checkConnection();

      if (online) {
        // Guardar en servidor
        const url = esEdicion
          ? `${API_BASE_URL}/compras/${compra.idCompra}`
          : `${API_BASE_URL}/compras/`;
        const method = esEdicion ? 'PUT' : 'POST';

        const resp = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(compraData),
        });

        if (!resp.ok) {
          const error = await resp.json();
          throw new Error(error.detail || 'Error al guardar compra');
        }

        Alert.alert(
          'Éxito',
          `Compra ${esEdicion ? 'actualizada' : 'registrada'} correctamente`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Agregar a cola de sincronización
        if (esEdicion) {
          Alert.alert(
            'Sin conexión',
            'Por seguridad, no se pueden editar compras sin conexión. Intenta nuevamente cuando tengas internet.'
          );
          return;
        }

        const proveedorSeleccionado = proveedores.find(
          (prov) => Number(prov.idProveedor) === Number(idProveedor)
        );

        await DatabaseService.createCompraOffline({
          compraData,
          detallesUI: detalles,
          proveedor: proveedorSeleccionado,
        });

        Alert.alert(
          'Compra guardada offline',
          'La compra se guardó en este dispositivo, el inventario local fue actualizado y se sincronizará cuando vuelva internet.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );;
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  const renderProductoItem = ({ item }) => {
    const precio = Number(item.precioCompra || item.precio || 0);

    return (
      <TouchableOpacity
        style={styles.productoModalItem}
        onPress={() => agregarProducto(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productoModalInfo}>
          <Text style={styles.productoModalNombre}>{item.nombre || 'Sin nombre'}</Text>
          <Text style={styles.productoModalCodigo}>Código: {item.codigo || 'N/A'}</Text>
        </View>
        <View style={styles.productoModalPrecio}>
          <Text style={styles.precioLabel}>Precio</Text>
          <Text style={styles.precioValue}>${precio.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetalleItem = ({ item, index }) => {
    const cantidad = Number(item.cantidad) || 0;
    const precio = Number(item.precioCompra) || 0;
    const subtotal = cantidad * precio;

    return (
      <View style={styles.detalleRow}>
        <View style={styles.detalleInfo}>
          <Text style={styles.detalleNombre}>{item.nombreProducto || ''}</Text>
          <Text style={styles.detalleCodigo}>{item.codigoProducto || ''}</Text>
        </View>

        <View style={styles.detalleCantidad}>
          <Text style={styles.detalleLabel}>Cant.</Text>
          {esEdicion ? (
            <Text style={styles.detalleValue}>{cantidad}</Text>
          ) : (
            <TextInput
              style={styles.inputSmall}
              value={cantidad.toString()}
              onChangeText={(text) => actualizarCantidad(index, text)}
              keyboardType="numeric"
            />
          )}
        </View>

        <View style={styles.detallePrecio}>
          <Text style={styles.detalleLabel}>Precio</Text>
          {esEdicion ? (
            <Text style={styles.detalleValue}>${precio.toFixed(2)}</Text>
          ) : (
            <TextInput
              style={styles.inputSmall}
              value={precio.toString()}
              onChangeText={(text) => actualizarPrecio(index, text)}
              keyboardType="decimal-pad"
            />
          )}
        </View>

        <View style={styles.detalleSubtotal}>
          <Text style={styles.detalleLabel}>Subtotal</Text>
          <Text style={styles.detalleValue}>${subtotal.toFixed(2)}</Text>
        </View>

        {!esEdicion && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => eliminarProducto(index)}
          >
            <Ionicons name="trash-outline" size={20} color="#fa3a3a" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="#2f4f7a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {esEdicion ? 'Ver Compra' : 'Nueva Compra'}
          </Text>
          {!esEdicion && (
            <TouchableOpacity onPress={handleGuardar} style={styles.headerButton}>
              {loading ? (
                <ActivityIndicator size="small" color="#3477eb" />
              ) : (
                <Ionicons name="checkmark" size={28} color="#3477eb" />
              )}
            </TouchableOpacity>
          )}
          {esEdicion && <View style={styles.headerButton} />}
        </View>

        {/* Indicador de estado de conexión */}
        <View style={[styles.connectionBar, !isOnline && styles.connectionBarOffline]}>
          <Ionicons
            name={isOnline ? 'cloud-done' : 'cloud-offline'}
            size={16}
            color="#fff"
          />
          <Text style={styles.connectionText}>
            {isOnline ? 'Conectado' : 'Modo Offline - Los cambios se sincronizarán'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Información General */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Proveedor *</Text>
              {esEdicion ? (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={nombreProveedor}
                  editable={false}
                />
              ) : (
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setModalProveedorVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !idProveedor && styles.selectorPlaceholder,
                    ]}
                  >
                    {getTextoProveedorSeleccionado()}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#3477eb" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Compra</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => !esEdicion && setShowDatePicker(true)}
                disabled={esEdicion}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateText}>
                  {fechaCompra.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={fechaCompra}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFechaCompra(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estatus</Text>
              {esEdicion ? (
                <View style={styles.estatusContainer}>
                  <View
                    style={[
                      styles.estatusBadge,
                      { backgroundColor: getColorEstatus(estatus) },
                    ]}
                  >
                    <Text style={styles.estatusText}>{estatus}</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setModalEstatusVisible(true)}
                >
                  <Text style={styles.selectorText}>{estatus}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#3477eb" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Productos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Productos</Text>
              {!esEdicion && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setModalProductosVisible(true)}
                >
                  <Ionicons name="add-circle" size={24} color="#3477eb" />
                  <Text style={styles.addButtonText}>Agregar</Text>
                </TouchableOpacity>
              )}
            </View>

            {detalles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay productos agregados</Text>
              </View>
            ) : (
              <FlatList
                data={detalles}
                renderItem={renderDetalleItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Totales */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${calcularSubtotal().toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA (16%):</Text>
              <Text style={styles.totalValue}>${calcularImpuestos().toFixed(2)}</Text>
            </View>

            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total:</Text>
              <Text style={styles.totalValueFinal}>${calcularTotal().toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Modal de Productos */}
        <Modal
          visible={modalProductosVisible}
          animationType="slide"
          onRequestClose={() => setModalProductosVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Producto</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalProductosVisible(false);
                  setBusqueda('');
                }}
              >
                <Ionicons name="close" size={28} color="#2f4f7a" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar producto..."
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={productosFiltrados}
              renderItem={renderProductoItem}
              keyExtractor={(item) => item.idProducto.toString()}
              contentContainerStyle={styles.modalList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No se encontraron productos</Text>
                </View>
              }
            />
          </SafeAreaView>
        </Modal>

        {/* Modal Proveedor */}
        <Modal
          visible={modalProveedorVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalProveedorVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerModal}>
              <View style={styles.modalHeaderModal}>
                <TouchableOpacity
                  onPress={() => setModalProveedorVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitleModal}>Proveedor</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContentModal}>
                {proveedores.map((prov) => (
                  <TouchableOpacity
                    key={prov.idProveedor}
                    style={styles.modalItemModal}
                    onPress={() => {
                      setIdProveedor(prov.idProveedor.toString());
                      setNombreProveedor(prov.nombre);
                      setModalProveedorVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemTextModal}>{prov.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal Estatus */}
        <Modal
          visible={modalEstatusVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalEstatusVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerModal}>
              <View style={styles.modalHeaderModal}>
                <TouchableOpacity
                  onPress={() => setModalEstatusVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitleModal}>Estatus</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContentModal}>
                {opcionesEstatus.map((est) => (
                  <TouchableOpacity
                    key={est}
                    style={styles.modalItemModal}
                    onPress={() => {
                      setEstatus(est);
                      setModalEstatusVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemTextModal}>{est}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
    paddingVertical: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
  },
  selectorPlaceholder: {
    color: '#999',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  estatusContainer: {
    flexDirection: 'row',
  },
  estatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3477eb',
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  detalleInfo: {
    flex: 2,
  },
  detalleNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f4f7a',
  },
  detalleCodigo: {
    fontSize: 11,
    color: '#666',
  },
  detalleCantidad: {
    flex: 1,
    alignItems: 'center',
  },
  detallePrecio: {
    flex: 1,
    alignItems: 'center',
  },
  detalleSubtotal: {
    flex: 1,
    alignItems: 'center',
  },
  detalleLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  detalleValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  inputSmall: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 4,
    padding: 4,
    width: 50,
    textAlign: 'center',
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  totalRowFinal: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#3477eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  totalValueFinal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3477eb',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f1f7ff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  modalList: {
    padding: 16,
  },
  productoModalItem: {
    flexDirection: 'row',
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
  productoModalInfo: {
    flex: 1,
  },
  productoModalNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  productoModalCodigo: {
    fontSize: 12,
    color: '#666',
  },
  productoModalPrecio: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  precioLabel: {
    fontSize: 11,
    color: '#666',
  },
  precioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3477eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeaderModal: {
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
  modalTitleModal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContentModal: {
    maxHeight: 500,
  },
  modalItemModal: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
  },
  modalItemTextModal: {
    fontSize: 16,
    color: '#333',
  },
});
