// src/screens/productos/InsertarProductoScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../../services/dataService';
import { API_BASE_URL } from '../../constants/config';

export default function InsertarProductoScreen({ route, navigation }) {
  const { usuario, producto: productoInicial, onProductoGuardado } =
    route.params || {};

  // Estado del formulario
  const [producto, setProducto] = useState({
    codigo: '',
    nombre: '',
    idCategoria: '',
    descripcion: '',
    precio: '',
    stockMinimo: '',
    stockActual: '',
    estatus: true,
  });

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
  const esEdicion = !!productoInicial;

  // Estados offline
  const [isOnline, setIsOnline] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    
    cargarCategorias();
    if (productoInicial) {
      setProducto({
        codigo: productoInicial.codigo || '',
        nombre: productoInicial.nombre || '',
        idCategoria: productoInicial.idCategoria?.toString() || '',
        descripcion: productoInicial.descripcion || '',
        precio: productoInicial.precio?.toString() || '',
        stockMinimo: productoInicial.stockMinimo?.toString() || '',
        stockActual: productoInicial.stockActual?.toString() || '',
        estatus: productoInicial.estatus === 1,
      });
    }
  };

  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const result = await DatabaseService.fetchCategorias();
      setCategorias(result.data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    }
  };

  // Manejar cambios en campos
  const handleChange = (field, value) => {
    setProducto((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Obtener texto de categoría seleccionada
  const getTextoCategoriaSeleccionada = () => {
    if (!producto.idCategoria) return 'Seleccionar categoría';
    const categoria = categorias.find(
      (cat) => cat.idCategoria === parseInt(producto.idCategoria)
    );
    return categoria ? categoria.nombre : 'Seleccionar categoría';
  };

  // Guardar producto
  const handleGuardar = async () => {
    // Validaciones
    if (
      !producto.codigo ||
      !producto.nombre ||
      !producto.idCategoria ||
      !producto.precio ||
      !producto.stockMinimo ||
      !producto.stockActual
    ) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }

    const body = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: parseFloat(producto.precio),
      stockMinimo: parseInt(producto.stockMinimo),
      stockActual: parseInt(producto.stockActual),
      idCategoria: parseInt(producto.idCategoria),
      estatus: producto.estatus ? 1 : 0,
    };

    setLoading(true);
    try {
      const online = await DatabaseService.checkConnection();

      if (online) {
        // Guardar en servidor
        const url = esEdicion
          ? `${API_BASE_URL}/productos/${productoInicial.idProducto}`
          : `${API_BASE_URL}/productos/`;
        const method = esEdicion ? 'PUT' : 'POST';

        const resp = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          throw new Error(
            esEdicion ? 'Error al actualizar producto' : 'Error al guardar producto'
          );
        }

        Alert.alert(
          'Éxito',
          esEdicion
            ? '¡Producto actualizado correctamente!'
            : '¡Producto guardado correctamente!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onProductoGuardado) onProductoGuardado();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        // Agregar a cola de sincronización
        await DatabaseService.addToSyncQueue({
          type: 'producto',
          endpoint: esEdicion ? `/productos/${productoInicial.idProducto}` : '/productos/',
          method: esEdicion ? 'PUT' : 'POST',
          data: body,
        });

        Alert.alert(
          'Guardado Offline',
          'El producto se guardó localmente y se sincronizará cuando haya conexión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar producto
  const handleEliminar = () => {
    if (!productoInicial) return;

    const mensaje =
      productoInicial.estatus === 1
        ? '¿Seguro que deseas dar de baja este producto? (Quedará inactivo)'
        : '¿Seguro que deseas eliminar PERMANENTEMENTE este producto de la base de datos?';

    Alert.alert('Confirmar eliminación', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        onPress: async () => {
          setLoading(true);
          try {
            const online = await DatabaseService.checkConnection();

            if (online) {
              const resp = await fetch(
                `${API_BASE_URL}/productos/${productoInicial.idProducto}`,
                { method: 'DELETE' }
              );
              if (!resp.ok) throw new Error('Error al eliminar producto');

              Alert.alert('Éxito', 'Producto eliminado correctamente', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (onProductoGuardado) onProductoGuardado();
                    navigation.goBack();
                  },
                },
              ]);
            } else {
              await DatabaseService.addToSyncQueue({
                type: 'producto_delete',
                endpoint: `/productos/${productoInicial.idProducto}`,
                method: 'DELETE',
                data: {},
              });

              Alert.alert(
                'Eliminación Pendiente',
                'El producto se eliminará cuando haya conexión.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

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
          <Text style={styles.headerTitle}>
            {esEdicion ? 'Editar Producto' : 'Nuevo Producto'}
          </Text>
          <TouchableOpacity onPress={handleGuardar} style={styles.headerButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#3477eb" />
            ) : (
              <Ionicons name="checkmark" size={28} color="#3477eb" />
            )}
          </TouchableOpacity>
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
          {/* Código */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Código <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, esEdicion && styles.inputDisabled]}
              value={producto.codigo}
              onChangeText={(value) => handleChange('codigo', value)}
              placeholder="Ej: PROD001"
              placeholderTextColor="#999"
              editable={!esEdicion}
            />
          </View>

          {/* Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nombre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={producto.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Nombre del producto"
              placeholderTextColor="#999"
            />
          </View>

          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Categoría <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setModalCategoriaVisible(true)}
            >
              <Text
                style={[
                  styles.selectorText,
                  !producto.idCategoria && styles.selectorPlaceholder,
                ]}
              >
                {getTextoCategoriaSeleccionada()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#3477eb" />
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={producto.descripcion}
              onChangeText={(value) => handleChange('descripcion', value)}
              placeholder="Descripción del producto"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Precio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Precio <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={producto.precio}
              onChangeText={(value) => handleChange('precio', value)}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Stock Mínimo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Stock Mínimo <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={producto.stockMinimo}
              onChangeText={(value) => handleChange('stockMinimo', value)}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Stock Actual */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Stock Actual <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={producto.stockActual}
              onChangeText={(value) => handleChange('stockActual', value)}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Estatus */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>
              Estatus: {producto.estatus ? 'Activo' : 'Inactivo'}
            </Text>
            <Switch
              value={producto.estatus}
              onValueChange={(value) => handleChange('estatus', value)}
              trackColor={{ false: '#ccc', true: '#3477eb' }}
              thumbColor={producto.estatus ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Botón eliminar (solo en edición) */}
          {esEdicion && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleEliminar}
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Eliminar Producto</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Modal Categoría */}
        <Modal
          visible={modalCategoriaVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalCategoriaVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalCategoriaVisible(false)}
                  style={styles.modalBackButton}
                >
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Categoría</Text>
                <View style={{ width: 28 }} />
              </View>
              <ScrollView style={styles.modalContent}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.idCategoria}
                    style={styles.modalItem}
                    onPress={() => {
                      handleChange('idCategoria', cat.idCategoria.toString());
                      setModalCategoriaVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{cat.nombre}</Text>
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
    fontSize: 22,
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
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#fa3a3a',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  selectorPlaceholder: {
    color: '#999',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fa3a3a',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
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
    maxHeight: '80%',
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
    maxHeight: 500,
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

