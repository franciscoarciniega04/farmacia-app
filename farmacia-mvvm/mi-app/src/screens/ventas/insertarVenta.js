// src/screens/ventas/InsertarVentaScreen.js

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

export default function InsertarVentaScreen({ route, navigation }) {
  const { usuario, venta } = route.params || {};
  const esEdicion = Boolean(venta && venta.idVenta);

  // Estados principales
  const [idUsuario, setIdUsuario] = useState(usuario?.idUsuario || '');
  const [nombreUsuario, setNombreUsuario] = useState(usuario?.username || '');
  const [idFormaPago, setIdFormaPago] = useState('');
  const [fechaVenta, setFechaVenta] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');

  // Estados de datos
  const [formasPago, setFormasPago] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [modalProductosVisible, setModalProductosVisible] = useState(false);
  const [modalFormaPagoVisible, setModalFormaPagoVisible] = useState(false);

  // Estados offline
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    
    cargarFormasPago();
    cargarProductos();
    if (esEdicion) {
      cargarVenta();
    }
  };

  const cargarFormasPago = async () => {
    try {
      const result = await DatabaseService.fetchFormasPago();
      setFormasPago(result.data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las formas de pago');
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

  const cargarVenta = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/ventas/${venta.idVenta}`);
      if (!resp.ok) throw new Error('Error al cargar venta');
      const data = await resp.json();

      setIdUsuario(data.idUsuario);
      setNombreUsuario(data.nombreUsuario);
      setIdFormaPago(data.idFormaPago?.toString() || '');
      setFechaVenta(new Date(data.fechaVenta));
      setDetalles(data.detalles || []);
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la venta');
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

    const precio = Number(producto.precioVenta || producto.precio || 0);
    const stock = Number(producto.stockActual || 0);

    const nuevoDetalle = {
      idProducto: producto.idProducto,
      codigoProducto: producto.codigo || '',
      nombreProducto: producto.nombre || '',
      cantidad: 1,
      precio: precio,
      stockDisponible: stock,
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

    if (cantidadNum > nuevosDetalles[index].stockDisponible) {
      Alert.alert('Error', 'La cantidad supera el stock disponible');
      return;
    }

    nuevosDetalles[index].cantidad = cantidadNum;
    setDetalles(nuevosDetalles);
  };

  const actualizarPrecio = (index, precio) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index].precio = parseFloat(precio) || 0;
    setDetalles(nuevosDetalles);
  };

  const calcularSubtotal = () => {
    return detalles.reduce((sum, d) => {
      const cantidad = Number(d.cantidad) || 0;
      const precio = Number(d.precio) || 0;
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

  const calcularCambio = () => {
    const efectivo = parseFloat(efectivoRecibido) || 0;
    const total = calcularTotal();
    return Math.max(0, efectivo - total);
  };

  const getTextoFormaPagoSeleccionada = () => {
    if (!idFormaPago) return 'Seleccionar forma de pago';
    const formaPago = formasPago.find((fp) => fp.idFormaPago === parseInt(idFormaPago));
    return formaPago ? formaPago.tipo : 'Seleccionar forma de pago';
  };

  const handleGuardar = async () => {
    if (!idUsuario) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    if (!idFormaPago) {
      Alert.alert('Error', 'Debe seleccionar una forma de pago');
      return;
    }

    if (detalles.length === 0) {
      Alert.alert('Error', 'Debe agregar al menos un producto');
      return;
    }

    for (const detalle of detalles) {
      if (detalle.cantidad > detalle.stockDisponible) {
        Alert.alert(
          'Error',
          `El producto "${detalle.nombreProducto}" no tiene stock suficiente`
        );
        return;
      }
    }

    const total = calcularTotal();
    if (idFormaPago === '1') {
      const efectivo = parseFloat(efectivoRecibido) || 0;
      if (efectivo === 0) {
        Alert.alert('Error', 'Debe ingresar el efectivo recibido');
        return;
      }

      if (efectivo < total) {
        Alert.alert(
          'Efectivo Insuficiente',
          `El efectivo recibido ($${efectivo.toFixed(
            2
          )}) es menor que el total a pagar ($${total.toFixed(2)})`
        );
        return;
      }
    }

    const ventaData = {
      idUsuario: parseInt(idUsuario),
      idFormaPago: parseInt(idFormaPago),
      fechaVenta: fechaVenta.toISOString().split('T')[0],
      detalles: detalles.map((d) => ({
        idProducto: d.idProducto,
        cantidad: d.cantidad,
        precio: d.precio,
      })),
    };

    setLoading(true);
    try {
      const online = await DatabaseService.checkConnection();

      if (online) {
        // Guardar en servidor
        const url = esEdicion
          ? `${API_BASE_URL}/ventas/${venta.idVenta}`
          : `${API_BASE_URL}/ventas/`;
        const method = esEdicion ? 'PUT' : 'POST';

        const resp = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ventaData),
        });

        if (!resp.ok) {
          const error = await resp.json();
          throw new Error(error.detail || 'Error al guardar venta');
        }

        Alert.alert(
          'Éxito',
          `Venta ${esEdicion ? 'actualizada' : 'registrada'} correctamente`,
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
            'Por seguridad, no se pueden editar ventas sin conexión. Intenta nuevamente cuando tengas internet.'
          );
          return;
        }

        const formaPagoSeleccionada = formasPago.find(
          (fp) => Number(fp.idFormaPago) === Number(idFormaPago)
        );

        await DatabaseService.createVentaOffline({
          ventaData,
          detallesUI: detalles,
          usuario,
          formaPago: formaPagoSeleccionada,
        });

        Alert.alert(
          'Venta guardada offline',
          'La venta se guardó en este dispositivo, el inventario local fue actualizado y se sincronizará cuando vuelva internet.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la venta');
    } finally {
      setLoading(false);
    }
  };

  const renderProductoItem = ({ item }) => {
    const precio = Number(item.precioVenta || item.precio || 0);
    const stock = Number(item.stockActual || 0);

    return (
      <TouchableOpacity
        style={styles.productoModalItem}
        onPress={() => agregarProducto(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productoModalInfo}>
          <Text style={styles.productoModalNombre}>{item.nombre || 'Sin nombre'}</Text>
          <Text style={styles.productoModalCodigo}>Código: {item.codigo || 'N/A'}</Text>
          <Text style={styles.productoModalStock}>Stock: {stock}</Text>
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
    const precio = Number(item.precio) || 0;
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
            {esEdicion ? 'Ver Venta' : 'Nueva Venta'}
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
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={nombreUsuario}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Venta</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => !esEdicion && setShowDatePicker(true)}
                disabled={esEdicion}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateText}>
                  {fechaVenta.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={fechaVenta}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFechaVenta(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Forma de Pago *</Text>
              {esEdicion ? (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={
                    formasPago.find((fp) => fp.idFormaPago === parseInt(idFormaPago))
                      ?.tipo || ''
                  }
                  editable={false}
                />
              ) : (
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setModalFormaPagoVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      !idFormaPago && styles.selectorPlaceholder,
                    ]}
                  >
                    {getTextoFormaPagoSeleccionada()}
                  </Text>
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

            {!esEdicion && idFormaPago === '1' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Efectivo Recibido *</Text>
                  <TextInput
                    style={styles.input}
                    value={efectivoRecibido}
                    onChangeText={setEfectivoRecibido}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>

                {efectivoRecibido && parseFloat(efectivoRecibido) > 0 && (
                  <View style={styles.cambioContainer}>
                    <Text style={styles.cambioLabel}>Cambio:</Text>
                    <Text style={styles.cambioValue}>
                      ${calcularCambio().toFixed(2)}
                    </Text>
                  </View>
                )}
              </>
            )}
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

        {/* Modal Forma de Pago */}
        <Modal
          visible={modalFormaPagoVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalFormaPagoVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFP}>
              <View style={styles.modalHeaderFP}>
                <TouchableOpacity
                  onPress={() => setModalFormaPagoVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitleFP}>Forma de Pago</Text>
                <View style={{ width: 28 }} />
              </View>
              <View style={styles.modalContentFP}>
                {formasPago.map((fp) => (
                  <TouchableOpacity
                    key={fp.idFormaPago}
                    style={styles.modalItemFP}
                    onPress={() => {
                      setIdFormaPago(fp.idFormaPago.toString());
                      setModalFormaPagoVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemTextFP}>{fp.tipo}</Text>
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
  cambioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cambioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  cambioValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
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
    marginBottom: 2,
  },
  productoModalStock: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
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
  modalContainerFP: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeaderFP: {
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
  modalTitleFP: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContentFP: {
    maxHeight: 500,
  },
  modalItemFP: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecef',
  },
  modalItemTextFP: {
    fontSize: 16,
    color: '#333',
  },
});

