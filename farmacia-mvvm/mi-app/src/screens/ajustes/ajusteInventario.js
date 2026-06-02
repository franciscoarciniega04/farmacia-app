// src/screens/ajustes/AjusteInventarioScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function AjusteInventarioScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/productos/?soloActivos=true`);
      if (!resp.ok) throw new Error('Error al cargar productos');
      const data = await resp.json();
      setProductos(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModalAjuste = (producto) => {
    setProductoSeleccionado(producto);
    setNuevaCantidad(producto.stockActual.toString());
    setComentario('');
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setProductoSeleccionado(null);
    setNuevaCantidad('');
    setComentario('');
  };

  const handleAjustar = async () => {
    if (!nuevaCantidad || isNaN(nuevaCantidad)) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    const cantidad = parseInt(nuevaCantidad);
    if (cantidad < 0) {
      Alert.alert('Error', 'La cantidad no puede ser negativa');
      return;
    }

    try {
      const resp = await fetch(
        `${API_BASE_URL}/productos/${productoSeleccionado.idProducto}/ajustar-stock`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nuevaCantidad: cantidad,
            comentario: comentario || 'Ajuste manual de inventario',
          }),
        }
      );

      if (!resp.ok) throw new Error('Error al ajustar stock');

      Alert.alert('Éxito', 'Stock ajustado correctamente');
      cerrarModal();
      cargarProductos();
    } catch (err) {
      Alert.alert('Error', 'No se pudo ajustar el stock');
    }
  };

  const renderProductoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productoCard}
      onPress={() => abrirModalAjuste(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productoInfo}>
        <Text style={styles.productoNombre}>{item.nombre}</Text>
        <Text style={styles.productoCodigo}>Código: {item.codigo}</Text>
      </View>
      <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>Stock Actual</Text>
        <Text style={styles.stockValue}>{item.stockActual}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#6f42c1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajuste de Inventario</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar producto..."
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor="#999"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6f42c1" />
          </View>
        ) : (
          <FlatList
            data={productosFiltrados}
            renderItem={renderProductoItem}
            keyExtractor={(item) => item.idProducto.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calculator-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron productos</Text>
              </View>
            }
          />
        )}

        {/* Modal de Ajuste */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={cerrarModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajustar Inventario</Text>
                <TouchableOpacity onPress={cerrarModal}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {productoSeleccionado && (
                <>
                  <View style={styles.productoModal}>
                    <Text style={styles.productoModalNombre}>
                      {productoSeleccionado.nombre}
                    </Text>
                    <Text style={styles.productoModalCodigo}>
                      Código: {productoSeleccionado.codigo}
                    </Text>
                    <View style={styles.stockActualContainer}>
                      <Text style={styles.stockActualLabel}>Stock Actual:</Text>
                      <Text style={styles.stockActualValue}>
                        {productoSeleccionado.stockActual}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nueva Cantidad *</Text>
                    <TextInput
                      style={styles.input}
                      value={nuevaCantidad}
                      onChangeText={setNuevaCantidad}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Comentario</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      value={comentario}
                      onChangeText={setComentario}
                      multiline
                      numberOfLines={3}
                      placeholder="Motivo del ajuste..."
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={cerrarModal}
                    >
                      <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={handleAjustar}
                    >
                      <Text style={styles.buttonText}>Ajustar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  listContent: {
    padding: 16,
  },
  productoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  productoCodigo: {
    fontSize: 13,
    color: '#666',
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
  },
  stockValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6f42c1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  productoModal: {
    backgroundColor: '#f8f4ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  productoModalNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6f42c1',
    marginBottom: 4,
  },
  productoModalCodigo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  stockActualContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockActualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  stockActualValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6f42c1',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#aaa',
  },
  saveButton: {
    backgroundColor: '#6f42c1',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
