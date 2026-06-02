// src/screens/proveedores/ProveedoresScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../../services/dataService';
import { API_BASE_URL } from '../../constants/config';

export default function ProveedoresScreen({ route, navigation }) {
  const { usuario } = route.params || {};

  // Estados para búsqueda y filtros
  const [buscarNombre, setBuscarNombre] = useState('');
  const [buscarRFC, setBuscarRFC] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modo offline
  const [isOnline, setIsOnline] = useState(true);
  const [dataSource, setDataSource] = useState('server');

  // Cargar proveedores al montar el componente
  useEffect(() => {
    initializeScreen();
  }, [soloActivos]);

  const initializeScreen = async () => {
    await DatabaseService.init();
    const status = await DatabaseService.getStatus();
    setIsOnline(status.isOnline);
    cargarProveedores();
  };

  // Función para cargar proveedores
  const cargarProveedores = async () => {
    setLoading(true);
    try {
      const result = await DatabaseService.fetchProveedores({ soloActivos });
      setProveedores(result.data);
      setDataSource(result.source);
      setIsOnline(result.source === 'server');

      if (result.source === 'cache') {
        console.log('⚠️ Proveedores cargados desde caché');
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      Alert.alert('Error', 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarProveedores();
  };

  // Filtrar proveedores según búsqueda
  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      p.nombre.toLowerCase().includes(buscarNombre.toLowerCase()) &&
      p.RFC.toLowerCase().includes(buscarRFC.toLowerCase())
  );

  // Navegar a insertar nuevo proveedor
  const handleInsertarNuevo = () => {
    navigation.navigate('InsertarProveedor', {
      usuario: usuario,
      onProveedorGuardado: cargarProveedores,
    });
  };

  // Ver/Editar proveedor
  const handleEditarProveedor = (proveedor) => {
    navigation.navigate('InsertarProveedor', {
      usuario: usuario,
      proveedor: proveedor,
      onProveedorGuardado: cargarProveedores,
    });
  };

  // Limpiar búsquedas
  const limpiarBusqueda = () => {
    setBuscarNombre('');
    setBuscarRFC('');
  };

  // Renderizar item de proveedor
  const renderProveedorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.proveedorCard}
      onPress={() => handleEditarProveedor(item)}
      activeOpacity={0.7}
    >
      <View style={styles.proveedorHeader}>
        <View style={styles.proveedorInfo}>
          <Text style={styles.proveedorNombre}>{item.nombre}</Text>
          <Text style={styles.proveedorRFC}>RFC: {item.RFC}</Text>
        </View>
        <View
          style={[
            styles.estatusBadge,
            { backgroundColor: item.estatus === 1 ? '#28a745' : '#6c757d' },
          ]}
        >
          <Text style={styles.estatusText}>
            {item.estatus === 1 ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={styles.proveedorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.ciudad}, {item.estado}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.telefono}</Text>
        </View>

        {item.correo && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.correo}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#2f4f7a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proveedores</Text>
          <TouchableOpacity onPress={handleInsertarNuevo} style={styles.headerButton}>
            <Ionicons name="add-circle" size={28} color="#3477eb" />
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
            {isOnline ? 'Conectado' : 'Modo Offline'}
            {dataSource === 'cache' && ' (usando datos guardados)'}
          </Text>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              value={buscarNombre}
              onChangeText={setBuscarNombre}
            />
            {buscarNombre.length > 0 && (
              <TouchableOpacity onPress={() => setBuscarNombre('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="document-text-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por RFC..."
              value={buscarRFC}
              onChangeText={setBuscarRFC}
            />
            {buscarRFC.length > 0 && (
              <TouchableOpacity onPress={() => setBuscarRFC('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtro y Limpiar */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSoloActivos(!soloActivos)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={soloActivos ? 'checkbox' : 'square-outline'}
                size={24}
                color="#3477eb"
              />
              <Text style={styles.checkboxLabel}>Solo activos</Text>
            </TouchableOpacity>

            {(buscarNombre || buscarRFC) && (
              <TouchableOpacity style={styles.clearButton} onPress={limpiarBusqueda}>
                <Ionicons name="close-circle" size={16} color="#fa3a3a" />
                <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista de proveedores */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando proveedores...</Text>
          </View>
        ) : proveedoresFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {proveedores.length === 0
                ? 'No hay proveedores registrados'
                : 'No se encontraron proveedores'}
            </Text>
            {proveedores.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleInsertarNuevo}
              >
                <Text style={styles.emptyButtonText}>Crear Primer Proveedor</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={proveedoresFiltrados}
            renderItem={renderProveedorItem}
            keyExtractor={(item) => item.idProveedor.toString()}
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
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff0f0',
    borderRadius: 6,
  },
  clearButtonText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#fa3a3a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  proveedorCard: {
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
  proveedorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  proveedorInfo: {
    flex: 1,
  },
  proveedorNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  proveedorRFC: {
    fontSize: 13,
    color: '#666',
  },
  estatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  estatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  proveedorDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
    marginBottom: 24,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#3477eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
