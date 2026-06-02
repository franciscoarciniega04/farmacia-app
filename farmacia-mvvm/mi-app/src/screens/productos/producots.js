// src/screens/productos/ProductosScreen.js

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
import useProductosViewModel from '../../hooks/useProductosViewModel';

export default function ProductosScreen({ route, navigation }) {
  const {
    buscarNombre,
    setBuscarNombre,
    buscarCodigo,
    setBuscarCodigo,
    soloActivos,
    setSoloActivos,
    productos,
    productosFiltrados,
    loading,
    refreshing,
    isOnline,
    dataSource,
    onRefresh,
    handleInsertarNuevo,
    handleEditarProducto,
    limpiarBusqueda,
  } = useProductosViewModel({ route, navigation });

  // Renderizar item de producto
  const renderProductoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productoCard}
      onPress={() => handleEditarProducto(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productoHeader}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <Text style={styles.productoCodigo}>Código: {item.codigo}</Text>
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

      <View style={styles.productoDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Precio: ${parseFloat(item.precio).toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Stock: {item.stockActual}</Text>
        </View>

        {item.categoria && (
          <View style={styles.detailRow}>
            <Ionicons name="grid-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Categoría: {item.categoria}</Text>
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
          <Text style={styles.headerTitle}>Productos</Text>
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
            <Ionicons name="barcode-outline" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por código..."
              value={buscarCodigo}
              onChangeText={setBuscarCodigo}
            />
            {buscarCodigo.length > 0 && (
              <TouchableOpacity onPress={() => setBuscarCodigo('')}>
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

            {(buscarNombre || buscarCodigo) && (
              <TouchableOpacity style={styles.clearButton} onPress={limpiarBusqueda}>
                <Ionicons name="close-circle" size={16} color="#fa3a3a" />
                <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lista de productos */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3477eb" />
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        ) : productosFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {productos.length === 0
                ? 'No hay productos registrados'
                : 'No se encontraron productos'}
            </Text>
            {productos.length === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleInsertarNuevo}
              >
                <Text style={styles.emptyButtonText}>Crear Primer Producto</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={productosFiltrados}
            renderItem={renderProductoItem}
            keyExtractor={(item) => item.idProducto.toString()}
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
  productoCard: {
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
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 4,
  },
  productoCodigo: {
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
  productoDetails: {
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
