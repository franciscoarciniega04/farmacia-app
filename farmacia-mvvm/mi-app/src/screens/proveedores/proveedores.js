// src/screens/proveedores/ProveedoresScreen.js

import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useProveedoresViewModel from '../../hooks/useProveedoresViewModel';

export default function ProveedoresScreen({ route, navigation }) {
  const {
    buscarNombre,
    setBuscarNombre,
    buscarRFC,
    setBuscarRFC,
    soloActivos,
    setSoloActivos,
    proveedores,
    proveedoresFiltrados,
    loading,
    refreshing,
    isOnline,
    dataSource,
    onRefresh,
    handleInsertarNuevo,
    handleEditarProveedor,
    limpiarBusqueda,
  } = useProveedoresViewModel({ route, navigation });

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
            { backgroundColor: item.estatus === 1 ? '#28a745' : '#dc3545' },
          ]}
        >
          <Text style={styles.estatusText}>
            {item.estatus === 1 ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <View style={styles.proveedorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.ciudad}, {item.estado}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.detailText}>{item.telefono}</Text>
        </View>
        {item.correo && (
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={16} color="#666" />
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
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Proveedores</Text>
          <TouchableOpacity
            onPress={handleInsertarNuevo}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add-circle" size={32} color="#3477eb" />
          </TouchableOpacity>
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre..."
              value={buscarNombre}
              onChangeText={setBuscarNombre}
              placeholderTextColor="#999"
            />
            {buscarNombre.length > 0 && (
              <TouchableOpacity onPress={() => setBuscarNombre('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.searchInputContainer}>
            <Ionicons name="document-text" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por RFC..."
              value={buscarRFC}
              onChangeText={setBuscarRFC}
              placeholderTextColor="#999"
              autoCapitalize="characters"
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
              <TouchableOpacity
                style={styles.clearButton}
                onPress={limpiarBusqueda}
              >
                <Ionicons name="close-circle" size={18} color="#fa3a3a" />
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
            <Ionicons name="people-outline" size={64} color="#ccc" />
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
                <Text style={styles.emptyButtonText}>
                  Crear Primer Proveedor
                </Text>
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
