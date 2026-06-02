// src/screens/compras/ModalSeleccionarProveedor.js

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

export default function ModalSeleccionarProveedor({ visible, onClose, onSeleccionar }) {
  const [busqueda, setBusqueda] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar proveedores al abrir el modal
  useEffect(() => {
    if (visible) {
      cargarProveedores();
    } else {
      setBusqueda('');
    }
  }, [visible]);

  // Cargar proveedores desde el backend
  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/proveedores/?soloActivos=true`);
      if (!resp.ok) throw new Error('Error al cargar proveedores');
      const data = await resp.json();
      setProveedores(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proveedores por búsqueda
  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.RFC.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Renderizar item de proveedor
  const renderProveedorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.proveedorItem}
      onPress={() => onSeleccionar(item)}
      activeOpacity={0.7}
    >
      <View style={styles.proveedorItemInfo}>
        <Text style={styles.proveedorItemNombre}>{item.nombre}</Text>
        <Text style={styles.proveedorItemRFC}>RFC: {item.RFC}</Text>
        <Text style={styles.proveedorItemCiudad}>
          {item.ciudad}, {item.estado}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#3477eb" />
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
            <Text style={styles.modalTitle}>Seleccionar Proveedor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o RFC..."
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>

          {/* Lista de proveedores */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3477eb" />
            </View>
          ) : (
            <FlatList
              data={proveedoresFiltrados}
              renderItem={renderProveedorItem}
              keyExtractor={(item) => item.idProveedor.toString()}
              style={styles.proveedoresList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No se encontraron proveedores</Text>
              }
            />
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
  proveedoresList: {
    maxHeight: 400,
  },
  proveedorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  proveedorItemInfo: {
    flex: 1,
  },
  proveedorItemNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  proveedorItemRFC: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  proveedorItemCiudad: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
  cancelButton: {
    backgroundColor: '#aaa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
