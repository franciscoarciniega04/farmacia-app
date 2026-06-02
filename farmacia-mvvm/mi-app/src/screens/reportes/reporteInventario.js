// src/screens/reportes/ReporteInventarioScreen.js

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../constants/config';

export default function ReporteInventarioScreen({ route, navigation }) {
  const { titulo } = route.params || {};

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalProductos, setTotalProductos] = useState(0);
  const [productosAlerta, setProductosAlerta] = useState(0);

  // Cargar datos al montar
  useEffect(() => {
    cargarReporte();
  }, []);

  // Función para cargar reporte
  const cargarReporte = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/productos/?soloActivos=false`);
      if (!resp.ok) throw new Error('Error al cargar reporte');
      const data = await resp.json();
      setProductos(data);
      setTotalProductos(data.length);

      // Contar productos en alerta
      const alerta = data.filter(
        (p) => Number(p.stockActual) <= Number(p.stockMinimo)
      ).length;
      setProductosAlerta(alerta);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      Alert.alert('Error', 'No se pudo cargar el reporte de inventario');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarReporte();
  };

  // Verificar si el stock está bajo
  const esStockBajo = (producto) => {
    return Number(producto.stockActual) <= Number(producto.stockMinimo);
  };

  // Renderizar item de producto
  const renderProductoItem = ({ item }) => (
    <View
      style={[
        styles.productoCard,
        esStockBajo(item) && styles.productoCardAlerta,
      ]}
    >
      <View style={styles.productoHeader}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoNombre}>{item.nombre}</Text>
          <Text style={styles.productoCodigo}>Código: {item.codigo}</Text>
        </View>
        {esStockBajo(item) && (
          <View style={styles.alertaBadge}>
            <Ionicons name="warning" size={16} color="#fff" />
            <Text style={styles.alertaText}>Alerta</Text>
          </View>
        )}
      </View>
      <View style={styles.productoDetails}>
        <View style={styles.stockRow}>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Stock Actual</Text>
            <Text
              style={[
                styles.stockValue,
                esStockBajo(item) && styles.stockBajo,
              ]}
            >
              {item.stockActual}
            </Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Stock Mínimo</Text>
            <Text style={styles.stockValue}>{item.stockMinimo}</Text>
          </View>
          <View style={styles.stockItem}>
            <Text style={styles.stockLabel}>Estado</Text>
            <Ionicons
              name={esStockBajo(item) ? 'close-circle' : 'checkmark-circle'}
              size={24}
              color={esStockBajo(item) ? '#fa3a3a' : '#28a745'}
            />
          </View>
        </View>
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
            <Ionicons name="arrow-back" size={26} color="#3477eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{titulo}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={[styles.resumenCard, { backgroundColor: '#e8f4fd' }]}>
            <Text style={styles.resumenLabel}>Total Productos</Text>
            <Text style={[styles.resumenValue, { color: '#3477eb' }]}>
              {totalProductos}
            </Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#fff0f0' }]}>
            <Text style={styles.resumenLabel}>En Alerta</Text>
            <Text style={[styles.resumenValue, { color: '#fa3a3a' }]}>
              {productosAlerta}
            </Text>
          </View>
        </View>

        {/* Lista de productos */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffc107" />
            <Text style={styles.loadingText}>Cargando reporte...</Text>
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay productos registrados</Text>
          </View>
        ) : (
          <FlatList
            data={productos}
            renderItem={renderProductoItem}
            keyExtractor={(item) => item.idProducto.toString()}
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
    fontSize: 20,
    fontWeight: '700',
    color: '#2f4f7a',
  },
  resumenContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
    gap: 12,
  },
  resumenCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: '700',
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
  productoCardAlerta: {
    borderLeftWidth: 4,
    borderLeftColor: '#fa3a3a',
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
  alertaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fa3a3a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  alertaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productoDetails: {},
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  stockBajo: {
    color: '#fa3a3a',
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
});
