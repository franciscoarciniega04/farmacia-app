// src/screens/reportes/ReporteProductosVendidosScreen.js

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
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL } from '../../constants/config';

export default function ReporteProductosVendidosScreen({ route, navigation }) {
  const { titulo } = route.params || {};

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

  // Cargar datos al montar y cuando cambien las fechas
  useEffect(() => {
    cargarReporte();
  }, [fechaInicio, fechaFin]);

  // Función para cargar reporte
  const cargarReporte = async () => {
    setLoading(true);
    try {
      const inicio = fechaInicio.toISOString().split('T')[0];
      const fin = fechaFin.toISOString().split('T')[0];
      
      // Obtener ventas del período
      const resp = await fetch(
        `${API_BASE_URL}/ventas/?fechaInicio=${inicio}&fechaFin=${fin}`
      );
      if (!resp.ok) throw new Error('Error al cargar ventas');
      const ventas = await resp.json();

      // Procesar datos para agrupar por producto
      const productosMap = {};
      
      for (const venta of ventas) {
        // Obtener detalles de la venta
        const respDetalle = await fetch(
          `${API_BASE_URL}/ventas/${venta.idVenta}`
        );
        if (respDetalle.ok) {
          const ventaDetalle = await respDetalle.json();
          
          ventaDetalle.detalles.forEach((detalle) => {
            const key = detalle.idProducto;
            if (!productosMap[key]) {
              productosMap[key] = {
                idProducto: detalle.idProducto,
                codigoProducto: detalle.codigoProducto,
                nombreProducto: detalle.nombreProducto,
                unidadesVendidas: 0,
                totalVendido: 0,
              };
            }
            productosMap[key].unidadesVendidas += detalle.cantidad;
            productosMap[key].totalVendido += detalle.cantidad * detalle.precio;
          });
        }
      }

      // Convertir a array y ordenar por unidades vendidas
      const productosArray = Object.values(productosMap).sort(
        (a, b) => b.unidadesVendidas - a.unidadesVendidas
      );

      setProductos(productosArray);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      Alert.alert('Error', 'No se pudo cargar el reporte de productos vendidos');
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

  // Obtener icono de posición
  const getIconoPosicion = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  // Renderizar item de producto
  const renderProductoItem = ({ item, index }) => (
    <View style={styles.productoCard}>
      <View style={styles.posicionContainer}>
        <Text style={styles.posicionText}>{getIconoPosicion(index)}</Text>
      </View>
      <View style={styles.productoInfo}>
        <Text style={styles.productoNombre}>{item.nombreProducto}</Text>
        <Text style={styles.productoCodigo}>Código: {item.codigoProducto}</Text>
      </View>
      <View style={styles.estadisticasContainer}>
        <View style={styles.estadisticaItem}>
          <Text style={styles.estadisticaLabel}>Unidades</Text>
          <Text style={styles.estadisticaValue}>{item.unidadesVendidas}</Text>
        </View>
        <View style={styles.estadisticaItem}>
          <Text style={styles.estadisticaLabel}>Total</Text>
          <Text style={[styles.estadisticaValue, { color: '#28a745' }]}>
            ${item.totalVendido.toFixed(2)}
          </Text>
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

        {/* Filtros de fecha */}
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtrosTitle}>Rango de Fechas</Text>
          <View style={styles.fechasRow}>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerInicio(true)}
            >
              <Ionicons name="calendar" size={18} color="#dc3545" />
              <Text style={[styles.fechaText, { color: '#dc3545' }]}>
                {fechaInicio.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fechaSeparator}>hasta</Text>
            <TouchableOpacity
              style={styles.fechaButton}
              onPress={() => setShowDatePickerFin(true)}
            >
              <Ionicons name="calendar" size={18} color="#dc3545" />
              <Text style={[styles.fechaText, { color: '#dc3545' }]}>
                {fechaFin.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.resumenContainer}>
          <View style={[styles.resumenCard, { backgroundColor: '#ffe8e8' }]}>
            <Text style={styles.resumenLabel}>Productos Vendidos</Text>
            <Text style={[styles.resumenValue, { color: '#dc3545' }]}>
              {productos.length}
            </Text>
          </View>
          <View style={[styles.resumenCard, { backgroundColor: '#ffe8e8' }]}>
            <Text style={styles.resumenLabel}>Total Unidades</Text>
            <Text style={[styles.resumenValue, { color: '#dc3545' }]}>
              {productos.reduce((sum, p) => sum + p.unidadesVendidas, 0)}
            </Text>
          </View>
        </View>

        {/* Lista de productos */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc3545" />
            <Text style={styles.loadingText}>Cargando reporte...</Text>
          </View>
        ) : productos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trending-up-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay ventas en el período seleccionado
            </Text>
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

        {/* Date Pickers */}
        {showDatePickerInicio && (
          <DateTimePicker
            value={fechaInicio}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerInicio(false);
              if (selectedDate) {
                setFechaInicio(selectedDate);
              }
            }}
          />
        )}

        {showDatePickerFin && (
          <DateTimePicker
            value={fechaFin}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePickerFin(false);
              if (selectedDate) {
                setFechaFin(selectedDate);
              }
            }}
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
  filtrosContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e3e3e3',
  },
  filtrosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  fechasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fechaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe8e8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  fechaText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fechaSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
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
  posicionContainer: {
    width: 40,
    alignItems: 'center',
  },
  posicionText: {
    fontSize: 24,
    fontWeight: '700',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2f4f7a',
    marginBottom: 2,
  },
  productoCodigo: {
    fontSize: 12,
    color: '#666',
  },
  estadisticasContainer: {
    gap: 4,
  },
  estadisticaItem: {
    alignItems: 'flex-end',
  },
  estadisticaLabel: {
    fontSize: 11,
    color: '#666',
  },
  estadisticaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc3545',
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
