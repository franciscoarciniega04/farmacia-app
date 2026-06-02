// src/screens/compras/ModalAgregarProductoCompra.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function ModalAgregarProductoCompra({ visible, onClose, onAgregar }) {
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [precio, setPrecio] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar productos al abrir el modal
  useEffect(() => {
    if (visible) {
      cargarProductos();
    } else {
      // Reset al cerrar
      setProductoSeleccionado(null);
      setBusqueda('');
      setCantidad('1');
      setPrecio('');
    }
  }, [visible]);

  // Cargar productos desde el backend
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/productos/`);
      if (!resp.ok) throw new Error('Error al cargar productos');
      const data = await resp.json();
      setProductos(data.filter((p) => p.estatus === 1)); // Solo productos activos
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Seleccionar producto
  const seleccionarProducto = (prod) => {
    setProductoSeleccionado(prod);
    setPrecio(prod.precio.toString());
  };

  // Agregar producto a la compra
  const handleAgregar = () => {
    if (!productoSeleccionado) {
      Alert.alert('Error', 'Debe seleccionar un producto');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    const precioNum = parseFloat(precio);

    if (!cantidadNum || cantidadNum <= 0) {
      Alert.alert('Error', 'La cantidad debe ser mayor a 0');
      return;
    }

    if (!precioNum || precioNum <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    onAgregar({
      idProducto: productoSeleccionado.idProducto,
      codigoProducto: productoSeleccionado.codigo,
      nombreProducto: productoSeleccionado.nombre,
      cantidad: cantidadNum,
      precio: precioNum,
    });
  };

  // Renderizar item de producto
  const renderProductoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productoItem}
      onPress={() => seleccionarProducto(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productoItemInfo}>
        <Text style={styles.productoItemNombre}>{item.nombre}</Text>
        <Text style={styles.productoItemCodigo}>Código: {item.codigo}</Text>
        <Text style={styles.productoItemStock}>Stock actual: {item.stockActual}</Text>
      </View>
      <Text style={styles.productoItemPrecio}>${item.precio.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {!productoSeleccionado ? (
            <>
              {/* Búsqueda */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nombre o código..."
                  value={busqueda}
                  onChangeText={setBusqueda}
                />
              </View>

              {/* Lista de productos */}
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3477eb" />
                </View>
              ) : (
                <FlatList
                  data={productosFiltrados}
                  renderItem={renderProductoItem}
                  keyExtractor={(item) => item.idProducto.toString()}
                  style={styles.productosList}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No se encontraron productos</Text>
                  }
                />
              )}
            </>
          ) : (
            <>
              {/* Producto seleccionado */}
              <View style={styles.selectedProduct}>
                <Text style={styles.selectedProductName}>
                  {productoSeleccionado.nombre}
                </Text>
                <Text style={styles.selectedProductCode}>
                  Código: {productoSeleccionado.codigo}
                </Text>
                <Text style={styles.selectedProductStock}>
                  Stock actual: {productoSeleccionado.stockActual}
                </Text>
              </View>

              {/* Cantidad */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cantidad:</Text>
                <TextInput
                  style={styles.input}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              {/* Precio de compra */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio de Compra:</Text>
                <TextInput
                  style={styles.input}
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>

              {/* Subtotal */}
              <View style={styles.subtotalContainer}>
                <Text style={styles.subtotalLabel}>Subtotal:</Text>
                <Text style={styles.subtotalValue}>
                  ${((parseInt(cantidad) || 0) * (parseFloat(precio) || 0)).toFixed(2)}
                </Text>
              </View>

              {/* Botones */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.button, styles.changeButton]}
                  onPress={() => setProductoSeleccionado(null)}
                >
                  <Text style={styles.buttonText}>Cambiar Producto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={handleAgregar}
                >
                  <Text style={styles.buttonText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Botón cancelar */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  productosList: {
    maxHeight: 400,
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  productoItemInfo: {
    flex: 1,
  },
  productoItemNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productoItemCodigo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  productoItemStock: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  productoItemPrecio: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3477eb',
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  selectedProduct: {
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  selectedProductCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  selectedProductStock: {
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e8f4fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3477eb',
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3477eb',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButton: {
    backgroundColor: '#aaa',
  },
  addButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#fa3a3a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
